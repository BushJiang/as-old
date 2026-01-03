# Claude Code 使用指南

## 个人环境信息

- 设备：搭载 Apple 芯片的 Mac 电脑
- Node.js 管理：通过 bun 进行安装管理
- Python 环境：通过 uv 配置
- Git 代码托管平台：cnb.cool

## 全局使用指令

- 始终使用 uv 运行服务器，而不是直接使用 pip。
- 始终使用中文回复而不是英文。
- 始终使用中文记录 CLAUDE.md 文件和 README 文件。
- Claude.md、README.md、注释等内容，一律使用中文。
- 如果用户使用了库，请先了解库的版本号，然后再使用 MCP 服务器 context7 获取该版本的库的代码。避免因为版本号和用户使用的不一致，导致代码报错。
- 不要使用加粗标记 `**`。
- 在文档重构时，优先使用 Write 工具而非 Edit 工具，因为 Edit 要求 old_string 逐字精确匹配，空格和空行的手动复制误差会导致失败。大改动（>50行）推荐 Write 工具，小改动（<10行）推荐 Edit 工具。

## 项目协作说明

请确保所有后续沟通和回复都使用中文。本文件包含了在项目中与 Claude Code 交互的全局指令和个人环境配置。

---

## 项目概览

如故是一个为内向者设计的社交匹配应用，通过 AI 驱动的匹配算法，帮助用户找到真正灵魂共鸣的朋友。

### 核心功能

1. 四种匹配模式：兴趣相投、需求匹配、互助合作、探索发现
2. AI 生成的匹配洞察和破冰话题
3. 用户资料管理系统
4. 收藏和匹配关系管理

### 技术栈

- 前端框架：Next.js 16.1.1 (App Router) + React 19.2.3
- UI 组件：shadcn/ui (Radix UI + Tailwind CSS)
- 状态管理：Zustand 4.5.0
- 样式：Tailwind CSS 4
- 图标：Lucide React
- 数据库：PostgreSQL + pgvector (计划中)
- ORM：Drizzle ORM 0.45.1
- 认证：NextAuth.js 5.0.0-beta.30
- 表单验证：Zod 4.3.2
- 包管理：bun
- 开发端口：4000

---

## 项目架构详解

### 目录结构

```
src/
├── app/                       # Next.js App Router 页面
│   ├── api/                   # API 路由
│   │   └── upload-avatar/     # 头像上传接口
│   ├── auth/                  # 认证页面
│   │   └── login/             # 登录页面
│   ├── onboarding/            # 引导流程
│   │   └── profile/           # 个人信息填写引导页
│   ├── profile/               # 个人资料页面
│   │   ├── page.tsx           # 资料展示页
│   │   └── edit/              # 资料编辑页
│   ├── settings/              # 设置页面
│   ├── page.tsx               # 首页（匹配入口）
│   ├── layout.tsx             # 根布局
│   └── globals.css            # 全局样式
│
├── components/                # React 组件
│   ├── ui/                    # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── sheet.tsx
│   │   └── tabs.tsx
│   │
│   ├── navigation/            # 导航组件
│   │   └── NavigationWrapper.tsx    # 主导航栏（顶部+移动端底部）
│   │
│   └── user/                  # 用户相关组件
│       ├── MatchCard.tsx      # 核心匹配卡片（AI 洞察 + 用户信息）
│       ├── UserInfoPanel.tsx  # 用户信息展示面板（共享组件）
│       ├── AvatarUpload.tsx   # 头像上传组件
│       ├── ProfileFormFields.tsx    # 个人资料表单字段
│       └── UserCard.tsx       # 用户卡片（用于收藏列表）
│
├── lib/                       # 核心库文件
│   ├── db/                    # 数据库相关
│   │   ├── schema.ts          # Drizzle 数据库 Schema 定义
│   │   └── index.ts           # 数据库连接配置
│   │
│   └── services/              # 业务服务（计划中）
│       ├── embedding-service.ts    # bge-m3 嵌入模型服务
│       └── matching-service.ts     # 匹配算法服务
│
├── stores/                    # Zustand 状态管理
│   ├── auth-store.ts          # 认证状态
│   ├── user-store.ts          # 用户资料和匹配状态
│   ├── app-store.ts           # 应用全局状态
│   └── filter-store.ts        # 筛选条件状态
│
├── data/                      # Mock 数据
│   └── mock/
│       └── users.ts           # 测试用户数据
│
└── types.ts                   # TypeScript 类型定义
```

