import { NextResponse } from "next/server"

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })

    // 清除 session cookie
    response.cookies.delete('user_id')

    return response
  } catch (error) {
    console.error("登出错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
