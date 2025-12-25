# 如故（as old）系统架构文档

**项目名称**: 如故（as old）
**版本**: 0.1.0
**创建日期**: 2025-12-24
**架构师**: 江浩

## 1. 架构概述

### 1.1 架构模式

**选择的架构模式**: 分层架构 + 模块化设计

```
如故系统采用分层架构模式，结合模块化设计原则，确保系统的高内聚、低耦合。
```

**架构层次**:
```
┌─────────────────────────────────────┐
│         表示层 (Presentation Layer)        │
│      React组件 + Next.js App Router      │
├─────────────────────────────────────┤
│        应用层 (Application Layer)        │
│   API Routes + Server Actions + 业务逻辑   │
├─────────────────────────────────────┤
│        领域层 (Domain Layer)           │
│  Services + Business Logic + Domain Models │
├─────────────────────────────────────┤
│      基础设施层 (Infrastructure Layer)    │
│  Database + Vector DB + External APIs    │
└─────────────────────────────────────┘
```

### 1.2 部署策略

**部署模式**: Serverless + Edge Computing

**托管平台**:
- **前端/后端**: Vercel Platform
- **向量数据库**: Zilliz Cloud (Milvus托管)
- **文件存储**: Vercel Blob Storage
- **CDN**: Vercel Edge Network

**优势**:
- 自动扩缩容
- 全球边缘节点分发
- 按使用量付费
- 零服务器运维

### 1.3 核心技术栈

| 层次 | 技术选型 | 版本 | 用途 |
|------|----------|------|------|
| **全站框架** | Next.js | 15 | React全栈框架 |
| **前端框架** | React | 19 | UI组件库 |
| **CSS框架** | Tailwind CSS | 3.x | 原子化CSS |
| **UI组件** | shadcn/ui | Latest | 预构建组件 |
| **包管理** | bun | 1.x | 快速包管理器 |
| **语言** | TypeScript | 5.x | 类型安全 |
| **认证** | Better Auth | Latest | 认证授权 |
| **向量数据库** | Milvus | 2.3.x | 相似度搜索 |
| **向量托管** | Zilliz Cloud | - | Milvus云服务 |
| **AI SDK** | Vercel AI SDK | 3.x | AI集成 |
| **AI模型** | OpenAI | GPT-4 | 匹配算法 + 话题生成 |
| **运行时** | Bun/Node.js | 18+/1.x | 服务端运行时 |

## 2. 系统图

### 2.1 整体系统架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                用户设备                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │   浏览器     │  │   移动端     │  │    PWA      │                         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                         │
└─────────┼─────────────────┼─────────────────┼──────────────────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │        Vercel Edge Network        │
          │    (CDN + 全球边缘节点分发)        │
          └─────────────┬───────────────────────┘
                        │
          ┌─────────────▼───────────────────────┐
          │         Vercel Platform             │
          │  ┌─────────────────────────────┐   │
          │  │     Next.js 应用服务        │   │
          │  │  ┌───────────────────────┐ │   │
          │  │  │   API Routes (REST)   │ │   │
          │  │  └───────────┬───────────┘ │   │
          │  │  ┌───────────▼───────────┐ │   │
          │  │  │  Server Actions       │ │   │
          │  │  └───────────┬───────────┘ │   │
          │  │  ┌───────────▼───────────┐ │   │
          │  │  │   React Components    │ │   │
          │  │  └───────────────────────┘ │   │
          │  └─────────────┬───────────────┘   │
          └───────────────┼─────────────────────┘
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
┌─────▼─────┐    ┌────────▼────────┐    ┌────▼──────┐
│ Zilliz    │    │   PostgreSQL    │    │ 外部服务   │
│ Cloud     │    │   (Neon)        │    │           │
│ (Milvus)  │    │                 │    │ ┌───────┐ │
│ 向量数据库 │    │ ┌─────────────┐ │    │ │邮件服务│ │
│           │    │ │ 用户数据    │ │    │ │       │ │
│ ┌───────┐ │    │ │ 匹配记录    │ │    │ └───────┘ │
│ │向量存储│ │    │ │ 偏好设置    │ │    │           │
│ └───────┘ │    │ └─────────────┘ │    └───────────┘
└───────────┘    └─────────────────┘
                        │
                        ▼
              ┌───────────────────────┐
              │   Better Auth         │
              │   (认证授权服务)       │
              └───────────┬───────────┘
                          │
              ┌───────────▼──────────┐
              │   Vercel AI SDK      │
              │   + OpenAI API       │
              │   (AI功能集成)       │
              └──────────────────────┘
