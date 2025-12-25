'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { searchUsers } from '@/lib/milvus'
import type { User, MatchType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Heart, RefreshCw } from 'lucide-react'

export default function MatchPage() {
  const router = useRouter()
  const params = useParams()
  const type = params.type as MatchType

  const { isAuthenticated, user } = useAuthStore()
  const { currentUser } = useUserStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (!user?.hasCompletedProfile) {
      router.push('/onboarding')
      return
    }

    loadMatches()
  }, [isAuthenticated, user, type, router])

  const loadMatches = async () => {
    if (!currentUser) return

    setLoading(true)
    setError('')

    try {
      const result = await searchUsers({
        type,
        userId: currentUser.id,
        limit: 4,
      })

      setUsers(result.users)
    } catch (err) {
      setError('加载匹配失败，请重试')
      console.error('Match search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getMatchTitle = (type: MatchType) => {
    switch (type) {
      case 'similar_interests':
        return '兴趣相投'
      case 'mutual_needs':
        return '需求匹配'
      case 'mutual_provide':
        return '互助合作'
      case 'deep_analysis':
        return '深度分析'
      default:
        return '匹配结果'
    }
  }

  const getMatchDescription = (type: MatchType) => {
    switch (type) {
      case 'similar_interests':
        return '找到与你兴趣爱好相似的朋友'
      case 'mutual_needs':
        return '发现能满足你需求的人'
      case 'mutual_provide':
        return '找到你可以帮助的人'
      case 'deep_analysis':
        return '探索潜在的朋友可能性'
      default:
        return ''
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {getMatchTitle(type)}
              </h1>
              <p className="text-sm text-gray-600">
                {getMatchDescription(type)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">正在寻找匹配...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadMatches} className="bg-blue-600 hover:bg-blue-700">
              重试
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">暂无匹配结果</p>
            <Button
              variant="outline"
              onClick={loadMatches}
              className="mt-4"
            >
              重新搜索
            </Button>
          </div>
        ) : (
          <>
            {/* 用户卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {users.map((matchedUser) => (
                <Card key={matchedUser.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* 用户头像 */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={matchedUser.avatar} alt={matchedUser.name} />
                      <AvatarFallback className="w-full h-full rounded-none text-6xl text-white">
                        {matchedUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {matchedUser.isOnline && (
                      <div className="absolute top-3 right-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* 基本信息 */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {matchedUser.name}, {matchedUser.age}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        {matchedUser.city}
                      </div>
                    </div>

                    {/* 个人简介 */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {matchedUser.bio}
                    </p>

                    {/* 兴趣爱好 */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">兴趣爱好</p>
                      <div className="flex flex-wrap gap-1">
                        {matchedUser.interests.slice(0, 3).map((interest) => (
                          <Badge key={interest} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {matchedUser.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{matchedUser.interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 需求 */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">需要</p>
                      <div className="flex flex-wrap gap-1">
                        {matchedUser.needs.slice(0, 2).map((need) => (
                          <Badge key={need} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            {need}
                          </Badge>
                        ))}
                        {matchedUser.needs.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{matchedUser.needs.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 提供 */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">提供</p>
                      <div className="flex flex-wrap gap-1">
                        {matchedUser.provide.slice(0, 2).map((provide) => (
                          <Badge key={provide} variant="outline" className="text-xs bg-green-50 text-green-700">
                            {provide}
                          </Badge>
                        ))}
                        {matchedUser.provide.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{matchedUser.provide.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // TODO: 实现跳过功能
                          console.log('Skip user:', matchedUser.id)
                        }}
                      >
                        跳过
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          // TODO: 实现喜欢功能
                          console.log('Like user:', matchedUser.id)
                        }}
                      >
                        喜欢
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 刷新按钮 */}
            <div className="text-center mt-8">
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
        )}
      </main>
    </div>
  )
}