### 前端架构

#### 页面路由（App Router）

1. 首页 (`/`)
   - 四个功能入口按钮
   - 匹配卡片展示
   - 收藏/下一位操作

2. 认证流程 (`/auth/login`)
   - Mock 登录系统
   - 测试账号支持

3. 引导流程 (`/onboarding/profile`)
   - 首次登录填写个人资料
   - 表单验证

4. 个人资料 (`/profile`)
   - 资料展示（左右布局）
   - 收藏列表展示
   - 资料编辑 (`/profile/edit`)

#### 组件架构

1. MatchCard（核心组件）
   - 左侧：AI 匹配洞察（三段式文案）
   - 右侧：UserInfoPanel + 操作按钮
   - 支持四种匹配模式

2. UserInfoPanel（共享组件）
   - 复用于 MatchCard 和 UserCard
   - 渐变背景 + 头像 + 标签墙
   - 支持可选的操作按钮区域

3. NavigationWrapper
   - 顶部导航栏（返回按钮 + logo + 用户菜单）
   - 移动端底部导航（资料、收藏）
   - 条件渲染（认证页面不显示）

### 状态管理

#### auth-store.ts
认证状态管理，使用 Zustand + localStorage 持久化。

状态：
- user: 当前登录用户
- isAuthenticated: 是否已登录
- isProfileCompleted: 是否完成资料填写

操作：
- login: 登录
- register: 注册
- logout: 登出
- completeProfile: 标记资料完成

内置 Mock 数据：
- 测试账号：test@example.com / password123

#### user-store.ts
用户资料和匹配状态管理。

状态：
- currentUser: 当前用户完整资料
- potentialMatches: 潜在匹配用户列表
- wantToKnowMatches: 收藏列表
- passedMatches: 已跳过列表
- userProfiles: 多用户资料映射（userId -> User）

操作：
- updateProfile: 更新用户资料
- toggleWantToKnow: 切换收藏状态
- removeFromWantToKnow: 移除收藏
- isWantToKnow: 检查是否收藏

#### app-store.ts
应用全局状态。

状态：
- sidebarOpen: 侧边栏开关
- theme: 主题设置
- currentPage: 当前页面
- useMock: Mock 模式开关

#### filter-store.ts
筛选条件状态。

状态：
- ageRange: 年龄范围
- cities: 偏好城市
- interests: 兴趣筛选

### 数据库 Schema

使用 Drizzle ORM 定义的 PostgreSQL + pgvector 数据库结构。

#### user_profiles（用户资料表）
```sql
- id: 主键
- userId: 用户 ID（外键）
- name: 姓名
- age: 年龄
- city: 城市
- avatarUrl: 头像 URL
- bio: 个人简介
- interests: 兴趣爱好（JSONB）
- needs: 需求（JSONB）
- provide: 可以提供（JSONB）
- embedding: 向量嵌入（1024维）
- privacySettings: 隐私设置（JSONB）
- createdAt: 创建时间
- updatedAt: 更新时间
```

#### user_preferences（用户偏好表）
```sql
- id: 主键
- userId: 用户 ID
- ageRangeMin: 最小年龄偏好
- ageRangeMax: 最大年龄偏好
- preferredCities: 偏好城市（数组）
- preferredInterests: 偏好兴趣（数组）
- emailNotifications: 邮件通知
- pushNotifications: 推送通知
- notificationFrequency: 通知频率
- createdAt: 创建时间
- updatedAt: 更新时间
```

#### matches（匹配关系表）
```sql
- id: 主键
- userId1: 用户1 ID
- userId2: 用户2 ID
- matchType: 匹配类型（want_to_know, passed, mutual, blocked）
- similarityScore: 相似度分数
- matchReasons: 匹配原因（JSONB）
- createdAt: 创建时间
- updatedAt: 更新时间
```

#### icebreakers（破冰话题表）
```sql
- id: 主键
- userId1: 用户1 ID
- userId2: 用户2 ID
- topics: 话题内容（JSONB）
- generationStatus: 生成状态
- createdAt: 创建时间
```