```

### 2.2 数据流图

```
用户操作流程：
1. 用户输入 → Next.js页面 → API Routes
2. API Routes → Better Auth (认证)
3. API Routes → PostgreSQL (结构化数据)
4. API Routes → Zilliz Cloud (向量数据)
5. API Routes → OpenAI (AI推理)
6. 结果返回 → React组件 → 用户界面

嵌入向量生成流程：
用户资料更新 → 文本预处理 → OpenAI Embeddings → Zilliz Cloud存储 → 向量索引更新
```

## 3. 子系统设计

### 3.1 认证子系统 (Auth Subsystem)

**职责**: 处理用户注册、登录、会话管理和权限控制

**组件**:
- **Authentication Service**: 使用Better Auth处理注册/登录
- **Session Manager**: 管理JWT token和刷新机制
- **Permission Guard**: 路由级权限验证中间件
- **Password Service**: bcrypt密码加密和验证

**接口**:
- **输入**: 用户凭据、OAuth回调
- **输出**: JWT Token、用户信息、会话状态
- **外部依赖**: Better Auth、PostgreSQL

**安全特性**:
- 密码bcrypt加密 (C1: real.md)
- JWT token过期机制
- 密码强度验证
- 会话劫持防护

---

### 3.2 用户管理子系统 (User Management)

**职责**: 管理用户资料、基本信息和偏好设置

**组件**:
- **Profile Service**: 用户资料CRUD操作
- **Avatar Service**: 头像上传和处理
- **Preference Service**: 用户偏好管理
- **Privacy Service**: 隐私设置控制

**接口**:
- **输入**: 用户输入数据、文件上传
- **输出**: 用户资料、验证状态
- **依赖数据库**: PostgreSQL (用户表、偏好表)
- **依赖存储**: Vercel Blob (头像文件)

**数据模型**:
```sql
users (id, email, password_hash, created_at, updated_at)
profiles (id, user_id, basic_info, interests, needs, provide, privacy_settings)
preferences (id, user_id, matching_preferences, notification_settings)
```

---

### 3.3 向量数据库子系统 (Vector Database)

**职责**: 存储用户嵌入向量、执行相似度搜索

**组件**:
- **Embedding Service**: 生成用户资料嵌入向量
- **Vector Storage**: 管理Milvus向量集合
- **Similarity Search**: 执行向量相似度搜索
- **Index Manager**: 管理向量索引和更新

**接口**:
- **输入**: 用户资料文本、搜索向量
- **输出**: 相似用户列表、匹配分数
- **依赖**: Zilliz Cloud (Milvus)

**向量集合设计**:
```
Collection: user_profiles
Schema:
  - user_id (VARCHAR) - 主键
  - profile_vector (FLOAT_VECTOR: 1536) - OpenAI嵌入
  - interests (JSON) - 兴趣标签
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Index:
  - Index Type: IVF_FLAT
  - Metric: COSINE
  - nlist: 128
