# 邮箱验证码功能踩坑总结

## 背景
使用 Next.js + Resend 实现邮箱验证码登录功能。

---

## 踩坑记录

### 坑 1：React 组件无法渲染

**错误信息**：
```
Error: Failed to render React component. Make sure to install `@react-email/render` or `@react-email/components`.
```

**原因**：
- Resend 的 `react` 参数需要 `@react-email/render` 或 `@react-email/components` 包来渲染 React 组件
- 项目中只安装了 `resend` 包，没有安装 React Email 相关的包

**解决方案**：
```bash
bun add @react-email/components @react-email/render
```

---

### 坑 2：域名未验证

**错误信息**：
```json
{
  "statusCode": 403,
  "message": "The rugumatch.com domain is not verified. Please, add and verify your domain on https://resend.com/domains",
  "name": "validation_error"
}
```

**原因**：
- 使用了自定义域名 `noreply@rugumatch.com` 作为发件人
- Resend 要求验证域名后才能使用（防止垃圾邮件）

**解决方案**：
1. **临时方案**：使用 Resend 的免费测试域名
   ```bash
   EMAIL_FROM=如故 <onboarding@resend.dev>
   ```
2. **生产方案**：购买域名并在 Resend 控制台验证

---

### 坑 3：测试域名只能发送到账户邮箱

**错误信息**：
```json
{
  "statusCode": 403,
  "message": "You can only send testing emails to your own email address (jianghao3210@gmail.com). To send emails to other recipients, please verify a domain at resend.com/domains."
}
```

**原因**：
- 使用 `@resend.dev` 测试域名时，只能发送到 Resend 账户关联的邮箱
- 这是 Resend 的安全限制，防止滥用

**解决方案**：
1. **开发测试**：使用账户邮箱（如 `jianghao3210@gmail.com`）测试
2. **添加测试邮箱**：在 Resend 控制台 → Audiences 添加收件人邮箱
3. **开发降级**：在控制台输出验证码（已实现）

---

### 坑 4：发送间隔太长影响调试

**问题**：
- 初始设置 5 分钟发送间隔
- 调试时代码经常需要修改，频繁测试受限制

**解决方案**：
```typescript
// 可配置的发送间隔
const RETRY_INTERVAL_SECONDS = process.env.NODE_ENV === "development" ? 30 : 60
// 开发环境 30 秒，生产环境 60 秒
```

---

### 坑 5：需要重启服务器才能加载新环境变量

**问题**：
- 修改 `.env.local` 后，Next.js 不会自动重新加载环境变量
- 导致配置修改不生效

**解决方案**：
```bash
# 停止服务器
Ctrl+C

# 重新启动
bun run dev
```

---

## 正确的实现流程

### 1. 安装依赖
```bash
bun add resend @react-email/components @react-email/render
```

### 2. 创建 React 邮件模板
```typescript
// src/components/email/VerificationCodeEmail.tsx
export function VerificationCodeEmail({ code }: { code: string }) {
  return (
    <div>
      {/* 邮件内容 */}
      <span>{code}</span>
    </div>
  )
}
```

### 3. 配置环境变量
```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=如故 <onboarding@resend.dev>
```

### 4. 发送邮件 API
```typescript
import { Resend } from "resend"
import { VerificationCodeEmail } from "@/components/email/VerificationCodeEmail"

const resend = new Resend(process.env.RESEND_API_KEY)

const { data, error } = await resend.emails.send({
  from: process.env.EMAIL_FROM,
  to: email,
  subject: "如故登录验证码",
  react: VerificationCodeEmail({ code }),
})

// 开发环境降级方案
if (error && process.env.NODE_ENV === "development") {
  console.log("验证码:", code)
  return true
}
```

---

## Resend 免费方案限制

### @resend.dev 测试域名
- ✅ 每月 3,000 封邮件免费
- ✅ 每天 100 封邮件
- ⚠️ 只能发送到账户邮箱
- ⚠️ 不适合生产环境

### 自定义域名
- ✅ 无收件人限制
- ✅ 品牌化发件人地址
- ❌ 需要购买域名（约 $10-15/年）
- ❌ 需要配置 DNS 验证

---

## 推荐方案

### 开发阶段
1. 使用 `@resend.dev` 测试域名
2. 在控制台输出验证码作为降级方案
3. 使用账户邮箱测试邮件接收
4. 发送间隔设置为 30 秒

### 生产环境
1. 购买并验证自定义域名
2. 使用自定义域名作为发件人
3. 发送间隔设置为 60 秒
4. 移除控制台输出验证码的代码

---

## 关键配置

```typescript
// 可配置参数
const CODE_EXPIRY_MINUTES = 5 // 验证码有效期
const RETRY_INTERVAL_SECONDS = process.env.NODE_ENV === "development" ? 30 : 60
```

```bash
# 环境变量
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=如故 <onboarding@resend.dev>
```

---

## 总结

1. **必须安装**：`@react-email/components` 和 `@react-email/render`
2. **开发环境**：使用 `@resend.dev` + 控制台输出
3. **生产环境**：验证自定义域名
4. **调试技巧**：缩短发送间隔到 30 秒
5. **环境变量**：修改后需要重启服务器

遵循以上流程可以避免所有常见坑点！