#### user_embeddings（用户向量嵌入表）
```sql
- id: 主键
- userId: 用户 ID
- type: 类型（interest, need, provide, profile）
- embedding: 向量嵌入（1024维）
- createdAt: 创建时间
```

### API 路由

当前已实现：

- POST /api/upload-avatar
  - 处理用户头像上传
  - 返回头像 URL

计划中：
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- POST /api/auth/logout - 用户登出
- GET /api/profile - 获取用户资料
- PUT /api/profile - 更新用户资料
- GET /api/matches - 获取匹配用户
- POST /api/matches/:id/action - 匹配操作（收藏/跳过）
- GET /api/icebreakers/:userId - 获取破冰话题

---

## 技术栈决策

### 数据库方案

本项目采用 PostgreSQL + pgvector 扩展方案。

选择理由：

1. 单数据库架构
   - 不需要维护两个数据库
   - 降低运维复杂度
   - 数据一致性有保障

2. pgvector 性能
   - 对于 < 100万向量的规模，性能完全够用
   - 支持向量索引（IVFFlat、HNSW）
   - 可以与 SQL 查询结合，实现混合过滤

3. 功能完整
   - 支持 ACID 事务
   - 支持 JOIN、外键、约束
   - 无需额外学习向量数据库的查询语言

### 数据库选择讨论概要

经过对以下方案的讨论和对比：

方案A：本地 JSON 文件
- 缺点：安全风险高、并发问题、用户体验差
- 结论：不推荐

方案B：Milvus + Neon 双数据库
- 优点：Milvus 是专用向量数据库，超大规模性能好
- 缺点：架构复杂、运维成本高、对于项目规模过度设计
- 结论：不推荐当前阶段使用

方案C：PostgreSQL + pgvector（最终选择）
- 优点：
  - 单数据库架构，简单可靠
  - pgvector 性能对于项目规模完全足够
  - 支持完整的 SQL 功能
  - 运维简单，成本低
- 结论：采用此方案

行业最佳实践参考：
- 70% 的项目使用单数据库 + pgvector
- 使用 Milvus/Pinecone 通常是 > 100万向量的大型项目
- Airbnb、Tinder、Reddit 等公司早期都使用单数据库方案

### 嵌入模型选择

本项目采用 bge-m3 嵌入模型，通过硅基流动 API 服务调用。

选择理由：

1. 多语言支持
   - 支持中文、英文、日文、韩文等多种语言
   - 适合项目的国际化需求

2. 性能优秀
   - MTEB 排行榜表现优异
   - 1024 维度，平衡了精度和性能

3. API 服务方案
   - 主服务：硅基流动 (Pro/BAAI/bge-m3)
   - 备用服务：阿里云 (text-embedding-v4)
   - 自动故障切换，保证服务稳定性

### 向量规格

- 维度：1024（bge-m3）
- 数据类型：vector(1024)
- 索引类型：根据数据规模选择
  - < 10万：无需索引
  - 10万 - 100万：IVFFlat
  - > 100万：HNSW

---

## 开发状态

### 已完成

- 基础页面结构和导航
- 用户认证系统（Mock）
- 匹配展示界面
- 数据库 Schema 设计
- 状态管理系统
- 组件架构优化（UserInfoPanel 抽取）
- 导航栏改进（返回按钮、居中 logo）

### 待完成

- PostgreSQL + pgvector 数据库集成
- bge-m3 嵌入模型服务集成
- 真实的 API 接口实现
- 匹配算法实现
- 消息系统
- 实时通知
- 推荐系统优化

---

## 踩坑总结

### CSS flex 布局中 h-full 不生效

错误做法：
```tsx
{/* 父容器没有明确高度 */}
<Card className="w-full">
  <div className="h-full bg-blue-50">
    内容
  </div>
</Card>
```

正确做法：
```tsx
{/* 父容器设置最小高度 */}
<Card className="w-full min-h-[550px]">
  <div className="h-full bg-blue-50">
    内容
  </div>
</Card>
```

原因：
h-full 需要父容器有明确的高度才能生效。如果父容器高度由内容决定，子元素的 h-full 不会有任何效果。

