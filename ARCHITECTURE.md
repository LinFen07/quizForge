# 面试题库平台 · 架构设计文档 v2

> 基于原始设计文档的改进版本，解决了数据库冗余、状态计算不一致等逻辑问题。

---

## 一、核心改进说明

### 1.1 原始设计的问题

| 问题 | 影响 | 解决方案 |
|------|------|---------|
| Question 表存 `mastery`/`reviewCount`/`lastReviewedAt` | 这些是派生数据，与 practice_records 不一致时产生脏数据 | 移除，全部从 practice_records 实时计算 |
| 缺少刷题会话概念 | 无法统计单次练习时长、批量统计 | 新增 PracticeSession 表 |
| 缺少间隔复习支持 | 复习队列只能简单排序，无法支持 SM-2 算法 | 新增 SpacedReputation 表 |
| 题型用 String 无约束 | 可以插入非法值 | 代码层通过 DTO enum 约束 |
| 标签无使用统计 | 需要额外查询 | `findAll` 支持 `withCount` 参数 |

### 1.2 数据模型变更

```
原始设计:
  Question → PracticeRecord (1:N)
  Question.mastery (冗余字段)

v2 设计:
  Question → PracticeRecord (1:N)
  Question → SpacedReputation (1:1, 可选)
  PracticeSession → PracticeRecord (1:N)
  所有状态字段从 PracticeRecord 实时计算
```

---

## 二、数据库设计（Prisma Schema）

### 2.1 实体关系

```
KnowledgePoint (知识点, 树形)
     │  1
     └── N Question (题目)
                  │  N
                  └── M Tag (标签, 通过 question_tags)
                  │  1
                  └── N PracticeRecord (刷题记录)
                  │  1
                  └── 1 SpacedReputation (间隔复习, 可选)

PracticeSession (刷题会话)
     │  1
     └── N PracticeRecord
```

### 2.2 表结构

#### KnowledgePoint（知识点）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int PK | 自增主键 |
| name | String | 知识点名称 |
| parentId | Int? FK | 父级 ID，null 为顶级 |
| sortOrder | Int | 排序权重 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### Tag（标签）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int PK | 自增主键 |
| name | String UNIQUE | 标签名 |
| color | String? | 展示色，如 #e74c3c |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### Question（题目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int PK | 自增主键 |
| title | String | 题干 |
| type | String | concept / coding / scene / algorithm |
| difficulty | Int | 1-5 难度评级 |
| knowledgePointId | Int? FK | 关联知识点 |
| referenceAnswer | String? | 参考解答（Markdown） |
| source | String? | 来源描述 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**索引**: knowledgePointId, type, difficulty, createdAt

#### QuestionTag（题目-标签关联）

| 字段 | 类型 | 说明 |
|------|------|------|
| questionId | Int FK | 题目 ID |
| tagId | Int FK | 标签 ID |
| createdAt | DateTime | 关联时间 |

**联合主键**: (questionId, tagId)

#### PracticeSession（刷题会话）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int PK | 自增主键 |
| startedAt | DateTime | 开始时间 |
| endedAt | DateTime? | 结束时间 |
| totalQuestions | Int | 总题数 |
| correctCount | Int | 答对数 |
| wrongCount | Int | 答错数 |
| fuzzyCount | Int | 模糊数 |

#### PracticeRecord（刷题记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int PK | 自增主键 |
| questionId | Int FK | 题目 ID |
| sessionId | Int? FK | 所属会话 |
| result | String | correct / wrong / fuzzy |
| myAnswer | String? | 我的解答 |
| durationMs | Int? | 作答耗时（毫秒） |
| practicedAt | DateTime | 练习时间 |

**索引**: questionId, sessionId, practicedAt, result

#### SpacedReputation（间隔复习状态）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int PK | 自增主键 |
| questionId | Int UNIQUE FK | 题目 ID |
| repetition | Int | 已复习次数 |
| easeFactor | Float | 难度因子（>=1.3） |
| intervalDays | Int | 当前间隔天数 |
| nextReviewAt | DateTime | 下次复习时间 |
| lastReviewAt | DateTime? | 上次复习时间 |

---

## 三、后端架构（NestJS）

### 3.1 目录结构

```
apps/server/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── filters/
│   │   └── all-exceptions.filter.ts    # 统一异常响应
│   └── interceptors/
│       └── response.interceptor.ts     # 统一响应格式 { code, message, data }
├── prisma/
│   ├── prisma.module.ts               # 全局 Prisma 模块
│   └── prisma.service.ts
└── modules/
    ├── questions/                      # 题目 CRUD
    ├── knowledge-points/               # 知识点树管理
    ├── tags/                           # 标签 CRUD
    ├── practice/                       # 刷题核心（会话 + 记录 + 复习队列）
    ├── stats/                          # 统计面板
    └── import-export/                  # 导入导出
```

