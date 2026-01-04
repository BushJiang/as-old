import { NextRequest } from "next/server"

/**
 * 从 request 中获取用户 ID
 * 支持两种方式：
 * 1. next-auth.session-token（新的登录系统）
 * 2. user_id（旧的登录系统，向后兼容）
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  // 优先尝试读取 next-auth.session-token
  const sessionToken = request.cookies.get('next-auth.session-token')?.value

  if (sessionToken) {
    try {
      // 解析 base64 编码的 token
      const decoded = Buffer.from(sessionToken, 'base64').toString()
      const session = JSON.parse(decoded)

      // 检查是否过期
      if (session.exp && session.exp > Math.floor(Date.now() / 1000)) {
        return session.userId
      }
    } catch (error) {
      console.error('解析 session token 失败:', error)
    }
  }

  // 降级方案：尝试读取 user_id（兼容旧的登录方式）
  return request.cookies.get('user_id')?.value || null
}
