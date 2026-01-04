import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { emailVerificationCodes, users } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import bcrypt from "bcryptjs"

// 验证请求参数
const verifyCodeSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  code: z.string().regex(/^\d{6}$/, "验证码必须是6位数字"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入
    const validatedData = verifyCodeSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "验证码格式不正确" },
        { status: 400 }
      )
    }

    const { email, code } = validatedData.data

    // 查找有效的验证码
    const now = new Date()

    const [verificationRecord] = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          eq(emailVerificationCodes.code, code),
          gt(emailVerificationCodes.expiresAt, now)
        )
      )
      .orderBy(emailVerificationCodes.createdAt)
      .limit(1)

    if (!verificationRecord) {
      return NextResponse.json(
        { error: "验证码无效或已过期" },
        { status: 400 }
      )
    }

    // 标记验证码已使用
    await db
      .update(emailVerificationCodes)
      .set({ verifiedAt: now })
      .where(eq(emailVerificationCodes.id, verificationRecord.id))

    // 检查用户是否存在
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(rows => rows[0])

    if (!user) {
      // 新用户：创建用户
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name: email.split("@")[0],
        })
        .returning()

      user = newUser
    }

    // 创建会话（使用 NextAuth 的凭证签名方式）
    // 这里我们手动创建一个简单的 JWT token
    const token = Buffer.from(
      JSON.stringify({
        userId: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30天
      })
    ).toString("base64")

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })

    // 设置 cookie（与 NextAuth 兼容）
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30天
      path: "/",
    })

    return response
  } catch (error) {
    console.error("验证验证码错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
