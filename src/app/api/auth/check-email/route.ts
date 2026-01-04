import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// 查询参数验证 schema
const checkEmailSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入数据
    const validatedData = checkEmailSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.data.email))
      .limit(1)

    return NextResponse.json(
      {
        exists: !!existingUser,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("检查邮箱错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
