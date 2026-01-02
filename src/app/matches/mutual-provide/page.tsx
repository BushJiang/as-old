'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { UserCard } from '@/components/features/user/UserCard'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type MatchType = 'mutual-provide'

export default function MutualProvidePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { currentUser, potentialMatches, addToWantToKnow } = useUserStore()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    } else {
      setLoading(false)
      loadMatches()
    }
  }, [isAuthenticated, router])

  const loadMatches = () => {
    // 从 potentialMatches 中随机选取4个用户
    const shuffled = [...potentialMatches].sort(() => Math.random() - 0.5)
    setUsers(shuffled.slice(0, 4))
  }

  const handleWantToKnow = (userId: string) => {
    if (addToWantToKnow) {
      addToWantToKnow(userId)
    }
    // 从列表中移除该用户
    setUsers(users.filter(u => u.id !== userId))
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      {/* 页面标题 */}
      <div className="w-full max-w-4xl mb-8">
        <h1 className="text-2xl font-bold text-gray-900">互助合作</h1>
        <p className="text-sm text-gray-600 mt-1">发现你可以帮助的人</p>
      </div>

      {/* 主要内容 */}
      <main className="w-full max-w-4xl flex flex-col items-center flex-1">
        {users.length > 0 ? (
          <>
            {/* 用户卡片网格 2x2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onRemove={() => handleWantToKnow(user.id)}
                />
              ))}
            </div>

            {/* 刷新按钮 */}
            <div className="text-center mt-8 w-full">
              <Button
                variant="outline"
                onClick={loadMatches}
                className="mx-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新匹配
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600">暂无匹配结果</p>
            <Button
              variant="outline"
              onClick={loadMatches}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新匹配
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