```

**约束**:
- 向量数据准确性验证 (C4: real.md)
- 定期向量更新机制
- 批量向量同步

---

### 3.4 AI匹配子系统 (AI Matching)

**职责**: 执行智能匹配算法、计算相似度

**组件**:
- **Matching Engine**: 核心匹配算法
- **Scoring Service**: 计算匹配分数
- **Ranking Service**: 推荐结果排序
- **Privacy Filter**: 隐私设置过滤

**接口**:
- **输入**: 用户ID、搜索条件
- **输出**: 匹配用户列表、匹配原因
- **依赖**: Vector DB、AI SDK、OpenAI

**匹配算法流程**:
```
1. 获取用户向量
2. 向量相似度搜索 (Top-K = 50)
3. 计算匹配分数 = 向量相似度 × 权重
4. 应用隐私过滤
5. 生成匹配原因 (使用AI)
6. 返回Top-10推荐
```

**约束**:
- 考虑用户隐私设置 (C3: real.md)
- 匹配结果多样化
- 实时性要求 < 2秒

---

### 3.5 破冰话题生成子系统 (IceBreaker Generation)

**职责**: 基于匹配用户生成个性化破冰话题

**组件**:
- **Topic Generator**: AI话题生成器
- **Topic Templates**: 预置话题模板
- **Content Filter**: 内容安全过滤
- **Topic Storage**: 话题历史存储

**接口**:
- **输入**: 两个用户的资料
- **输出**: 3-5个破冰话题
- **依赖**: OpenAI GPT-4、PostgreSQL

**生成流程**:
```
1. 提取双方共同点
2. 构建提示词模板
3. 调用OpenAI生成话题
4. 内容安全检查
5. 存储生成历史
6. 返回话题列表
```

**约束**:
- 不泄露私密信息 (C2: real.md)
- 话题内容安全合规
- 生成时间 < 3秒

---

### 3.6 匹配关系管理子系统 (Match Management)

**职责**: 管理用户之间的匹配关系和互动状态

**组件**:
- **Relation Service**: 匹配关系CRUD
- **Interest Tracking**: 兴趣表达追踪
- **Matching Service**: 匹配成功处理
- **Notification Service**: 匹配通知发送

**接口**:
- **输入**: 用户操作、匹配ID
- **输出**: 关系状态、通知
- **依赖**: PostgreSQL、邮件服务

**数据模型**:
```sql
matches (id, user_a_id, user_b_id, match_score, status, created_at)
user_interests (id, user_id, target_user_id, interest_type, created_at)
notifications (id, user_id, type, content, read_status, created_at)
```

---

### 3.7 文件存储子系统 (File Storage)

**职责**: 管理用户头像和其他文件上传

**组件**:
- **Upload Service**: 文件上传处理
- **Image Processor**: 图像压缩和格式转换
- **Storage Manager**: 云存储管理
- **Access Control**: 文件访问权限控制

**接口**:
- **输入**: 文件数据、文件类型
- **输出**: 文件URL、访问令牌
- **依赖**: Vercel Blob Storage

**约束**:
- 文件大小限制: 2MB
- 支持格式: JPG, PNG
- 自动图像压缩
- 安全的访问URL

---

## 4. API设计

### 4.1 API设计原则

- **RESTful风格**: 使用标准HTTP方法
- **版本控制**: `/api/v1/` 前缀
- **认证**: Bearer Token (JWT)
- **响应格式**: 统一JSON格式
- **错误处理**: 标准化错误码

### 4.2 API端点规范

#### 4.2.1 认证 APIs

```http
### 用户注册
POST /api/v1/auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (201):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "token": "jwt_token",
      "expiresAt": "2025-12-31T23:59:59Z"
    }
  }
}

### 用户登录
POST /api/v1/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "success": true,
  "data": {
    "user": {...},
    "session": {...}
  }
}

### 获取当前用户
GET /api/v1/auth/me
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "profile": {...}
    }
  }
}

### 用户登出
POST /api/v1/auth/logout
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 4.2.2 用户资料 APIs

```http
### 获取用户资料
GET /api/v1/users/profile
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "user_id": "uuid",
      "basic_info": {
        "name": "张三",
        "age": 25,
        "city": "北京"
      },
      "interests": ["音乐", "读书", "旅行"],
      "needs": "寻找志同道合的朋友",
      "provide": "心理咨询帮助",
      "avatar_url": "https://blob.vercel.com/...",
      "privacy_settings": {
        "profile_visibility": "matching_only",
        "show_online_status": false
      }
    }
  }
}

### 更新用户资料
PUT /api/v1/users/profile
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "basic_info": {
    "name": "张三",
    "age": 25,
    "city": "北京"
  },
  "interests": ["音乐", "读书", "旅行"],
  "needs": "寻找志同道合的朋友",
  "provide": "心理咨询帮助"
}

Response (200):
{
  "success": true,
  "data": {
    "profile": {...},
    "message": "Profile updated successfully"
  }
}

### 上传头像
POST /api/v1/users/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request:
FormData: {
  "avatar": File (JPG/PNG, max 2MB)
}

Response (200):
{
  "success": true,
  "data": {
    "avatar_url": "https://blob.vercel.com/...",
    "message": "Avatar uploaded successfully"
  }
}
```

#### 4.2.3 匹配 APIs

