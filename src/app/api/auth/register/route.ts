import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// 注册数据验证 schema
const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 个字符"),
  name: z.string().min(1, "姓名不能为空").max(50, "姓名最多 50 个字符").optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入数据
    const validatedData = registerSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "输入数据无效", details: validatedData.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password, name } = validatedData.data

    // 检查邮箱是否已存在
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: "邮箱已被注册" },
        { status: 409 }
      )
    }

    // 加密密码（bcrypt，salt rounds: 10）
    const hashedPassword = await hash(password, 10)

    // 创建用户
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
      })
      .returning()

    // 返回用户信息（不包含密码）
    return NextResponse.json(
      {
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          }
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("注册错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
