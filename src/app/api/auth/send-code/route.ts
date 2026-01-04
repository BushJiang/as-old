import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { emailVerificationCodes, users } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { Resend } from "resend"
import { VerificationCodeEmail } from "@/components/email/VerificationCodeEmail"

// 配置验证码参数
const CODE_EXPIRY_MINUTES = 5 // 验证码有效期（分钟）
const RETRY_INTERVAL_SECONDS = process.env.NODE_ENV === "development" ? 30 : 60 // 开发环境30秒，生产环境60秒
const RETRY_INTERVAL_MINUTES = RETRY_INTERVAL_SECONDS / 60

// 验证请求参数
const sendCodeSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
})

// 生成6位数字验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 发送验证码邮件（使用 Resend + React 模板）
async function sendVerificationEmail(email: string, code: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "如故 <noreply@rugumatch.com>",
    to: email,
    subject: "如故登录验证码",
    react: VerificationCodeEmail({ code }),
  })

  if (error) {
    console.error("Resend 发送失败:", error)

    // 开发环境：在控制台显示验证码（降级方案）
    if (process.env.NODE_ENV === "development") {
      console.log("\n========== 邮箱验证码（开发模式）==========")
      console.log(`邮箱: ${email}`)
      console.log(`验证码: ${code}`)
      console.log(`有效期: ${CODE_EXPIRY_MINUTES} 分钟`)
      console.log(`发送间隔: ${RETRY_INTERVAL_SECONDS} 秒`)
      console.log("================================\n")
      return true
    }

    return false
  }

  console.log("邮件发送成功:", data)

  // 同时在控制台也显示（方便调试）
  console.log("\n========== 邮箱验证码 ==========")
  console.log(`邮箱: ${email}`)
  console.log(`验证码: ${code}`)
  console.log(`有效期: ${CODE_EXPIRY_MINUTES} 分钟`)
  console.log("================================\n")

  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入
    const validatedData = sendCodeSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      )
    }

    const { email } = validatedData.data

    // 检查是否在重试间隔时间内
    const retryIntervalAgo = new Date(Date.now() - RETRY_INTERVAL_SECONDS * 1000)

    const [existingCode] = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          gt(emailVerificationCodes.createdAt, retryIntervalAgo)
        )
      )
      .orderBy(emailVerificationCodes.createdAt)
      .limit(1)

    if (existingCode) {
      // 如果在重试间隔内，不重复发送
      const remainingSeconds = Math.ceil(
        RETRY_INTERVAL_SECONDS - (Date.now() - new Date(existingCode.createdAt).getTime()) / 1000
      )

      return NextResponse.json(
        {
          error: `请等待 ${Math.ceil(remainingSeconds)} 秒后再试`,
          retryAfter: remainingSeconds,
        },
        { status: 429 }
      )
    }

    // 生成新验证码
    const code = generateCode()
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)

    // 保存到数据库
    await db.insert(emailVerificationCodes).values({
      email,
      code,
      expiresAt,
    })

    // 发送邮件
    const emailSent = await sendVerificationEmail(email, code)

    if (!emailSent) {
      return NextResponse.json(
        { error: "发送验证码失败，请稍后重试" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送到您的邮箱",
    })
  } catch (error) {
    console.error("发送验证码错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