```http
### 获取匹配推荐
GET /api/v1/matches/recommendations
Authorization: Bearer {token}

Query Parameters:
- limit: number (default: 10, max: 50)
- offset: number (default: 0)

Response (200):
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "user_id": "uuid",
        "match_score": 0.85,
        "match_reasons": [
          "都喜欢音乐",
          "都喜欢读书",
          "都希望找到志同道合的朋友"
        ],
        "profile": {
          "basic_info": {
            "name": "李四",
            "age": 26,
            "city": "北京"
          },
          "interests": ["音乐", "读书"],
          "avatar_url": "https://blob.vercel.com/..."
        }
      }
    ],
    "total": 100,
    "has_more": true
  }
}

### 刷新匹配推荐
POST /api/v1/matches/refresh
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "message": "Match recommendations refreshed",
    "refreshed_at": "2025-12-24T21:00:00Z"
  }
}

### 表达兴趣
POST /api/v1/matches/interest
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "target_user_id": "uuid",
  "interest_type": "interested" // interested | not_interested
}

Response (200):
{
  "success": true,
  "data": {
    "match_id": "uuid",
    "status": "pending" // pending | matched | rejected
  }
}
```

#### 4.2.4 破冰话题 APIs

```http
### 生成破冰话题
POST /api/v1/icebreakers/generate
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "target_user_id": "uuid"
}

Response (200):
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "uuid",
        "type": "interest",
        "content": "我看到你也喜欢音乐，最近有什么特别想推荐的新歌吗？",
        "created_at": "2025-12-24T21:00:00Z"
      },
      {
        "id": "uuid",
        "type": "experience",
        "content": "你说喜欢旅行，最近去过哪些地方？有什么特别难忘的经历？",
        "created_at": "2025-12-24T21:00:00Z"
      }
    ]
  }
}

### 保存破冰话题
POST /api/v1/icebreakers/save
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "topic_id": "uuid"
}

Response (200):
{
  "success": true,
  "message": "Topic saved successfully"
}
```

#### 4.2.5 匹配历史 APIs

```http
### 获取匹配历史
GET /api/v1/matches/history
Authorization: Bearer {token}

Query Parameters:
- status: all | matched | rejected | pending
- limit: number (default: 20)
- offset: number (default: 0)

Response (200):
{
  "success": true,
  "data": {
    "history": [
      {
        "match_id": "uuid",
        "user_id": "uuid",
        "match_score": 0.85,
        "status": "matched",
        "created_at": "2025-12-24T20:00:00Z",
        "profile": {...}
      }
    ],
    "total": 50,
    "has_more": false
  }
}
```

#### 4.2.6 设置 APIs

```http
### 获取用户偏好
GET /api/v1/settings/preferences
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "preferences": {
      "matching": {
        "age_range": [18, 35],
        "distance_limit": 50, // km
        "interest_match_threshold": 0.6
      },
      "notifications": {
        "email_matches": true,
        "push_new_matches": true,
        "email_weekly_summary": false
      }
    }
  }
}

### 更新用户偏好
PUT /api/v1/settings/preferences
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "preferences": {
    "matching": {
      "age_range": [20, 30],
      "distance_limit": 30
    }
  }
}

Response (200):
{
  "success": true,
  "message": "Preferences updated successfully"
}
```

### 4.3 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### 4.4 状态码规范

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | 成功请求 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 429 | Too Many Requests | 请求频率限制 |
| 500 | Internal Server Error | 服务器错误 |

## 5. 目录结构

### 5.1 项目目录结构

