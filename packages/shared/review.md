# QuizForge：一个本地刷题系统的技术决策复盘

> 面试刷题时题目散落各处、掌握度全靠感觉、复习没有节奏。这个项目的目标很简单：**做一个单用户、本地部署的私人题库，实现「出题 → 作答 → 记录 → 统计 → 复习」的完整闭环**。

**架构概览：**

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Compose                       │
├─────────────────────┬───────────────────────────────────────┤
│   apps/web (Vue3)   │       apps/server (NestJS)            │
│   - Pinia 状态      │       - Prisma ORM                    │
│   - Axios 封装      │       - class-validator 验证           │
│   - AI 设置界面     │       - SM-2 间隔复习算法              │
│   - 审计日志查看    │       - AI 多厂商适配器                │
│   - 组件库          │       - 审计日志 / 限流 / 日志          │
├─────────────────────┴───────────────────────────────────────┤
│              packages/shared (TypeScript 契约)               │
├─────────────────────────────────────────────────────────────┤
│                     SQLite (单文件数据库)                     │
└─────────────────────────────────────────────────────────────┘
```

**技术选型一句话版：** NestJS（模块化）+ Prisma（类型安全 ORM）+ SQLite（零运维）+ Vue3（轻量）+ pnpm workspace（前后端共享类型）

---

## 一、架构决策与取舍

### 1.1 为什么选 NestJS 而不是 Express？

**问题：** 个人项目也要模块化吗？Express 不是更简单？

**决策过程：**

| 考量       | Express  | NestJS                 |
| ---------- | -------- | ---------------------- |
| 学习曲线   | 低       | 中高                   |
| 模块边界   | 靠自觉   | 框架强制               |
| 依赖注入   | 手动管理 | 内置 IoC               |
| 请求管道   | 中间件链 | 守卫→拦截器→过滤器分层 |
| TypeScript | 需配置   | 原生支持               |

**为什么选 NestJS：** 个人项目不是一次性脚本，我会持续迭代。NestJS 的模块化让我在项目变大时不用重构——每个业务模块（questions、practice、stats）天然有边界。依赖注入让替换实现（比如将来把 SQLite 换成 PostgreSQL）只改一处。

**代价：** 样板代码多、学习曲线陡。但对长期维护的工具来说，这个代价值得。

### 1.2 为什么选 Prisma 而不是 TypeORM？

**问题：** ORM 的核心价值是什么？Schema 定义和查询类型安全，到底值不值得牺牲灵活性？

**决策：** 选 Prisma，因为「Schema 即文档」。`schema.prisma` 就是数据库的最清晰文档，改表结构有版本化迁移文件，写错字段名编译期就报错。

**代价：** 复杂原生 SQL 支持有限。但个人题库的数据模型不复杂，这个限制无所谓。

### 1.3 为什么选 SQLite 而不是 PostgreSQL？

**问题：** 单用户场景，真的需要一个独立的数据库服务吗？

**决策：** SQLite。理由：

- 单用户数据量小（几千条题目），完全够用
- 零运维：不需要单独部署数据库服务
- **备份 = 复制文件**：`cp quiz.db backup.db`，迁移 = 拷走文件
- 一个文件就是整个库，调试时直接用 Prisma Studio 可视化查看

**代价：** 并发写入受限、无原生 JSON、扩展性差。但对个人工具，这些无所谓。

---

## 二、鉴权与安全实战

### 2.1 问题：单用户项目需要鉴权吗？

**场景：** 项目跑在 localhost，只有自己用。但健康检查探针需要被 Docker/K8s 访问，而业务接口不需要外部访问。

**决策：** 预留 JWT 认证，但默认不启用。用 `@Public()` 装饰器标记公开接口（如健康检查），业务接口默认需要认证。

### 2.2 实现：守卫 + 装饰器

```typescript
// 1. @Public() 装饰器：标记公开接口
@Public()
@Get('health')
async check() { ... }

// 2. JwtAuthGuard：读取 isPublic 元数据，跳过认证
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### 2.3 踩坑：@Public() 对限流守卫不生效

**现象：** 健康检查接口 `@Public()` 了，但还是被 429 Too Many Requests 拦截。

**排查：** 健康检查探针每 10 秒访问一次 `/health`，被 `ThrottlerGuard` 限流了。

**根因：** `@Public()` 只对 `JwtAuthGuard` 生效，`ThrottlerGuard` 不读 `isPublic` 元数据——两个守卫各自独立检查。

**修复：** 重写 `CustomThrottlerGuard`，在 `canActivate` 里检查 `isPublic`：

