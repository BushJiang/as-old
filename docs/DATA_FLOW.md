# 用户注册数据流动详细文档

## 一、核心存储位置

### localStorage（浏览器本地存储）

**访问方式**: 浏览器开发者工具 → Application → Local Storage

```
┌─────────────────────────────────────────────────────────────┐
│                    localStorage                               │
├─────────────────────────────────────────────────────────────┤
│ auth-storage   → 认证数据（账号、密码、登录状态）              │
│ user-storage   → 用户资料（姓名、年龄、兴趣等）                │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、auth-storage（认证数据）

### 文件与存储位置

| 项目 | 位置 |
|------|------|
| **源文件** | `/src/stores/auth-store.ts` |
| **localStorage 键** | `auth-storage` |
| **persist 配置** | 第 117-125 行 |

### 数据结构

```json
{
  "state": {
    "isAuthenticated": true,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "test@example.com",
      "password": "",
      "hasCompletedProfile": true
    },
    "mockUsers": [
      {
        "id": "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
        "email": "test@example.com",
        "password": "123456",
        "hasCompletedProfile": true
      }
    ]
  },
  "version": 0
}
```

### 变量详细位置

| 变量名 | 类型 | 文件中的位置 | 说明 |
|--------|------|-------------|------|
| `INITIAL_MOCK_USERS` | 常量 | 第 12-25 行 | 初始测试账号（静态） |
| `isAuthenticated` | state | 第 30 行 | 是否已登录 |
| `user` | state | 第 31 行 | 当前登录用户信息 |
| `mockUsers` | state | 第 32 行 | 所有注册用户列表 |

### 关键方法位置

| 方法 | 位置 | 功能 |
|------|------|------|
| `login()` | 第 35-57 行 | 登录验证 |
| `register()` | 第 60-94 行 | 注册新账号 |
| `logout()` | 第 97-102 行 | 退出登录 |
| `completeProfile()` | 第 105-115 行 | 标记资料完成 |

### persist 持久化配置（第 117-125 行）

```typescript
{
  name: 'auth-storage',                              // 存储键名
  storage: createJSONStorage(() => localStorage), // 使用 localStorage
  partialize: (state) => ({                       // 只持久化这些字段
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    mockUsers: state.mockUsers,
  }),
}
```

---

## 三、user-storage（用户资料）

### 文件与存储位置

| 项目 | 位置 |
|------|------|
| **源文件** | `/src/stores/user-store.ts` |
| **localStorage 键** | `user-storage` |
| **persist 配置** | 第 105 行 |

### 数据结构

```json
{
  "state": {
    "currentUser": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "张三",
      "age": 26,
      "city": "北京",
      "avatar": "/avatars/default.svg",
      "bio": "一句话介绍自己",
      "interests": ["读书", "音乐", "电影"],
      "needs": ["深度对话"],
      "provide": ["文学分享"]
    },
    "potentialMatches": [...],
    "wantToKnowMatches": [],
    "passedMatches": []
  },
  "version": 0
}
```

### 变量详细位置

| 变量名 | 类型 | 文件中的位置 | 说明 |
|--------|------|-------------|------|
| `createDefaultUser()` | 函数 | 第 9-19 行 | 创建默认用户数据 |
| `generateRecommendationsForUser()` | 函数 | 第 22-31 行 | 生成推荐匹配 |
| `currentUser` | state | 第 45 行 | 当前用户完整资料 |
| `potentialMatches` | state | 第 46 行 | 潜在匹配用户列表 |
| `wantToKnowMatches` | state | 第 47 行 | 想认识的用户列表 |
| `passedMatches` | state | 第 48 行 | 已跳过的用户列表 |

### 关键方法位置

| 方法 | 位置 | 功能 |
|------|------|------|
| `updateProfile()` | 第 50-52 行 | 更新用户资料 |
| `wantToKnowUser()` | 第 58-67 行 | 添加到想认识列表 |
| `passUser()` | 第 69-75 行 | 添加到已跳过列表 |
| `reinitializeUser()` | 第 80-92 行 | 重新初始化（切换账号时） |
| `clearMatches()` | 第 95-102 行 | 清除匹配数据 |

---

## 四、个人信息存储在哪里？

### 答案

**个人信息存储在**: `localStorage['user-storage'].state.currentUser`

### 完整路径

```
浏览器开发者工具
  ↓
Application 标签
  ↓
Local Storage
  ↓
user-storage（键）
  ↓
state（JSON 对象）
  ↓