```
as-old/
├── .42cog/                    # 认知敏捷法核心文件
│   ├── meta/
│   ├── real/
│   ├── cog/
│   └── spec/
│       ├── pm/
│       └── dev/
├── .next/                     # Next.js构建输出
├── public/                    # 静态资源
│   ├── favicon.ico
│   └── manifest.json
├── src/                       # 源代码目录
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # 认证路由组
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (main)/            # 主要应用路由组
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx
│   │   │   ├── matches/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   └── preferences/
│   │   │   │       └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/               # API路由
│   │   │   ├── v1/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── me/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── logout/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── users/
│   │   │   │   │   ├── profile/
│   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   └── avatar/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── matches/
│   │   │   │   │   ├── recommendations/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── refresh/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── interest/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── history/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── icebreakers/
│   │   │   │   │   ├── generate/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── save/
│   │   │   │   │       └── route.ts
│   │   │   │   └── settings/
│   │   │   │       └── preferences/
│   │   │   │           └── route.ts
│   │   │   └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # React组件
│   │   ├── ui/                # 基础UI组件 (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   ├── auth/              # 认证相关组件
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── auth-guard.tsx
│   │   ├── layout/            # 布局组件
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── navigation.tsx
│   │   ├── profile/           # 用户资料组件
│   │   │   ├── profile-form.tsx
│   │   │   ├── avatar-upload.tsx
│   │   │   ├── profile-card.tsx
│   │   │   └── privacy-settings.tsx
│   │   ├── matches/           # 匹配相关组件
│   │   │   ├── match-card.tsx
│   │   │   ├── match-list.tsx
│   │   │   ├── match-reasons.tsx
│   │   │   └── match-actions.tsx
│   │   ├── icebreakers/       # 破冰话题组件
│   │   │   ├── topic-card.tsx
│   │   │   ├── topic-generator.tsx
│   │   │   └── topic-list.tsx
│   │   └── settings/          # 设置组件
│   │       ├── preference-form.tsx
│   │       └── notification-settings.tsx
│   ├── lib/                   # 工具库和配置
│   │   ├── auth/              # 认证配置
│   │   │   ├── auth.config.ts
│   │   │   └── session.ts
│   │   ├── db/                # 数据库配置
│   │   │   ├── schema.ts      # Drizzle schema
│   │   │   ├── migrations/    # 数据库迁移
│   │   │   └── index.ts
│   │   ├── vector/            # 向量数据库
│   │   │   ├── milvus.ts      # Milvus客户端
│   │   │   ├── embedding.ts   # 嵌入向量生成
│   │   │   └── similarity.ts  # 相似度计算
│   │   ├── ai/                # AI服务
│   │   │   ├── openai.ts      # OpenAI客户端
│   │   │   ├── matching.ts    # 匹配算法
│   │   │   └── topics.ts      # 话题生成
│   │   ├── storage/           # 文件存储
│   │   │   └── blob.ts        # Vercel Blob
│   │   ├── utils.ts           # 通用工具函数
│   │   ├── validations.ts     # Zod验证模式
│   │   └── constants.ts       # 常量定义
│   ├── services/              # 业务逻辑服务
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── profile.service.ts
│   │   ├── matching.service.ts
│   │   ├── icebreaker.service.ts
│   │   └── notification.service.ts
│   ├── hooks/                 # 自定义React Hooks
│   │   ├── use-auth.ts
│   │   ├── use-profile.ts
│   │   ├── use-matches.ts
│   │   └── use-icebreakers.ts
│   ├── types/                 # TypeScript类型定义
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── match.types.ts
│   │   └── api.types.ts
│   └── stores/                # 状态管理 (Zustand)
│       ├── auth.store.ts
│       ├── profile.store.ts
│       └── ui.store.ts
├── .env.local                 # 环境变量
├── .env.example               # 环境变量示例
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── drizzle.config.ts          # Drizzle配置
├── bun.lockb
└── README.md
```

### 5.2 目录设计原则

| 目录 | 目的 | 命名规范 | 说明 |
|------|------|----------|------|
| `app/` | Next.js路由 | kebab-case | 按功能分组，使用route groups |
| `components/` | React组件 | PascalCase.tsx | 按特性分组，便于复用 |
| `lib/` | 工具库 | camelCase.ts | 第三方配置和工具函数 |
| `services/` | 业务逻辑 | camelCase.service.ts | 独立于框架的业务逻辑 |
| `hooks/` | 自定义Hooks | camelCase.ts | 组合式逻辑抽象 |
| `types/` | 类型定义 | camelCase.ts | 全局TypeScript类型 |
| `stores/` | 状态管理 | camelCase.store.ts | Zustand状态存储 |

## 6. 安全架构

### 6.1 安全层次架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        传输层安全                              │
│                    HTTPS + HSTS + TLS 1.3                     │
├─────────────────────────────────────────────────────────────────┤
│                        认证层安全                              │
│            Better Auth + JWT + Password Hashing               │
│                  (bcrypt + salt)                              │
├─────────────────────────────────────────────────────────────────┤
│                        授权层安全                              │
│                  RBAC + Resource Ownership                    │
│                    + Session Management                       │
├─────────────────────────────────────────────────────────────────┤
│                        数据层安全                              │
│     AES-256加密 + Input Validation + SQL注入防护             │
│                + XSS防护 + CSRF防护                           │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 安全需求矩阵

