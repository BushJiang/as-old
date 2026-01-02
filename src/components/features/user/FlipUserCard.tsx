'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import type { User } from '@/lib/types'

type MatchType = 'similar-interests' | 'mutual-needs' | 'mutual-provide' | 'deep-analysis'

interface FlipUserCardProps {
  user: User
  matchType: MatchType
  currentUser?: User
  onWantToKnow?: (userId: string) => void
  onNext?: () => void
  isWantToKnow?: boolean // 是否已点击想认识
}

// 根据性别获取代词
function getPronoun(gender?: User['gender']): string {
  if (gender === 'male') return '他'
  if (gender === 'female') return '她'
  return 'Ta'
}

// 根据匹配类型生成正面文案
function getFrontText(matchType: MatchType, user: User, currentUser?: User): string {
  const pronoun = getPronoun(user.gender)

  switch (matchType) {
    case 'similar-interests': {
      const commonInterests = user.interests.filter(i =>
        currentUser?.interests.includes(i)
      )
      if (commonInterests.length > 0) {
        return `${user.name}也喜欢${commonInterests[0]}等，你想认识${pronoun}吗？`
      }
      return `${user.name}和你兴趣相投，你想认识${pronoun}吗？`
    }
    case 'mutual-needs': {
      const canProvide = user.provide.filter(p =>
        currentUser?.needs.includes(p)
      )
      if (canProvide.length > 0) {
        return `${user.name}能提供${canProvide[0]}等，你想认识${pronoun}吗？`
      }
      return `${user.name}可以满足你的需求，你想认识${pronoun}吗？`
    }
    case 'mutual-provide': {
      const needFromYou = user.needs.filter(n =>
        currentUser?.provide.includes(n)
      )
      if (needFromYou.length > 0) {
        return `${user.name}需要${needFromYou[0]}等，你想认识${pronoun}吗？`
      }
      return `${user.name}需要你的帮助，你想认识${pronoun}吗？`
    }
    case 'deep-analysis':
      return `${user.name}和你很匹配，你想认识${pronoun}吗？`
  }
}

export function FlipUserCard({
  user,
  matchType,
  currentUser,
  onWantToKnow,
  onNext,
  isWantToKnow = false
}: FlipUserCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [imageError, setImageError] = useState(false)

  const avatarSrc = user.avatar || '/avatars/default.svg'

  const handleWantToKnow = () => {
    if (onWantToKnow) {
      onWantToKnow(user.id)
    }
  }

  const handleNext = () => {
    setIsFlipped(false)
    if (onNext) {
      onNext()
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const frontText = getFrontText(matchType, user, currentUser)

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="relative w-full h-[600px]"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* 正面 */}
          <Card
            className="absolute inset-0 w-full h-full hover:shadow-lg transition-shadow"
            style={{
              backfaceVisibility: 'hidden'
            }}
          >
            <div className="h-full flex flex-col items-center justify-between p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-28 h-28 rounded-full overflow-hidden mb-6 border-4 border-white shadow-lg">
                  {!imageError ? (
                    <Image
                      src={avatarSrc}
                      alt={user.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                      <span className="text-4xl text-blue-600">{user.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-6 px-2">{frontText}</h3>
              </div>

              <div className="w-full px-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleFlip}
                >
                  了解一下
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleNext}
                >
                  下一位
                </Button>
              </div>
            </div>
          </Card>

          {/* 反面 */}
          <Card
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="h-full flex flex-col bg-white">
              {/* 用户头像区域 */}
              <div className="relative h-40 bg-white flex items-center justify-center border-b">
                {!imageError ? (
                  <div className="relative w-20 h-20 rounded-full border-4 border-gray-100 overflow-hidden">
                    <Image
                      src={avatarSrc}
                      alt={user.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-gray-100 bg-blue-50 flex items-center justify-center">
                    <span className="text-3xl text-blue-600">{user.name.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* 用户信息区域 */}
              <div className="flex-1 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold">{user.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {user.city}
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{user.bio}</p>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">兴趣爱好</p>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.slice(0, 4).map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">需求</p>
                    <div className="flex flex-wrap gap-2">
                      {user.needs.slice(0, 4).map((need, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {need}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">提供</p>
                    <div className="flex flex-wrap gap-2">
                      {user.provide.slice(0, 4).map((provide, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {provide}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 按钮区域 */}
              <div className="p-5 border-t flex gap-3">
                <Button
                  className={`flex-1 text-sm ${
                    isWantToKnow
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleWantToKnow()
                  }}
                >
                  想认识
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                >
                  下一位
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
