'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, X } from 'lucide-react'
import type { User } from '@/lib/types'

interface UserCardProps {
  user: User
  onRemove?: () => void
  readonly?: boolean // 是否只读模式（不显示操作按钮）
}

export function UserCard({ user, onRemove, readonly = false }: UserCardProps) {
  const [imageError, setImageError] = useState(false)

  const avatarSrc = user.avatar || '/avatars/default.svg'

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow relative">
      {/* 移除按钮 */}
      {!readonly && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          title="移除"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      )}

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
      </div>
    </Card>
  )
}