| 层级 | 安全需求 | 实现方式 | 参考约束 |
|------|----------|----------|----------|
| **传输层** | 加密通信 | HTTPS only, HSTS | 所有数据传输 |
| **认证** | 密码安全 | bcrypt哈希 + salt | C1 (real.md) |
| **认证** | 会话管理 | JWT with expiry | 7天免登录 |
| **授权** | 权限控制 | RBAC (user/admin) | 资源所有权验证 |
| **数据** | 敏感信息加密 | AES-256-GCM | C2 (real.md) |
| **数据** | 输入验证 | Zod schemas | 防止注入攻击 |
| **隐私** | 隐私设置 | Field-level encryption | C3 (real.md) |
| **向量** | 数据准确性 | 定期验证机制 | C4 (real.md) |

### 6.3 数据加密策略

**加密层次**:
1. **传输加密**: TLS 1.3
2. **存储加密**: AES-256-GCM
3. **字段级加密**: PII敏感字段
4. **向量加密**: 向量数据访问控制

**加密字段**:
```typescript
// 需要加密的字段
const encryptedFields = [
  'email',
  'phone',
  'real_name',
  'detailed_interests',
  'personal_needs',
  'private_information'
];
```

### 6.4 隐私保护机制

**隐私设置级别**:
- **公开**: 所有用户可见
- **仅匹配可见**: 仅对匹配用户可见
- **完全私密**: 仅自己可见

**隐私过滤**:
```typescript
// 匹配时的隐私过滤逻辑
async function applyPrivacyFilter(
  userId: string,
  candidateProfiles: Profile[]
): Promise<Profile[]> {
  const privacySettings = await getUserPrivacySettings(userId);

  return candidateProfiles.filter(profile => {
    // 根据双方隐私设置过滤
    return shouldShowProfile(profile, userId, privacySettings);
  });
}
```

### 6.5 安全监控

**监控指标**:
- 异常登录尝试
- API调用频率
- 密码暴力破解
- 敏感数据访问
- 向量数据库查询

**告警机制**:
- 登录失败 > 5次/分钟
- API调用 > 100次/分钟
- 异常地理位置登录
- 敏感操作审计日志

## 7. 技术决策 (ADR)

### ADR-001: 选择Next.js 15作为全栈框架

**状态**: 已接受

**背景**:
需要选择一个现代化的全栈框架来构建如故应用，要求支持React、服务端渲染、API路由和边缘部署。

**决策**:
选择Next.js 15作为核心框架，原因如下：
- App Router提供更好的路由和布局系统
- 内置API Routes支持全栈开发
- 边缘运行支持全球分发
- 与Vercel平台深度集成
- 优秀的开发者体验

**后果**:
- ✅ 开发效率高，配置简单
- ✅ 性能优秀，支持SSR/SSG
- ✅ 部署便捷，Vercel原生支持
- ✅ 社区活跃，生态丰富
- ❌ 与Vercel平台强绑定

### ADR-002: 使用Zilliz Cloud (Milvus)作为向量数据库

**状态**: 已接受

**背景**:
应用需要存储和查询用户嵌入向量，进行相似度搜索来实现智能匹配功能。

**决策**:
选择Zilliz Cloud托管的Milvus作为向量数据库：
- Milvus是专门为向量检索优化的数据库
- Zilliz Cloud提供托管服务，无需运维
- 支持多种向量索引类型
- 高性能相似度搜索
- 与Node.js SDK集成良好

**后果**:
- ✅ 专业的向量检索能力
- ✅ 托管服务，稳定可靠
- ✅ 自动扩缩容
- ✅ 成本按使用量计费
- ❌ 第三方服务依赖
- ❌ 向量数据迁移复杂

### ADR-003: 选择Better Auth作为认证解决方案

**状态**: 已接受

**背景**:
需要一个现代化、安全、易用的认证解决方案，支持密码登录、会话管理和权限控制。

**决策**:
选择Better Auth作为认证框架：
- 现代化设计，支持多种认证方式
- 类型安全的TypeScript支持
- 内置会话管理和JWT支持
- 安全性高，支持多种安全特性
- Next.js生态深度集成

