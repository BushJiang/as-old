'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function OnboardingPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  // 引导页暂时跳转到首页
  router.push('/')

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">加载中...</p>
    </main>
  )
}
