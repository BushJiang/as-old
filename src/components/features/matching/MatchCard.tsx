'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThumbsUp, ThumbsDown, MapPin } from 'lucide-react'
import type { User } from '@/lib/types'
import { useAppStore } from '@/stores/app-store'

interface MatchCardProps {
  user: User
  onLike: (userId: string) => void
  onPass: (userId: string) => void
}

export function MatchCard({ user, onLike, onPass }: MatchCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
      <div className="relative">
        <Avatar className="w-full h-96 rounded-t-lg">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="text-4xl">{user.name[0]}</AvatarFallback>
        </Avatar>
        {useAppStore.getState().useMockMode && (
          <Badge variant="secondary" className="absolute top-4 left-4">
            演示模式
          </Badge>
        )}
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{user.name}, {user.age}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {user.city}
            </CardDescription>
          </div>
        </div>
        <CardDescription className="line-clamp-2 text-base">
          {user.bio}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {user.interests.slice(0, 3).map((interest) => (
            <Badge key={interest} variant="secondary" className="text-sm">
              {interest}
            </Badge>
          ))}
          {user.interests.length > 3 && (
            <Badge variant="outline" className="text-sm">
              +{user.interests.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button
          variant="default"
          size="lg"
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          onClick={() => onLike(user.id)}
        >
          <ThumbsUp className="mr-2 h-5 w-5" />
          想认识
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1 hover:bg-gray-100"
          onClick={() => onPass(user.id)}
        >
          <ThumbsDown className="mr-2 h-5 w-5" />
          跳过
        </Button>
      </CardFooter>
    </Card>
  )
}
