'use client'

import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'
import type { User } from '@/lib/types'
import { UserInfoPanel } from '@/components/user/UserInfoPanel'

interface UserCardProps {
  user: User
  onRemove?: () => void
  readonly?: boolean // 是否只读模式（不显示操作按钮）
}

export function UserCard({ user, onRemove, readonly = false }: UserCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 relative group">
      {/* 移除按钮 */}
      {!readonly && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm backdrop-blur-sm transition-all"
          title="移除"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      )}

      <UserInfoPanel user={user} />
    </Card>
  )
}
