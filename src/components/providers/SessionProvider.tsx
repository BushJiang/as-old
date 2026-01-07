'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Session 状态同步组件
 *
 * 功能：
 * 1. 应用启动时验证服务器端 session
 * 2. 同步 localStorage 状态与服务器状态
 * 3. 处理 session 过期情况
 *
 * 避免踩坑：
 * - 确保客户端状态与服务器状态一致
 * - 避免登录后刷新页面又被踢回登录页
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, initializeSession } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // 应用启动时验证 session
    const verifySession = async () => {
      await initializeSession()
      setIsInitialized(true)
    }

    verifySession()
  }, [initializeSession])

  // Session 验证完成前显示加载状态
  if (!isInitialized) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return <>{children}</>
}