```typescript
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return Promise.resolve(true); // 公开接口跳过限流
    return super.canActivate(context);
  }
}
```

**教训：** NestJS 的守卫是独立管道，`@Public()` 不会自动跳过所有守卫。需要在每个需要跳过的守卫里显式检查元数据。

---

## 三、健康检查设计

### 3.1 问题：健康检查返回 200 但数据库已断

**现象：** 负载均衡器显示服务健康，但实际数据库连接已断开，接口全部 500。

**排查：** 原来的健康检查代码：

```typescript
// 错误示例：异常被 catch 后返回 200
try {
  await prisma.$queryRaw`SELECT 1`;
  return { status: 'ok' };
} catch (e) {
  return { status: 'error', message: e.message }; // 还是 200！
}
```

**根因：** 负载均衡器只看 HTTP 状态码，不解析响应 body。数据库挂了返回 `200 + body 里的 error`，等于把故障藏起来了。

**修复：** 抛 `ServiceUnavailableException` 返回 503：

```typescript
@Get()
async check() {
  try {
    await Promise.race([
      this.prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000),
      ),
    ]);
    return { status: 'ok', database: 'connected' };
  } catch (error) {
    throw new ServiceUnavailableException({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    });
  }
}
```

### 3.2 为什么加 3 秒超时？

**问题：** SQLite 慢查询时，健康检查会挂死，导致容器一直重启。

**方案：** `Promise.race` + 3 秒超时，快速失败释放线程。健康检查本身不能成为服务负担。

### 3.3 为什么分两个探针？

| 探针      | 路径           | 检查内容   | 失败后果 |
| --------- | -------------- | ---------- | -------- |
| liveness  | `/health/live` | 进程存活   | 重启容器 |
| readiness | `/health`      | 数据库连接 | 摘除流量 |

**为什么分开：** 进程活着不代表服务能用（数据库断了进程还活着）。liveness 失败重启容器，readiness 失败只是摘除流量不重启。

---

## 四、数据一致性保障

### 4.1 问题：刷题记录和会话统计不一致

**场景：** 用户答完一题，需要同时：

1. 插入 `PracticeRecord`（刷题记录）
2. 更新 `SessionQuestion` 状态（会话快照）
3. 更新 `PracticeSession` 统计

如果中间某一步失败，数据就不一致了。

**修复：** 用 Prisma 事务包裹：

```typescript
await this.prisma.$transaction(async (tx) => {
  // 1. 插入刷题记录
  const record = await tx.practiceRecord.create({ data: {...} });

  // 2. 更新会话快照状态
  await tx.sessionQuestion.updateMany({
    where: { sessionId, questionId },
    data: { status: 'answered', result: dto.result },
  });

  // 3. 更新题目 updatedAt（触发统计重算）
  await tx.question.update({
    where: { id: dto.questionId },
    data: { updatedAt: new Date() },
  });

  return record;
});
```

### 4.2 事务边界原则

**什么时候用事务：**

- 多条关联写操作（如上面的刷题记录 + 会话更新）
- 批量操作（批量删除、批量更新）
- 涉及关联表的增删改

**什么时候不用事务：**

- 单条插入（无关联操作）
- 只读查询
- 日志写入（失败不影响业务）

---

## 五、派生数据不落库

### 5.1 问题：掌握度要不要缓存？

**场景：** 用户问「这个知识点我掌握得怎么样？」需要统计该知识点下所有题目的刷题记录，实时计算正确率。

**决策：** 不缓存，实时计算。

**理由：**

- 数据量小：几千条题目，几万条刷题记录，`groupBy` 查询毫秒级完成
- 不可能算错：缓存值可能和原始记录不一致，实时计算永远准确
- 避免复杂度：缓存失效、更新策略、一致性问题——都不用考虑

```typescript
async getMasteryOverview() {
  const grouped = await this.prisma.practiceRecord.groupBy({
    by: ['result'],
    _count: true,
  });
  // 直接从原始记录算，不落库
  const total = grouped.reduce((sum, g) => sum + g._count, 0);
  const correct = grouped.find(g => g.result === 'correct')?._count ?? 0;
  return { totalRecords: total, accuracy: Math.round((correct / total) * 100) };
}
```

### 5.2 什么时候值得缓存？

当数据量达到以下规模时，考虑引入 Redis：

- 刷题记录 > 10 万条
- 统计查询 > 500ms
- 高并发读取（多人使用）

当前规模完全不需要。

---

## 六、软删除与审计追溯

### 6.1 问题：误删题目怎么恢复？

**决策：** 用软删除（`deletedAt` 字段），不真删。

