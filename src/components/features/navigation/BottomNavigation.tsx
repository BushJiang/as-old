'use client'

import { Heart, User, MessageCircle, Settings } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

export function BottomNavigation() {
  const { currentPage, setCurrentPage } = useAppStore()

  const navItems = [
    { id: 'discover', label: '发现', icon: Heart, href: '/' },
    { id: 'profile', label: '资料', icon: User, href: '/profile' },
    { id: 'matches', label: '匹配', icon: MessageCircle, href: '/matches' },
    { id: 'settings', label: '设置', icon: Settings, href: '/settings' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as any)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className={cn('h-6 w-6', isActive && 'text-blue-600')} />
              <span className={cn('text-xs mt-1', isActive && 'text-blue-600 font-medium')}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