### 3.2 统一响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

错误时 `code` 为 HTTP 状态码，`data` 为 null。

### 3.3 模块职责

| 模块 | 职责 | 关键接口 |
|------|------|---------|
| questions | 题目 CRUD + 筛选搜索 | `GET/POST/PATCH/DELETE /questions` |
| knowledge-points | 知识点树形管理 | `GET /knowledge-points/tree` |
| tags | 标签 CRUD + 使用统计 | `GET /tags?withCount=true` |
| practice | 刷题会话 + 记录 + 复习队列 | `POST /practice/records`, `GET /practice/random` |
| stats | 统计面板数据 | `GET /stats/mastery-overview` |
| import-export | 全量导出 + 批量导入 | `GET/POST /import-export` |

### 3.4 核心业务：刷题闭环

```
1. GET /practice/random → 返回随机题目（不含答案）
2. 前端展示题干，用户作答
3. POST /practice/records → 提交 { questionId, result, myAnswer }
4. 后端事务：
   - 插入 practice_records
   - 更新 question.updatedAt（触发排序更新）
5. GET /stats/* → 实时反映变化
```

---

## 四、前端架构（Vue3）

### 4.1 目录结构

```
apps/web/src/
├── main.ts
├── App.vue                             # 侧边栏布局
├── router/index.ts                     # 路由配置
├── api/
│   ├── request.ts                      # axios 实例 + 拦截器
│   └── index.ts                        # 各模块 API 导出
├── stores/
│   ├── question.ts                     # 题目状态管理
│   └── practice.ts                     # 刷题状态管理
├── views/
│   ├── Questions/
│   │   ├── QuestionList.vue            # 题目列表 + 筛选
│   │   └── QuestionDetail.vue          # 题目详情
│   ├── Practice/
│   │   ├── PracticePage.vue            # 刷题页
│   │   └── ReviewQueue.vue             # 复习队列
│   ├── Stats/
│   │   └── StatsPanel.vue              # 统计面板
│   ├── KnowledgePoints/
│   │   └── KnowledgePointList.vue      # 知识点管理
│   ├── Tags/
│   │   └── TagList.vue                 # 标签管理
│   └── ImportExport/
│       └── ImportExportPage.vue        # 导入导出
└── styles/
    └── main.css                        # 全局样式
```

### 4.2 页面清单

| 页面 | 路由 | 功能 |
|------|------|------|
| 题目列表 | `/questions` | 搜索 + 筛选 + 分页 + 新建 |
| 题目详情 | `/questions/:id` | 查看 + 编辑 + 历史记录 |
| 刷题页 | `/practice` | 随机出题 + 隐藏答案 + 作答 + 标记 |
| 复习队列 | `/review` | 按掌握度排序的待复习题目 |
| 统计面板 | `/stats` | 总览 + 知识点掌握 + 趋势 |
| 知识点 | `/knowledge-points` | 树形管理 |
| 标签 | `/tags` | CRUD + 使用统计 |
| 导入导出 | `/settings/io` | JSON 导出 + 批量导入 |

### 4.3 刷题页交互

```
┌─────────────────────────────────┐
│  知识点: JavaScript  ★★★  手写  │
│                                 │
│  Q: 手写一个防抖函数             │
│                                 │
│  [ 显示答案 ]                    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 我的解答...              │    │
│  └─────────────────────────┘    │
│                                 │
│  [答对了]  [模糊]  [答错了]      │
└─────────────────────────────────┘
```

---

## 五、项目初始化命令

```bash
# 1. 安装依赖
pnpm install

# 2. 初始化数据库
cd apps/server
pnpm db:push

# 3. 导入种子数据
pnpm db:seed

# 4. 启动后端
pnpm dev

# 5. 启动前端（新终端）
cd apps/web
pnpm dev
```

访问:
- 前端: http://localhost:5173
- Swagger: http://localhost:3000/api/docs

---

## 六、开发里程碑

| 阶段 | 内容 | 验收标准 |
|------|------|---------|
| **M1 收录** | 题目 CRUD + 筛选搜索 | 能录入、改、搜、筛题目 |
| **M2 练习** | 刷题模式 + 复习队列 | 刷题闭环跑通 |
| **M3 效率** | 统计面板 + 导入导出 | 看得见进步、数据可带走 |
| **M4 增强** | 间隔复习 + AI 辅助 | 可选，按需加 |

---

*本设计基于「本地私人 + 单用户 + 长期积累」场景，刻意砍掉了多租户 / RBAC / 分布式部署等企业级复杂度。*
