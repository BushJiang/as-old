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

// 测试账号（用于数据库不可用时的开发测试）
const TEST_USERS = [
  {
    id: 'c6b5bf02-e393-441c-a0bc-28c89759ac8d',
    email: 'test@example.com',
    password: '123456',
  },
  {
    id: '9d30c7ce-8030-410b-a785-8f04ed6e7b9c',
    email: 'user@example.com',
    password: 'password',
  },
]

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

    // 检查是否是测试账号
    const testUser = TEST_USERS.find(u => u.email === email && u.password === password)
    if (testUser) {
      console.log('使用测试账号登录:', email)
      const response = NextResponse.json({
        user: {
          id: testUser.id,
          email: testUser.email,
        }
      })
      response.cookies.set('user_id', testUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 天
      })
      return response
    }

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