相关文件：
- `src/components/user/MatchCard.tsx` - 匹配卡片布局

---

### 固定高度导致内容溢出

错误做法：
```tsx
<Card className="md:h-[600px] overflow-y-auto">
  {/* 内容可能超过 600px */}
</Card>
```

正确做法：
```tsx
<Card className="flex flex-col">
  {/* 自动高度，内容完整显示 */}
</Card>
```

原因：
固定高度无法适应不同长度的内容，会导致部分内容被遮挡或出现滚动条。使用 flex 布局让容器高度自适应内容。

相关文件：
- `src/components/user/MatchCard.tsx` - 卡片高度优化

---

### slide-in 动画导致位置晃动

错误做法：
```tsx
<div className="animate-in slide-in-from-bottom-4 fade-in">
  文字内容
</div>
```

正确做法：
```tsx
<div className="animate-in fade-in">
  文字内容
</div>

{/* 或者完全不用动画 */}
<div>
  文字内容
</div>
```

原因：
slide-in 动画会改变元素的初始位置，导致布局抖动和视觉晃动。fade-in 动画只改变透明度，不会影响布局。

相关文件：
- `src/app/globals.css` - 动画定义
- `src/components/user/MatchCard.tsx` - 左侧文案显示

---

### 返回按钮位置反复调整

问题描述：
返回按钮位置经历了 4 次调整：
1. 页面左上角 -ml-2（用户说太靠左）
2. 页面左上角 ml-2（用户说还是在角落）
3. 页面右上角绝对定位（用户不满意）
4. 导航栏右侧，用户头像左侧（最终方案）

正确做法：
在实现 UI 交互前，先询问用户期望的位置，或参考行业最佳实践。不要自己猜测用户需求。

原因：
需求不明确时自己猜测会导致多次返工，浪费时间和精力。

相关文件：
- `src/components/navigation/NavigationWrapper.tsx` - 导航栏实现

---

### 过早创建不需要的组件

错误做法：
```tsx
// 创建了 FlipUserCard 组件，但实际不需要翻转功能
export function FlipUserCard() {
  // 翻转逻辑...
}
```

正确做法：
```tsx
// 功能确定后再创建组件
export function MatchCard() {
  // 实际需要的功能...
}
```

原因：
在功能需求不明确时创建组件，可能导致组件完全用不上，最终被删除。应该等需求明确后再实现。

相关文件：
- `src/components/user/FlipUserCard.tsx` - 已删除

---

### 目录嵌套过深

错误做法：
```
src/components/features/matching/MatchCard.tsx
src/components/features/user/UserCard.tsx
```

正确做法：
```
src/components/user/MatchCard.tsx
src/components/user/UserCard.tsx
```

原因：
深层嵌套的目录结构会导致导入路径过长，不易维护。扁平化目录结构更清晰易用。

相关文件：
- `src/components/` - 整个组件目录结构

---

### Edit 工具要求精确匹配

问题：
Edit 工具对空格、空行非常敏感，手动复制容易出现误差。

正确做法：
- 小改动（<10行）：使用 Edit 工具
- 大改动（>50行）：使用 Write 工具覆盖整个文件

原因：
Edit 工具需要 old_string 完全匹配，包括空格和空行。手动复制容易出错，导致编辑失败。

---

### 不要过度抽象

错误做法：
```tsx
// 每个页面都创建独立的返回按钮
const page1 = () => <Page><BackButton /></Page>
const page2 = () => <Page><BackButton /></Page>
```

正确做法：
```tsx
// 在导航栏统一管理
<NavigationWrapper>
  {/* 条件渲染返回按钮 */}
</NavigationWrapper>
```

原因：
过度抽象会增加复杂度，应该在真正需要复用时才抽取组件。导航栏本身就是所有页面共享的，返回按钮应该放在导航栏中。

相关文件：
- `src/components/navigation/NavigationWrapper.tsx` - 统一导航管理

---

### 组件命名要语义化

错误做法：
```tsx
// SideBySideUserCard 不直观
export function SideBySideUserCard() {}
```

正确做法：
```tsx
// MatchCard 更清晰表达组件用途
export function MatchCard() {}
```

原因：
组件名称应该直接表达其功能和用途，便于团队协作和后期维护。

