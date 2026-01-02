'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { Card } from '@/components/ui/card'
import { Heart, Users, Gift, Brain } from 'lucide-react'
import { FlipUserCard } from '@/components/features/user/FlipUserCard'
import type { User } from '@/lib/types'

type MatchType = 'similar-interests' | 'mutual-needs' | 'mutual-provide' | 'deep-analysis'

const FEATURES = [
  {
    icon: Heart,
    title: '兴趣相投',
    desc: '寻找兴趣爱好相似的朋友',
    type: 'similar-interests' as MatchType,
    color: 'bg-pink-500',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Users,
    title: '需求匹配',
    desc: '找到能提供你需要帮助的人',
    type: 'mutual-needs' as MatchType,
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Gift,
    title: '互助合作',
    desc: '发现你可以帮助的人',
    type: 'mutual-provide' as MatchType,
    color: 'bg-green-500',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Brain,
    title: '探索发现',
    desc: '探索潜在的朋友可能性',
    type: 'deep-analysis' as MatchType,
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-violet-500',
  },
]

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { currentUser, potentialMatches, addToWantToKnow } = useUserStore()
  const [isMounted, setIsMounted] = useState(false)
  const [selectedMatchType, setSelectedMatchType] = useState<MatchType>('similar-interests')
  const [matchedUser, setMatchedUser] = useState<User | null>(null)
  const [selectedFeature, setSelectedFeature] = useState(0)
  const [userIndex, setUserIndex] = useState(0)
  const [cardKey, setCardKey] = useState(0) // 用于重置翻转状态
  const [isCurrentCardWantToKnow, setIsCurrentCardWantToKnow] = useState(false) // 当前卡片是否点击了"想认识"

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isMounted, isAuthenticated, router])

  // 根据选中的匹配类型获取匹配用户
  useEffect(() => {
    if (isAuthenticated && currentUser && potentialMatches.length > 0) {
      // 这里使用索引来获取不同匹配方式的用户
      // 实际项目中应该从后端获取真正的匹配结果
      const indexMap: Record<MatchType, number> = {
        'similar-interests': 0,
        'mutual-needs': 1,
        'mutual-provide': 2,
        'deep-analysis': 3,
      }
      const baseIndex = indexMap[selectedMatchType]
      const actualIndex = (baseIndex + userIndex) % potentialMatches.length
      const user = potentialMatches[actualIndex] || potentialMatches[0]
      setMatchedUser(user || null)
    }
  }, [selectedMatchType, userIndex, isAuthenticated, currentUser, potentialMatches])

  const handleFeatureClick = (index: number, type: MatchType) => {
    setSelectedFeature(index)
    setSelectedMatchType(type)
    setUserIndex(0) // 重置用户索引
    setCardKey(prev => prev + 1) // 重置翻转状态
    setIsCurrentCardWantToKnow(false) // 重置"想认识"状态
  }

  const handleWantToKnow = (userId: string) => {
    if (addToWantToKnow) {
      addToWantToKnow(userId)
    }
    setIsCurrentCardWantToKnow(true) // 标记当前卡片已点击"想认识"
  }

  const handleNext = () => {
    setUserIndex(prev => prev + 1)
    setCardKey(prev => prev + 1) // 重置翻转状态
    setIsCurrentCardWantToKnow(false) // 重置"想认识"状态
  }

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="mx-auto flex-1 flex flex-col w-full max-w-4xl px-4 py-8">
        {/* 行动邀请区 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 text-center">
          <p className="text-xl font-semibold text-gray-900">
            你好，{currentUser?.name}！
          </p>
          <p className="text-gray-700 mt-2">
            选择匹配方式，发现适合你的朋友
          </p>
        </div>

        {/* 功能入口 - 2x2布局 */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((item, index) => (
              <Card
                key={item.type}
                onClick={() => handleFeatureClick(index, item.type)}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group ${
                  selectedFeature === index ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-3 p-4">
                  <div
                    className={`${item.color} shrink-0 w-12 h-12 flex items-center justify-center rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform ${item.gradient}`}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 用户卡片区域 */}
        <div className="flex-1 flex items-center justify-center">
          {matchedUser ? (
            <FlipUserCard
              key={cardKey}
              user={matchedUser}
              matchType={selectedMatchType}
              currentUser={currentUser}
              onWantToKnow={handleWantToKnow}
              onNext={handleNext}
              isWantToKnow={isCurrentCardWantToKnow}
            />
          ) : (
            <div className="text-center text-gray-500">
              <p>暂无匹配用户</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full px-6">
        <footer className="text-center py-6 text-xs text-gray-500 border-t">
          © 2025 如故
        </footer>
      </div>
    </div>
  )
}
