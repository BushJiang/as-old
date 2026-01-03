'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import type { User } from '@/lib/types'

interface UserInfoPanelProps {
  user: User
  children?: React.ReactNode // 底部按钮区域（可选）
}

export function UserInfoPanel({ user, children }: UserInfoPanelProps) {
  const [imageError, setImageError] = useState(false)
  const avatarSrc = user.avatar || '/avatars/default.svg'

  return (
    <div className="flex flex-col bg-white h-full">
      {/* 顶部背景区域 */}
      <div className="relative h-24 bg-gradient-to-r from-sky-100 via-blue-100 to-indigo-50 shrink-0">
        {/* 头像容器：绝对定位，压在底边线上 */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 group-hover:scale-110 transition-transform duration-300 z-10">
          {!imageError ? (
            <div className="relative w-20 h-20 rounded-full border-4 border-white shadow-sm overflow-hidden bg-white">
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
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm bg-blue-100 flex items-center justify-center text-3xl text-blue-600 font-bold">
              {user.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* 用户信息区域 */}
      <div className="flex-1 p-6 pt-10">
        {/* 基本信息 */}
        <div className="mb-6 text-center mt-2">
          <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
          <div className="flex items-center justify-center text-sm text-gray-500 mt-1">
            <MapPin className="w-3 h-3 mr-1" />
            {user.city}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-8 text-center leading-relaxed px-4 line-clamp-2">
          {user.bio}
        </p>

        {/* 标签组 */}
        <div className="space-y-5 px-2">
          {/* 兴趣爱好 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2.5">
              兴趣爱好
            </p>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2.5 py-1 font-normal border-gray-300 text-gray-600"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* 需求 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2.5">需求</p>
            <div className="flex flex-wrap gap-2">
              {user.needs.map((need, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2.5 py-1 font-normal border-gray-300 text-gray-600"
                >
                  {need}
                </Badge>
              ))}
            </div>
          </div>

          {/* 提供 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2.5">提供</p>
            <div className="flex flex-wrap gap-2">
              {user.provide.map((provide, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2.5 py-1 font-normal border-gray-300 text-gray-600"
                >
                  {provide}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 底部按钮区域（可选） */}
      {children && (
        <div className="p-4 border-t border-gray-100 shrink-0 bg-white mt-auto">
          {children}
        </div>
      )}
    </div>
  )
}
