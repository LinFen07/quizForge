# QuizForge

> 面试刷题时题目散落各处、掌握度全靠感觉、复习没有节奏。这个项目的目标很简单：**做一个单用户、本地部署的私人题库，实现「出题 → 作答 → 记录 → 统计 → 复习」的完整闭环**。

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Compose                       │
├─────────────────────┬───────────────────────────────────────┤
│   apps/web (Vue3)   │       apps/server (NestJS)            │
│   - Pinia 状态      │       - Prisma ORM                    │
│   - Axios 封装      │       - class-validator 验证           │
│   - 组件库          │       - 审计日志 / 限流 / 日志          │
├─────────────────────┴───────────────────────────────────────┤
│              packages/shared (TypeScript 契约)               │
├─────────────────────────────────────────────────────────────┤
│                     SQLite (单文件数据库)                     │
└─────────────────────────────────────────────────────────────┘
```

**技术选型：** NestJS（模块化）+ Prisma（类型安全 ORM）+ SQLite（零运维）+ Vue3（轻量）+ pnpm workspace（前后端共享类型）

---

## 快速开始

### 方式一：本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 初始化数据库
cd apps/server && pnpm db:push && pnpm db:seed && cd ../..

# 3. 启动后端（端口 3000）
pnpm dev

# 4. 启动前端（端口 5173，新终端）
pnpm dev:web
```

### 方式二：Docker 部署

```bash
# 一键启动
docker compose up -d

# 访问
# 前端: http://localhost
# 后端: http://localhost:3000
# API 文档: http://localhost:3000/api/docs
```

---

## 核心功能

### 刷题闭环

**出题 → 作答 → 记录 → 统计** 的完整流程：

1. 随机出题（支持按知识点/难度/标签/公司筛选）
2. 前端展示，用户思考作答
3. 提交作答结果（正确/错误/模糊）
4. 后端事务写入：插入记录 + 更新会话统计
5. 统计接口实时反映变化

### 掌握度计算

**实时计算，不缓存：**

- 数据源：刷题记录表
- 计算维度：最近 N 次作答结果、作答间隔、正确率
- 理由：数据量可控（几千条），算得也不慢，不值得引入缓存带来的复杂度

### 间隔复习（SM-2 算法）

**科学复习，减少无效重复：**

| 次数 | 间隔 | 说明 |
|------|------|------|
| 1 | 1 天 | 首次复习 |
| 2 | 6 天 | 间隔增长 |
| 3 | 17 天 | 指数增长 |
| 4 | 49 天 | 约 2 个月 |
| 5 | 147 天 | 约 5 个月 |

- 答对：间隔增长，EF 上升
- 答错：间隔重置为 1 天，EF 降至 1.3 下限
- 算法计算 <0.1μs，可忽略不计

### 导入导出

- **导出**：JSON 全量导出，用于备份和跨设备迁移
- **导入**：批量插入 + 按 title 去重；失败的行返回明细，用户修复后可重新导入

---

## 性能数据

基于 **1000 道题目 + 5000 条刷题记录**的实测数据：

### 查询性能

| 场景 | avg | P50 | P95 | 说明 |
|------|-----|-----|-----|------|
| 题目列表（分页 20 条） | 2.3ms | 2.2ms | 2.8ms | skip + take |
| 题目详情（含关联） | 1.7ms | 1.7ms | 2.2ms | include tags + companies |
| 统计面板（知识点掌握） | 24ms | 24ms | 25ms | 嵌套 include + flatMap |
| 健康检查 | 0.11ms | 0.08ms | 0.2ms | SELECT 1 |

### 写入性能

| 场景 | avg | P50 | P95 | 说明 |
|------|-----|-----|-----|------|
| 创建题目（含审计） | 12ms | 12ms | 14ms | create + auditLog |
| 更新题目（事务） | 5.4ms | 5.3ms | 6.5ms | $transaction |
| 提交答案（事务） | 5.7ms | 5.6ms | 6.8ms | practiceRecord + update |
| 提交复习（SM-2） | 4.9ms | 4.6ms | 7.2ms | upsert + 更新 |

### 前端性能

| 指标 | 数值 | 说明 |
|------|------|------|
| 首屏加载 | ~200ms | Vue3 + 分页查询 |
| 总 bundle | 187KB gzip | 含 Vue3 + Pinia + Axios |
| 首屏 JS | 42KB gzip | 路由懒加载分割 |

**结论：** 所有接口 <50ms，用户体验流畅。SQLite 在 1000 题规模下性能无衰减。

---

## 项目结构

```
quiz-forge/
├── apps/
│   ├── server/          # NestJS 后端
│   │   ├── src/
│   │   │   ├── common/        # 公共模块（过滤器/拦截器/守卫/装饰器）
│   │   │   ├── prisma/        # PrismaService 封装
│   │   │   └── modules/       # 业务模块
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # 数据库 Schema
│   │   │   ├── seed.ts        # 种子数据
│   │   │   ├── seed-1000.ts   # 1000 题测试数据
│   │   │   ├── perf-test.ts   # 性能测试
│   │   │   └── sm2-test.ts    # SM-2 算法测试
│   │   └── Dockerfile
│   └── web/             # Vue3 前端
│       ├── src/
│       │   ├── views/         # 页面级组件
│       │   ├── components/    # 组件库
│       │   ├── stores/        # Pinia 状态
│       │   ├── api/           # 请求封装
│       │   └── router/        # 路由配置
│       └── Dockerfile
├── packages/
│   └── shared/          # 共享类型/工具
├── docker-compose.yml
├── docker-compose.dev.yml
└── pnpm-workspace.yaml
```

---

## 开发指南

### 常用命令

```bash
# 开发
pnpm dev              # 后端
pnpm dev:web          # 前端

# 数据库
pnpm db:push          # 同步 Schema
pnpm db:seed          # 填充种子数据

# 构建部署
pnpm build            # 构建所有包
docker compose up     # 启动服务

# 代码质量
pnpm lint             # ESLint
pnpm format           # Prettier
```

### 数据库操作

```bash
# 打开 Prisma Studio（可视化界面）
cd apps/server && pnpm db:studio

# 生成 1000 题测试数据
cd apps/server && npx ts-node prisma/seed-1000.ts

# 运行性能测试
cd apps/server && npx ts-node prisma/perf-test.ts

# 运行 SM-2 算法测试
cd apps/server && npx ts-node prisma/sm2-test.ts
```

### API 文档

启动后端后访问：http://localhost:3000/api/docs

---

## 设计决策

### 为什么选 NestJS 而不是 Express？

个人项目不是一次性脚本，会持续迭代。NestJS 的模块化让我在项目变大时不用重构——每个业务模块天然有边界。依赖注入让替换实现只改一处。

### 为什么选 Prisma 而不是 TypeORM？

「Schema 即文档」。`schema.prisma` 就是数据库的最清晰文档，改表结构有版本化迁移文件，写错字段名编译期就报错。

### 为什么选 SQLite 而不是 PostgreSQL？

单用户数据量小，完全够用。零运维，备份 = 复制文件，迁移 = 拷走文件。

### 派生数据为什么实时计算不缓存？

数据量小（几千条题目），算得也不慢。缓存会带来一致性问题，不值得。

---

## 相关文档

- [技术复盘](packages/shared/review.md) - 完整的技术决策与踩坑记录
- [架构设计](ARCHITECTURE.md) - 数据库设计与模块划分
- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 官方文档](https://www.prisma.io/docs)

---

## License

MIT