**后果**:
- ✅ 快速集成，开发效率高
- ✅ 类型安全，减少错误
- ✅ 安全性全面
- ✅ 扩展性好
- ❌ 学习新框架成本

### ADR-004: 使用Vercel AI SDK集成OpenAI

**状态**: 已接受

**背景**:
应用需要集成AI能力用于生成嵌入向量、匹配算法优化和破冰话题生成。

**决策**:
选择Vercel AI SDK + OpenAI的组合：
- Vercel AI SDK提供统一的AI接口
- 支持流式响应和流式UI
- OpenAI提供高质量的GPT-4模型
- SDK内置流式传输优化
- 边缘环境原生支持

**后果**:
- ✅ 统一的AI接口，代码简洁
- ✅ 流式响应，用户体验好
- ✅ 边缘部署，性能优秀
- ✅ 与Next.js完美集成
- ❌ 依赖OpenAI服务
- ❌ API调用成本

### ADR-005: 使用Drizzle ORM进行数据库操作

**状态**: 已接受

**背景**:
需要类型安全的数据库ORM，支持PostgreSQL，与TypeScript良好集成。

**决策**:
选择Drizzle ORM：
- 零运行时开销的类型安全
- SQL-like查询语法
- 优秀的TypeScript支持
- 轻量级，性能优秀
- 迁移系统完善

**后果**:
- ✅ 类型安全，编译时检查
- ✅ 性能优秀，无抽象开销
- ✅ 学习成本低
- ✅ 迁移便捷
- ❌ 相对较新，生态较小
- ❌ 功能不如Prisma丰富

### ADR-006: 使用Vercel Blob Storage存储文件

**状态**: 已接受

**背景**:
需要存储用户头像等文件，要求高性能、安全、易用。

**决策**:
选择Vercel Blob Storage：
- 与Vercel平台深度集成
- 全球CDN分发
- 类型安全的API
- 按使用量计费
- 简单的URL访问控制

**后果**:
- ✅ 集成度高，配置简单
- ✅ 全球分发，加载快
- ✅ 类型安全API
- ✅ 按需付费
- ❌ 仅限Vercel生态

### ADR-007: 采用分层架构 + 模块化设计

**状态**: 已接受

**背景**:
需要清晰的项目结构，确保代码可维护性、可测试性和可扩展性。

**决策**:
采用分层架构结合模块化设计：
- 表示层：React组件
- 应用层：API Routes + Server Actions
- 领域层：Services + Business Logic
- 基础设施层：Database + External APIs

**后果**:
- ✅ 职责清晰，代码组织良好
- ✅ 易于测试和维护
- ✅ 支持独立开发
- ✅ 便于代码复用
- ❌ 增加架构复杂度
- ❌ 需要更多样板代码

## 8. 性能优化

### 8.1 前端性能优化

**策略**:
- **代码分割**: Next.js自动路由级代码分割
- **图片优化**: Next.js Image组件 + WebP格式
- **预渲染**: SSG + ISR页面预渲染
- **缓存策略**: SWR + React Cache
- **Bundle优化**: Tree shaking + 动态导入

**指标目标**:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- 首屏加载 < 3s

### 8.2 后端性能优化

**策略**:
- **API响应缓存**: Redis缓存热点数据
- **数据库优化**: 索引优化 + 查询优化
- **向量检索优化**: 索引参数调优
- **并发处理**: 连接池 + 异步处理
- **CDN加速**: 静态资源边缘分发

**指标目标**:
- API响应 < 500ms
- 匹配计算 < 2s
- 向量检索 < 1s
- 并发用户 100+

### 8.3 扩展性设计

**水平扩展**:
- 无状态API设计
- 数据库读写分离
- 向量数据库分片
- 微服务架构准备

**垂直扩展**:
- 资源配置优化
- 缓存层增加
- 索引优化
- 代码优化

## 9. 监控与日志

### 9.1 监控指标

**应用指标**:
- 响应时间 (P50, P95, P99)
- 错误率
- 吞吐量
- 活跃用户数

**业务指标**:
- 注册转化率
- 匹配成功率
- 用户留存率
- 功能使用率

**基础设施指标**:
- CPU/内存使用率
- 数据库连接数
- 向量数据库查询延迟
- CDN命中率

### 9.2 日志策略

