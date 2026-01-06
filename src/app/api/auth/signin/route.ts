import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

// 登录数据验证 schema
const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 个字符"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入数据
    const validatedData = loginSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "输入数据无效" },
        { status: 400 }
      )
    }

    const { email, password } = validatedData.data

    // 查找用户
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    // 验证密码
    if (!user.password) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    // 将用户信息存入 session
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })

    // 使用 cookie 存储 session
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 天
    })

    return response
  } catch (error) {
    console.error("登录错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
