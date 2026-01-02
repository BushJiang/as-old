'use client'

import { useUserStore } from '@/stores/user-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { currentUser } = useUserStore()
  const router = useRouter()

  if (!currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">加载中...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="p-6 space-y-6 max-w-2xl w-full">
        {/* 个人信息 */}
        <div className="space-y-6">
          {/* 个人信息卡片 */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">我的信息</h2>
                <button
                  onClick={() => router.push('/profile/edit')}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  编辑资料
                </button>
              </div>

              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback className="text-2xl">{currentUser.name[0]}</AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-bold">{currentUser.name}</h3>
                <p className="flex items-center gap-1 text-gray-600 mt-1">
                  <MapPin className="h-4 w-4" />
                  {currentUser.city}
                </p>
              </div>

              <p className="text-gray-700 text-center mb-6">{currentUser.bio}</p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">兴趣爱好</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.interests.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900">需求</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.needs.map((need) => (
                        <Badge key={need} className="bg-blue-50 text-blue-700">
                          {need}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900">提供</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.provide.map((provide) => (
                        <Badge key={provide} className="bg-green-50 text-green-700">
                          {provide}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