currentUser（对象）
  ↓
{
  id: string,           ← UUID，与 auth-storage.user.id 一致
  name: string,         ← 姓名
  age: number,          ← 年龄
  city: string,         ← 城市
  avatar: string,       ← 头像路径
  bio: string,          ← 个人简介
  interests: string[],  ← 兴趣爱好
  needs: string[],      ← 需求
  provide: string[]     ← 提供
}
```

### 数据对应关系

| 个人信息字段 | 存储位置 | 源头文件 |
|-------------|----------|----------|
| 姓名 | `user-storage.currentUser.name` | user-store.ts 第 11 行 |
| 年龄 | `user-storage.currentUser.age` | user-store.ts 第 12 行 |
| 城市 | `user-storage.currentUser.city` | user-store.ts 第 13 行 |
| 头像 | `user-storage.currentUser.avatar` | user-store.ts 第 14 行 |
| 简介 | `user-storage.currentUser.bio` | user-store.ts 第 15 行 |
| 兴趣 | `user-storage.currentUser.interests` | user-store.ts 第 16 行 |
| 需求 | `user-storage.currentUser.needs` | user-store.ts 第 17 行 |
| 提供 | `user-storage.currentUser.provide` | user-store.ts 第 18 行 |

---

## 五、注册流程（步骤1：创建账号）

### 页面位置
`/src/app/auth/register/page.tsx`

### 表单状态变量（第 14-26 行）

```typescript
const [email, setEmail] = useState('')           // 邮箱
const [password, setPassword] = useState('')       // 密码
const [confirmPassword, setConfirmPassword] = useState('')
const [formData, setFormData] = useState({        // 个人资料
  name: '',
  age: '',
  city: '',
  bio: '',
  interestsText: '',
  needsText: '',
  provideText: '',
})
```

### 触发函数
`handleAccountSubmit()` - 第 30-55 行

### 执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 1: 用户输入                                               │
│                                                                 │
│ email = "new@example.com"                                      │
│ password = "password123"                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 2: 调用 auth-store.register()                            │
│ 文件: /src/stores/auth-store.ts                               │
│ 位置: 第 60-94 行                                              │
│                                                                 │
│ 执行内容:                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ a) 检查邮箱是否存在 (第 65-68 行)                           │ │
│ │    get().mockUsers.some(u => u.email === email)              │ │
│ │                                                             │ │
│ │ b) 生成 UUID (第 72 行)                                     │ │
│ │    id: crypto.randomUUID()                                  │ │
│ │    → "550e8400-e29b-41d4-a716-446655440000"                │ │
│ │                                                             │ │
│ │ c) 创建 AuthUser 对象 (第 71-76 行)                          │ │
│ │    {                                                         │ │
│ │      id: "550e8400-...",                                   │ │
│ │      email: "new@example.com",                              │ │
│ │      password: "password123",                              │ │
│ │      hasCompletedProfile: false                            │ │
│ │    }                                                         │ │
│ │                                                             │ │
│ │ d) 添加到 mockUsers (第 79-81 行)                            │ │
│ │    set(state => ({                                          │ │
│ │      mockUsers: [...state.mockUsers, newUser]              │ │
│ │    }))                                                       │ │
│ │                                                             │ │
│ │ e) 设置登录状态 (第 83-91 行)                               │ │
│ │    set({                                                      │ │
│ │      isAuthenticated: true,                                  │ │
│ │      user: { id, email, password: '', hasCompletedProfile } │ │
│ │    })                                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ → 自动保存到 localStorage['auth-storage']                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 3: 进入步骤 2 (第 51 行)                                  │
│                                                                 │
│ setStep(2)                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 步骤1完成后 auth-storage 的内容

```json
{
  "state": {
    "isAuthenticated": true,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "new@example.com",
      "password": "",
      "hasCompletedProfile": false
    },
    "mockUsers": [
      { "id": "a1b2c3d4-...", "email": "test@example.com", ... },
      { "id": "550e8400-...", "email": "new@example.com", ... }
    ]
  }
}
```

---

## 六、注册流程（步骤2：填写个人资料）

### 触发函数
`handleProfileSubmit()` - 第 57-107 行

### 执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 1: 用户填写表单                                           │
│                                                                 │
│ formData.name = "张三"                                        │
│ formData.age = "26"                                           │
│ formData.city = "北京"                                        │
│ formData.bio = "热爱生活"                                     │
│ formData.interestsText = "读书\n音乐\n电影"                     │
│ formData.needsText = "深度对话"                                │
│ formData.provideText = "文学分享"                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 2: 调用 user-store.updateProfile()                        │
│ 文件: /src/stores/user-store.ts                                │
│ 位置: 第 50-52 行                                              │
│                                                                 │
│ 执行内容:                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ updateProfile({                                             │ │
│ │   id: user.id,              ← 来自 auth-store.user.id       │ │
│ │   name: "张三",                                           │ │
│ │   age: 26,                                                │ │
│ │   city: "北京",                                           │ │
│ │   avatar: "/avatars/default.svg",                          │ │
│ │   bio: "热爱生活",                                         │ │
│ │   interests: ["读书", "音乐", "电影"],                       │ │
│ │   needs: ["深度对话"],                                     │ │
│ │   provide: ["文学分享"]                                    │ │
│ │ })                                                         │ │
│ │                                                             │ │
│ │ → 合并到 currentUser (user-store 第 45 行)                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ → 自动保存到 localStorage['user-storage']                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 3: 调用 auth-store.completeProfile()                       │
│ 文件: /src/stores/auth-store.ts                                │
│ 位置: 第 105-115 行                                             │
│                                                                 │
│ 执行内容:                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ set({                                                      │ │
│ │   user: {                                                │ │
│ │     ...currentUser,                                      │ │
│ │     hasCompletedProfile: true                            │ │
│ │   }                                                       │ │
│ │ })                                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ → 自动保存到 localStorage['auth-storage']                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 4: 跳转到 /profile (第 98 行)                              │
│                                                                 │
│ router.push('/profile')                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 步骤2完成后 localStorage 的完整内容

#### auth-storage
```json
{
  "state": {
    "isAuthenticated": true,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "new@example.com",
      "password": "",
      "hasCompletedProfile": true
    },
    "mockUsers": [
      { "id": "a1b2c3d4-...", "email": "test@example.com", ... },
      { "id": "550e8400-...", "email": "new@example.com", ... }
    ]
  }
}
```

#### user-storage
```json
{
  "state": {
    "currentUser": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "张三",
      "age": 26,
      "city": "北京",
      "avatar": "/avatars/default.svg",
      "bio": "热爱生活",
      "interests": ["读书", "音乐", "电影"],
      "needs": ["深度对话"],
      "provide": ["文学分享"]
    },
    "potentialMatches": [/* 10 个推荐用户 */],
    "wantToKnowMatches": [],
    "passedMatches": []
  }
}
```

---

## 七、登录流程

### 页面位置
`/src/app/auth/login/page.tsx`

### 执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 1: 用户输入                                               │
│                                                                 │
│ email = "test@example.com"                                    │
│ password = "123456"                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 2: 调用 auth-store.login()                                │
│ 文件: /src/stores/auth-store.ts                                │
│ 位置: 第 35-57 行                                              │
│                                                                 │
│ 执行内容:                                                       │
│ - 在 mockUsers 中查找匹配用户 (第 39-41 行)                    │
│ - 设置 isAuthenticated 和 user (第 44-52 行)                     │
│                                                                 │
│ → 保存到 localStorage['auth-storage']                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 3: 调用 user-store.reinitializeUser()                       │
│ 文件: /src/stores/user-store.ts                                │
│ 位置: 第 80-92 行                                              │
│                                                                 │
│ 执行内容:                                                       │
│ - 重新获取 auth-store.user.id                                   │
│ - 创建新的默认用户数据                                          │
│ - 重新生成推荐匹配                                              │
│ - 清空 wantToKnowMatches 和 passedMatches                        │
│                                                                 │
│ → 保存到 localStorage['user-storage']                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 步骤 4: 跳转主页 (第 28 行)                                     │
│                                                                 │
│ router.push('/')                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 八、数据对应关系速查表

### 我想查找...

| 查找内容 | 存储位置 | 源文件位置 |
|---------|----------|------------|
| 用户注册的账号列表 | `auth-storage.mockUsers` | auth-store.ts 第 32 行 |
| 当前登录用户的邮箱 | `auth-storage.user.email` | auth-store.ts 第 31 行 |
| 当前登录用户的 ID | `auth-storage.user.id` | auth-store.ts 第 31 行 |
| 当前登录用户的姓名 | `user-storage.currentUser.name` | user-store.ts 第 45 行 |
| 当前登录用户的年龄 | `user-storage.currentUser.age` | user-store.ts 第 45 行 |
| 当前用户的兴趣爱好 | `user-storage.currentUser.interests` | user-store.ts 第 45 行 |
| "想认识"的用户列表 | `user-storage.wantToKnowMatches` | user-store.ts 第 47 行 |
| 已跳过的用户列表 | `user-storage.passedMatches` | user-store.ts 第 48 行 |
| 注册时生成的 ID | `auth-storage.mockUsers[].id` | auth-store.ts 第 72 行 |

### ID 同步关系

```
auth-storage.user.id  ==  user-storage.currentUser.id
```

- 两个 ID 必须一致
- user-store 初始化时从 auth-store 获取 ID（user-store.ts 第 37-38 行）
- 确保数据关联正确

---

## 九、对话中修复的问题汇总

### 问题 1: 注册数据丢失
- **原因**: `mockUsers` 只在内存中
- **修复**: 移入 state 并持久化

### 问题 2: ID 不一致
- **原因**: 使用固定字符串 `'current-user'`
- **修复**: 改用 `crypto.randomUUID()`

### 问题 3: "想认识"数量错误
- **原因**: localStorage 保留旧数据
- **修复**: 登录时重新初始化

### 问题 4: 切换账号显示旧用户信息
- **原因**: persist 恢复未重新初始化
- **修复**: 添加 `reinitializeUser()` 方法

### 问题 5: 路由命名不规范
- **修复**: `/me` → `/profile`

### 问题 6: 字段冗余
- **修复**: 删除 `personalityTags`, `isOnline`, `lastSeen`

### 问题 7: 注册页面文字优化
- **修复**: 删除"可选"、年龄范围提示等
