'use client'

import { useUserStore } from '@/stores/user-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Heart, MessageCircle } from 'lucide-react'
import { BottomNavigation } from '@/components/features'
import { useState } from 'react'

export default function MatchesPage() {
  const { likedMatches, passedMatches } = useUserStore()
  const [activeTab, setActiveTab] = useState<'liked' | 'passed'>('liked')

  return (
    <main className="min-h-screen flex flex-col pb-20">
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">我的匹配</h1>

        <div className="flex gap-4 border-b">
          <button
            className={`pb-2 px-1 font-medium ${
              activeTab === 'liked'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('liked')}
          >
            喜欢 ({likedMatches.length})
          </button>
          <button
            className={`pb-2 px-1 font-medium ${
              activeTab === 'passed'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('passed')}
          >
            已跳过 ({passedMatches.length})
          </button>
        </div>

        {activeTab === 'liked' && (
          <div className="space-y-4">
            {likedMatches.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">还没有喜欢的用户</p>
                <p className="text-sm text-gray-500 mt-2">
                  去发现页面开始浏览吧
                </p>
              </div>
            ) : (
              likedMatches.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          {user.name}, {user.age}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {user.city}
                        </CardDescription>
                      </div>
                      <MessageCircle className="h-6 w-6 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">{user.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'passed' && (
          <div className="space-y-4">
            {passedMatches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">还没有跳过任何用户</p>
              </div>
            ) : (
              passedMatches.map((user) => (
                <Card key={user.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          {user.name}, {user.age}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {user.city}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">{user.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      <BottomNavigation />
    </main>
  )
}