相关文件：
- `src/components/user/MatchCard.tsx` - 核心匹配卡片

---

### 需求理解偏差

问题：
用户说"优化左侧文字"，错误理解为"添加复杂动画效果"，实际用户只是想调整字体、颜色、间距。

正确做法：
需求不明确时，先询问用户具体想要什么效果，或者提供几个选项让用户选择。

原因：
需求理解偏差会导致实现方向错误，浪费开发时间。

---

### 数据库开发踩坑

#### pgvector 扩展未启用

问题：
执行数据库迁移时报错：type "vector" does not exist

原因：
pgvector 扩展需要在数据库中手动启用

正确做法：
```sql
-- 创建独立的迁移文件
CREATE EXTENSION IF NOT EXISTS vector;
```

相关文件：
- `drizzle/0001_enable_pgvector.sql`
- `scripts/enable-pgvector.ts`

---

#### 匿名函数参数类型推断

问题：
```typescript
const hasPassed = existingHistory?.some(
  h => h.historyData.matchedUserId === matchId  // h 被推断为 any
)
```

正确做法：
```typescript
const hasPassed = existingHistory?.some(
  (h) => h.historyData.matchedUserId === matchId  // 添加括号明确类型
)
```

原因：
匿名箭头函数的参数在某些情况下会被推断为 any 类型，添加括号可以帮助 TypeScript 正确推断类型。

---

#### SQL 查询结果类型为 unknown

问题：
```typescript
const distance = match.distance as number  // 需要类型断言
```

原因：
Drizzle ORM 的 SQL 表达式返回类型是 unknown

正确做法：
```typescript
const distance = (match.distance as number) ?? 0  // 添加空值保护
```

---

#### Schema 字段类型不匹配

问题：
matches 表使用 `matchType` 字段，而不是 `status`

正确做法：
使用前仔细检查 schema 定义，确保字段名称和类型正确

相关文件：
- `src/lib/db/schema.ts` - 数据库 Schema 定义
- `src/app/api/matches/[matchId]/route.ts` - 匹配操作 API

---

#### 环境变量默认值类型错误

问题：
```typescript
limit: z.string().transform(val => parseInt(val, 10)).default("10")
//                                                              ^^^^^ 字符串
```

正确做法：
```typescript
limit: z.string().transform(val => parseInt(val, 10)).default(10)
//                                                              ^^^ 数字
```

原因：
.transform() 返回 number 类型，.default() 应该使用数字而不是字符串。

---

### 嵌入模型服务踩坑

#### 方案选择反复

问题：
嵌入模型服务经历了多次方案变更：
1. 本地 Python 服务 + bge-m3
2. TypeScript + Transformers.js (Xenova/bge-m3)
3. 硅基流动 API (Pro/BAAI/bge-m3)

正确做法：
在开始开发前确定最终方案，避免反复重构。选择标准：
- 开发环境优先本地方案
- 生产环境优先 API 方案
- 考虑成本、性能、维护难度

---

#### 依赖包安装后未使用

问题：
安装了 `@huggingface/transformers` 但最终使用 API 服务，导致需要卸载

正确做法：
先确定技术方案再安装依赖，避免浪费时间和资源

---

#### API 响应格式验证不足

问题：
没有充分验证 API 响应格式，可能导致运行时错误

正确做法：
```typescript
if (!data.data || !data.data[0] || !data.data[0].embedding) {
  throw new Error('API 响应格式不正确')
}
```

---

### NextAuth 集成踩坑

#### Session 类型扩展

问题：
NextAuth 默认的 Session 类型不包含 id 字段

正确做法：
创建 `src/types/next-auth.d.ts` 扩展类型
```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
    }
  }
}
```

---

#### 密码加密 salt rounds

问题：
bcryptjs 的 salt rounds 设置影响安全性和性能

正确做法：
使用 10 作为默认值，平衡安全性和性能
```typescript
await hash(password, 10)
```

---

## 更新日志

- 2025-01-03：添加前端开发踩坑总结，包括 CSS 布局、动画、组件设计等问题
- 2025-01-03：添加后端开发踩坑总结，包括数据库、嵌入模型、NextAuth 等

---

## 相关文档

- 数据流动文档：/docs/DATA_FLOW.md