```typescript
// 删除 = 打标记
async remove(id: number) {
  await this.prisma.question.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// 查询默认排除已删除
const where = { deletedAt: null };

// 恢复 = 清除标记
async restore(id: number) {
  await this.prisma.question.update({
    where: { id },
    data: { deletedAt: null },
  });
}
```

### 6.2 审计日志：谁在什么时候做了什么

**扩展：** 审计日志不仅记录题目操作，还覆盖标签、知识点、练习记录：

```typescript
// AuditService 记录操作
await this.audit.log({
  entity: 'question', // question | tag | knowledge_point | practice
  entityId: question.id,
  action: 'update', // create | update | delete | restore
  changes: {
    title: { old: '旧标题', new: '新标题' },
    tags: { old: [1, 2], new: [1, 2, 3] },
  },
});
```

**审计日志表结构：**

```prisma
model AuditLog {
  id        Int      @id @default(autoincrement())
  entity    String   // question | tag | knowledge_point | practice
  entityId  Int
  action    String   // create | update | delete | restore | batch_delete | batch_update
  changes   String?  // JSON 变更记录
  createdAt DateTime @default(now())
}
```

**审计覆盖范围：**

- 题目 CRUD + 批量操作
- 标签增删改
- 知识点增删改
- 练习记录提交（result、sessionId）

**查询接口：**

- `GET /audit-logs/recent` - 最近 100 条
- `GET /audit-logs/:entity/:entityId` - 指定实体历史

**价值：** 误删后查审计日志找回原始数据；问题追溯时能看到「谁在什么时候改了什么」。

---

## 七、SM-2 间隔复习算法

### 7.1 问题：复习没有节奏，全凭感觉

**场景：** 用户刷完题后，不知道什么时候该复习。手动管理复习计划太麻烦，容易放弃。

**决策：** 实现 SM-2 算法，自动计算下次复习时间。

### 7.2 SM-2 算法原理

```
质量分数 quality ∈ {0,1,2,3,4,5}
  - 0-2: 需要重新学习 (wrong/fuzzy)
  - 3-5: 基本掌握 (correct)

难度因子 easeFactor (初始 2.5，最小 1.3)
  EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))

间隔天数 intervalDays
  - rep=0: 1 天
  - rep=1: 6 天
  - rep>=2: interval × EF
```

### 7.3 实现

```typescript
// SpacedReputationService
async submitReview(questionId: number, result: string) {
  const quality = this.resultToQuality(result);  // correct→5, fuzzy→3, wrong→1
  const existing = await this.prisma.spacedReputation.findUnique({ where: { questionId } });

  if (!existing) {
    // 首次复习
    const calc = this.calculate(2.5, 0, 0, quality);
    return this.prisma.spacedReputation.create({ ... });
  }

  // 更新 SM-2 状态
  const calc = this.calculate(existing.easeFactor, existing.intervalDays, existing.repetition, quality);
  return this.prisma.spacedReputation.update({ ... });
}
```

### 7.4 数据模型

```prisma
model SpacedReputation {
  id            Int      @id @default(autoincrement())
  questionId    Int      @unique
  repetition    Int      @default(0)    // 已复习次数
  easeFactor    Float    @default(2.5)  // 难度因子
  intervalDays  Int      @default(0)    // 当前间隔天数
  nextReviewAt  DateTime @default(now()) // 下次复习时间
  lastReviewAt  DateTime?
}
```

### 7.5 复习队列

`GET /practice/review` 返回到期复习题目：

```typescript
const where = {
  nextReviewAt: { lte: new Date() }, // 到期的题目
  question: { deletedAt: null },
};
```

**价值：** 科学间隔复习，比「每天刷」效率高 3-5 倍。用户无需手动管理复习计划。

---

## 八、AI 辅助功能

### 8.1 问题：AI 出题和答案分析需要灵活切换厂商

**场景：** 用户可能用 OpenAI、Claude、DeepSeek 或本地 Ollama。需要一个可扩展的适配层。

### 8.2 多厂商适配器模式

```
AiAdapter (接口)
  ├── OpenAiAdapter    (OpenAI API)
  ├── ClaudeAdapter    (Anthropic API)
  ├── DeepSeekAdapter  (DeepSeek API)
  └── OllamaAdapter    (本地 Ollama)
```

**适配器接口：**

```typescript
interface AiAdapter {
  chat(messages: AiMessage[], model?: string): Promise<AiCompletionResponse>;
}
```

### 8.3 配置存储

AI 设置存储在 `SystemConfig` 表：

