'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/user-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { currentUser, updateProfile } = useUserStore()
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    city: currentUser?.city || '',
    bio: currentUser?.bio || '',
    interestsText: currentUser?.interests?.join('\n') || '',
    needsText: currentUser?.needs?.join('\n') || '',
    provideText: currentUser?.provide?.join('\n') || '',
  })
  const [loading, setLoading] = useState(false)

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">正在加载资料...</p>
      </div>
    )
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // 处理兴趣爱好、需求、提供的文本转换
      const interests = formData.interestsText.split('\n').filter(i => i.trim())
      const needs = formData.needsText.split('\n').filter(n => n.trim())
      const provide = formData.provideText.split('\n').filter(p => p.trim())

      const updatedUser = {
        ...currentUser,
        name: formData.name,
        city: formData.city,
        bio: formData.bio,
        interests: interests,
        needs: needs,
        provide: provide,
      }

      updateProfile(updatedUser)
      router.push('/')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">个人资料</h1>
          <p className="text-xl text-gray-600">让我们更好地了解你</p>
        </div>

        <div className="bg-white rounded-2xl p-8 space-y-6">
          {/* 头像和基本信息 */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback className="text-2xl">{currentUser.name[0]}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentUser.name}
              </h2>
              <p className="flex items-center justify-center gap-1 text-gray-600 mt-1">
                <MapPin className="h-4 w-4" />
                {currentUser.city}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xl font-medium text-gray-900 block mb-3">姓名</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              placeholder="你的姓名"
            />
          </div>

          <div>
            <label className="text-xl font-medium text-gray-900 block mb-3">城市</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              placeholder="例如：北京"
            />
          </div>

          <div>
            <label className="text-xl font-medium text-gray-900 block mb-3">个人简介</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 h-32"
              placeholder="一句话介绍自己"
            />
          </div>

          <div>
            <label className="text-xl font-medium text-gray-900 block mb-3">兴趣爱好</label>
            <textarea
              value={formData.interestsText}
              onChange={(e) => setFormData(prev => ({ ...prev, interestsText: e.target.value }))}
              className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 h-32"
              placeholder="每行输入一个兴趣爱好，例如：&#10;读书&#10;音乐&#10;电影&#10;咖啡"
            />
            <p className="text-base text-gray-500 mt-2">每行一个兴趣爱好</p>
          </div>

          <div>
            <label className="text-xl font-medium text-gray-900 block mb-3">需求</label>
            <textarea
              value={formData.needsText}
              onChange={(e) => setFormData(prev => ({ ...prev, needsText: e.target.value }))}
              className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 h-32"
              placeholder="每行输入一个需求，例如：&#10;深度对话&#10;精神交流&#10;理解与陪伴"
            />
            <p className="text-base text-gray-500 mt-2">每行一个需求（可选）</p>
          </div>

          <div>
            <label className="text-xl font-medium text-gray-900 block mb-3">提供</label>
            <textarea
              value={formData.provideText}
              onChange={(e) => setFormData(prev => ({ ...prev, provideText: e.target.value }))}
              className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 h-32"
              placeholder="每行输入一个你提供的内容，例如：&#10;文学分享&#10;心理咨询&#10;咖啡文化"
            />
            <p className="text-base text-gray-500 mt-2">每行一个提供的内容（可选）</p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1 h-12 text-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 h-12 text-xl bg-blue-700 text-white rounded-xl"
            >
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
