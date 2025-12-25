'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, Users, Gift, Brain, LogOut, UserCog } from 'lucide-react'

const USER_NAME = '测试账号111'

const FEATURES = [
  { icon: Heart, title: '兴趣相投', desc: '寻找兴趣爱好相似的朋友', type: 'similar_interests', color: 'bg-pink-500' },
  { icon: Users, title: '需求匹配', desc: '找到能提供你需要帮助的人', type: 'mutual_needs', color: 'bg-blue-500' },
  { icon: Gift, title: '互助合作', desc: '发现你可以帮助的人', type: 'mutual_provide', color: 'bg-green-500' },
  { icon: Brain, title: '深度分析', desc: '探索潜在的朋友可能性', type: 'deep_analysis', color: 'bg-purple-500' },
]

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, logout } = useAuthStore()
  const { currentUser } = useUserStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isMounted, isAuthenticated, router])

  if (!isMounted || !isAuthenticated) {
    return <div className="min-h-screen grid place-items-center text-gray-500">加载中...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* L1-L3: Header - Viewport/Layout/Content */}
      <div className="max-w-5xl mx-auto w-full">
        <header className="flex items-center justify-between px-6 h-16 border-b sticky top-0 bg-white">
          <div></div>
          <h1 className="text-2xl font-bold">如故</h1>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="bg-blue-600 text-white text-xs">{USER_NAME[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-700 hidden sm:block">{USER_NAME}</span>
            <Button variant="outline" size="sm" onClick={() => router.push('/profile')} className="h-8 px-3">
              <UserCog className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">修改资料</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { logout(); router.push('/auth/login') }} title="退出登录">
              <LogOut className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </header>
      </div>

      {/* L1-L3: Main - Viewport/Layout/Content */}
      <div className="max-w-5xl mx-auto flex-1 flex flex-col items-center p-6 pt-40 w-full">
        <div className="w-full flex flex-col items-center">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">欢迎，{USER_NAME}！</h2>
            <p className="text-lg text-gray-500">找到真正一见如故的朋友</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl mt-8">
            {FEATURES.map((item) => (
              <Card
                key={item.type}
                onClick={() => router.push(`/matches/${item.type}`)}
                className="flex items-center p-6 gap-5 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all group border-gray-100"
              >
                <div className={`${item.color} shrink-0 w-12 h-12 flex items-center justify-center rounded-xl text-white shadow-sm group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* L1-L3: Footer - Viewport/Layout/Content */}
      <div className="max-w-5xl mx-auto w-full">
        <footer className="text-center py-6 text-xs text-gray-300">
          © 2025 Rugulab
        </footer>
      </div>
    </div>
  )
}