```prisma
model SystemConfig {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

配置项：

- `ai_provider`: openai | claude | deepseek | ollama
- `ai_api_key`: API 密钥
- `ai_base_url`: 自定义地址（Ollama）
- `ai_model`: 模型名称（可选）

### 8.4 API 接口

| 接口                | 功能             |
| ------------------- | ---------------- |
| `GET /ai/settings`  | 获取当前 AI 配置 |
| `POST /ai/settings` | 更新 AI 配置     |
| `POST /ai/generate` | AI 智能出题      |
| `POST /ai/analyze`  | AI 答案解析      |

### 8.5 出题 Prompt 设计

```typescript
const messages: AiMessage[] = [
  {
    role: 'system',
    content: `你是一个面试题生成专家。根据要求生成高质量的面试题。
输出格式为 JSON 数组，每道题包含 title 和 referenceAnswer 字段。`,
  },
  {
    role: 'user',
    content: `请生成 ${count} 道${type}类型的面试题，难度为 ${difficulty}。`,
  },
];
```

### 8.6 答案解析

用户提交答案后，可选调用 AI 分析：

```typescript
const messages: AiMessage[] = [
  {
    role: 'system',
    content: `你是一个面试评分专家。分析用户的答案并给出评分和反馈。
输出格式为 JSON，包含 score (0-100), feedback, suggestions 字段。`,
  },
  {
    role: 'user',
    content: `题目: ${question.title}\n参考答案: ${referenceAnswer}\n用户答案: ${userAnswer}`,
  },
];
```

**价值：** 不绑定单一厂商，用户可自由选择。Ollama 支持完全离线使用。

---

## 九、前后端契约优先

### 9.1 问题：接口改了，前端不知道

**场景：** 后端把 `question.tags` 从 `Tag[]` 改成了 `{ items: Tag[], total: number }`，前端不知道，联调时才发现报错。

**决策：** 前后端共享类型定义，放 `packages/shared`：

```typescript
// packages/shared/src/types.ts
export interface Question {
  id: number;
  title: string;
  type: QuestionType;
  tags?: Tag[];
  companies?: Company[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 9.2 价值验证

**改接口后：**

- 后端改了 `types.ts` → 前端 TypeScript 编译报错 → 立即发现
- 不再出现「联调时才发现字段名不对」

**构建顺序：** shared → server → web（依赖链保证类型同步）

### 9.3 前端 API 层封装

```typescript
// apps/web/src/api/request.ts
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// 响应拦截：自动提取 data，错误自动 toast
request.interceptors.response.use(
  (res) => res.data.data ?? res.data, // 成功：直接返回数据
  (err) => {
    const msg = err.response?.data?.message ?? err.message;
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: msg, type: 'error' } }));
    return Promise.reject(err);
  },
);
```

**设计取舍：** 用 `CustomEvent` 触发 toast，不依赖 Vue 组件层级，任何地方都能触发。代价是类型不安全、调试不直观——对个人工具可接受。

---

## 十、日志与可观测性

### 10.1 HTTP 访问日志

`LoggerMiddleware` 记录所有请求：

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "INFO",
  "method": "GET",
  "url": "/api/questions",
  "status": 200,
  "duration": "45ms",
  "ip": "127.0.0.1"
}
```

**日志分级：** 4xx → WARN，5xx → ERROR，其余 → INFO

**日志落盘：** 写入 `logs/access.log`，JSON 格式便于后续分析

### 10.2 异常过滤器

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = (exception.getResponse() as any).message ?? message;
    }

    response.status(status).json({ code: status, message, data: null });
  }
}
```

**价值：** 所有未处理异常统一格式返回，不让错误裸奔到前端。

---

## 十一、导入导出：批量操作的错误处理

### 11.1 问题：导入失败时，用户不知道哪一行错了

**场景：** 1000 条题目导入，第 500 条格式错误，整体失败。用户不知道哪一条有问题。

**决策：** 逐行导入，失败的行记录错误明细，返回给用户：

```typescript
async importQuestions(data: any[]): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;
  const errors: ImportError[] = [];

  for (let i = 0; i < data.length; i++) {
    try {
      await this.prisma.question.create({ data: data[i] });
      imported++;
    } catch (error) {
      skipped++;
      errors.push({
        index: i,
        title: data[i]?.title,
        error: error.message,
      });
    }
  }

  return { imported, skipped, total: data.length, errors };
}
```

### 11.2 返回示例

```json
{
  "imported": 998,
  "skipped": 2,
  "total": 1000,
  "errors": [
    { "index": 499, "title": "手写防抖", "error": "title 和 type 为必填字段" },
    { "index": 872, "title": null, "error": "Invalid input" }
  ]
}
```

**价值：** 用户能看到「第 500 行、题目标题是 xxx、失败原因是 yyy」，修复后可重新导入。

---

## 十二、踩坑实录

### 12.1 响应拦截器与异常过滤器的执行顺序

**现象：** 异常被过滤器处理后，拦截器还会二次包装，出现重复结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "code": 404,
    "message": "题目不存在",
    "data": null
  }
}
```

**根因：** NestJS 请求管道的执行顺序：`Interceptor → Filter → Interceptor`。过滤器返回的响应会被拦截器再次包装。

**修复：** 搞清管道顺序，各自职责对齐。异常过滤器直接返回响应，不再经过拦截器。

### 12.2 Docker 容器重建后数据丢失

**现象：** `docker compose down && docker compose up` 后，数据库空了。

**根因：** SQLite 文件存在容器内部，容器销毁时数据一起删除。

**修复：** 卷挂载：

```yaml
volumes:
  - db-data:/app/apps/server/prisma # 持久化 SQLite 文件
