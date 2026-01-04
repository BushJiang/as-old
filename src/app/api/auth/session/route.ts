import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromRequest } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    // 从 cookie 获取用户 ID
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      )
    }

    // 查询用户信息
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })
  } catch (error) {
    console.error("获取会话错误:", error)
    return NextResponse.json(
      { user: null },
      { status: 200 }
    )
  }
}