**日志级别**:
- ERROR: 错误和异常
- WARN: 警告信息
- INFO: 关键业务信息
- DEBUG: 调试信息

**结构化日志**:
```json
{
  "timestamp": "2025-12-24T21:00:00Z",
  "level": "INFO",
  "service": "matching-service",
  "userId": "uuid",
  "action": "generate_recommendations",
  "duration": 1250,
  "result": "success",
  "metadata": {
    "candidateCount": 50,
    "returnedCount": 10
  }
}
```

### 9.3 告警规则

**关键告警**:
- 错误率 > 5%
- 响应时间 > 5s
- 数据库连接失败
- 向量检索失败
- 认证服务异常

## 10. 部署策略

### 10.1 环境配置

**开发环境**:
- 本地开发服务器 (Next.js Dev Server)
- 本地PostgreSQL (Docker)
- 本地Milvus (Docker)
- 热重载 + 调试

**测试环境**:
- Vercel Preview Deployment
- 测试数据库 (Neon免费层)
- Zilliz Cloud免费层

**生产环境**:
- Vercel Production
- Neon Pro数据库
- Zilliz Cloud付费版
- CDN + 边缘计算

### 10.2 CI/CD流程

```yaml
# GitHub Actions Workflow
1. 代码提交 → 触发Workflow
2. 运行测试 → Jest + Playwright
3. 类型检查 → TypeScript Compiler
4. 构建应用 → Next.js Build
5. 部署预览 → Vercel Preview
6. 手动确认 → 部署生产
7. 生产部署 → Vercel Production
```

### 10.3 回滚策略

- **蓝绿部署**: 零停机时间部署
- **数据库迁移**: 向前兼容 + 回滚脚本
- **特性开关**: 渐进式功能发布
- **监控告警**: 自动回滚触发

## 11. 风险评估与缓解

### 11.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 向量数据库服务中断 | 中 | 高 | 多区域部署 + 本地备选 |
| OpenAI API限制 | 中 | 高 | 多模型备选 + 缓存机制 |
| Vercel平台故障 | 低 | 高 | 多云部署准备 |
| 数据库性能瓶颈 | 中 | 中 | 监控预警 + 性能调优 |
| 存储成本超预算 | 中 | 中 | 成本监控 + 清理策略 |

### 11.2 安全风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 数据泄露 | 低 | 高 | 端到端加密 + 访问控制 |
| 密码暴力破解 | 中 | 中 | 速率限制 + CAPTCHA |
| 向量数据泄露 | 低 | 高 | 访问控制 + 数据脱敏 |
| API滥用 | 中 | 中 | 速率限制 + 身份验证 |

### 11.3 业务风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 用户增长缓慢 | 中 | 中 | 营销优化 + 产品迭代 |
| 匹配质量不佳 | 中 | 中 | 算法优化 + 反馈机制 |
| 隐私合规问题 | 低 | 高 | 法律咨询 + 隐私设计 |
| 竞争对手出现 | 中 | 中 | 差异化优势 + 快速迭代 |

## 12. 演进路线图

### 12.1 MVP阶段 (v0.1.0 - v0.5.0)

**目标**: 核心功能验证
- ✅ 用户注册登录
- ✅ 个人资料管理
- ✅ 基础匹配功能
- ✅ 破冰话题生成
- 🔄 匹配关系管理
- 🔄 用户设置

### 12.2 增强阶段 (v0.6.0 - v1.0.0)

**目标**: 完善用户体验
- 高级匹配算法
- 实时通知系统
- 移动端优化
- 性能优化
- 安全加固

### 12.3 扩展阶段 (v1.1.0 - v2.0.0)

**目标**: 功能扩展
- 聊天功能
- 群组匹配
- 高级筛选
- 数据分析
- API开放

### 12.4 优化阶段 (v2.1.0+)

**目标**: 规模化运营
- 微服务架构
- 多租户支持
- AI算法优化
- 国际化支持
- 生态建设

---

**文档维护**:
- 负责人: 江浩
- 更新频率: 每次架构变更
- 版本控制: Git跟踪
- 评审流程: 技术团队评审

**更新记录**:
| 版本 | 日期 | 更新内容 | 作者 |
|------|------|----------|------|
| 0.1.0 | 2025-12-24 | 初始架构设计 | 江浩 |