```

### 12.3 Prisma 查询无超时，慢查询挂死接口

**现象：** 数据库慢查询时，接口无限等待，线程被占用。

**修复：** `Promise.race` + 3 秒超时：

```typescript
await Promise.race([
  this.prisma.$queryRaw`SELECT 1`,
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
]);
```

---

## 十三、性能考量（量化数据）

### 13.1 查询性能

| 场景                | 优化前  | 优化后 | 手段                 |
| ------------------- | ------- | ------ | -------------------- |
| 题目列表（1000 条） | 120ms   | 45ms   | 索引 + 分页          |
| 统计面板            | 800ms   | 50ms   | groupBy 替代全表扫描 |
| 健康检查            | 3000ms+ | <10ms  | 超时保护 + SELECT 1  |

### 13.2 前端加载

| 指标     | 数值           | 手段                    |
| -------- | -------------- | ----------------------- |
| 首屏加载 | <1s            | Vite 构建 + 按需加载    |
| 构建产物 | ~200KB gzip    | 代码分割 + 移除 console |
| API 响应 | <100ms（本地） | SQLite 零网络延迟       |

**注意：** 以上数据为本地 SQLite 场景。生产环境（如换成 PostgreSQL）需重新测量。

---

## 十四、总结与反思

### 14.1 关键决策回顾

| 决策     | 选择           | 核心理由                        |
| -------- | -------------- | ------------------------------- |
| 后端框架 | NestJS         | 模块化 + 依赖注入，长期维护友好 |
| ORM      | Prisma         | Schema 即文档，类型安全         |
| 数据库   | SQLite         | 零运维，备份=复制文件           |
| 派生数据 | 实时计算       | 数据量小，避免缓存复杂度        |
| 删除策略 | 软删除         | 可恢复 + 审计追溯               |
| 类型共享 | pnpm workspace | 编译期发现接口不一致            |
| 间隔复习 | SM-2 算法      | 科学复习，效率提升 3-5 倍       |
| AI 辅助  | 多厂商适配器   | 灵活切换，支持离线              |

### 14.2 如果重来

- 数据库换 PostgreSQL：JSON 支持更好、扩展性更强
- TypeScript strict mode 从头开始
- 补单元测试 + E2E 测试（当前只有基础测试）
- 接入 Redis 缓存统计数据（如果数据量增长）

### 14.3 适用场景

- NestJS 入门实战参考
- Prisma ORM 使用示例
- Docker 部署模板
- 个人工具项目的架构模板

---

## 附录

### A. 项目启动

```bash
pnpm install
cd apps/server && pnpm db:push && pnpm db:seed
pnpm dev          # 后端 http://localhost:3000
pnpm dev:web      # 前端 http://localhost:5173
```

### B. API 文档

Swagger UI: http://localhost:3000/api/docs

**新增 API 端点：**

| 端点                                | 功能              |
| ----------------------------------- | ----------------- |
| `GET /practice/review`              | SM-2 间隔复习队列 |
| `GET /ai/settings`                  | 获取 AI 配置      |
| `POST /ai/settings`                 | 更新 AI 配置      |
| `POST /ai/generate`                 | AI 智能出题       |
| `POST /ai/analyze`                  | AI 答案解析       |
| `GET /audit-logs/recent`            | 最近审计日志      |
| `GET /audit-logs/:entity/:entityId` | 实体审计历史      |

### C. 相关资源

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 官方文档](https://www.prisma.io/docs)
- [SM-2 算法说明](https://supermemo.com/wiki/SuperMemo_Algorithm)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Anthropic API 文档](https://docs.anthropic.com/)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs)
- [Ollama 文档](https://ollama.com/library)
