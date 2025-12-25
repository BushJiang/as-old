'use client'

import { useEffect, useState } from 'react'
import { MatchCard } from './MatchCard'
import { useUserStore } from '@/stores/user-store'
import { useFilterStore } from '@/stores/filter-store'
import { MOCK_USERS } from '@/data/mock/users'
import { generateRecommendations, applyFilters } from '@/lib/recommendation-engine'

export function MatchDiscovery() {
  const { currentUser, potentialMatches, addPotentialMatch, likeUser, passUser } = useUserStore()
  const { filters } = useFilterStore()
  const [currentIndex, setCurrentIndex] = useState(0)

  // 初始化潜在匹配
  useEffect(() => {
    if (potentialMatches.length === 0 && currentUser) {
      const filteredUsers = MOCK_USERS.filter(user => applyFilters(user, filters))
      const recommendations = generateRecommendations(currentUser, filteredUsers, 10)
      recommendations.forEach(user => addPotentialMatch(user))
    }
  }, [currentUser, filters])

  const handleLike = (userId: string) => {
    likeUser(userId)
    setCurrentIndex(prev => prev + 1)
  }

  const handlePass = (userId: string) => {
    passUser(userId)
    setCurrentIndex(prev => prev + 1)
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">👋</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">欢迎来到如故</h2>
        <p className="text-gray-600 mb-6">
          请先完善您的个人资料，以便获得更精准的匹配推荐
        </p>
        <a
          href="/profile"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          完善资料
        </a>
      </div>
    )
  }

  if (potentialMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">😔</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">没有更多推荐了</h2>
        <p className="text-gray-600 mb-6">
          尝试放宽筛选条件，发现更多可能性
        </p>
        <a
          href="/settings"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          调整筛选
        </a>
      </div>
    )
  }

  const currentUserMatch = potentialMatches[currentIndex]

  if (!currentUserMatch) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">今天就到这里吧</h2>
        <p className="text-gray-600 mb-6">
          您已经查看了所有推荐用户
        </p>
        <a
          href="/matches"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          查看匹配
        </a>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 pb-24">
      <MatchCard
        user={currentUserMatch}
        onLike={handleLike}
        onPass={handlePass}
      />
    </div>
  )
}
