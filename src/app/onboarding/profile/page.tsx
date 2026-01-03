'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ProfileFormFields, type ProfileFormData } from '@/components/user/ProfileFormFields'

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, completeProfile } = useAuthStore()
  const { updateProfile } = useUserStore()

  const [formData, setFormData] = useState<ProfileFormData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData) {
      setError('表单数据未加载')
      return
    }

    setLoading(true)

    try {
      // 调用后端 API 保存用户信息
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          profile: {
            name: formData.name,
            age: parseInt(formData.age),
            city: formData.city,
            bio: formData.bio,
            interests: formData.interestsText.split('\n').map(n => n.trim()).filter(n => n),
            needs: formData.needsText.split('\n').map(n => n.trim()).filter(n => n),
            provide: formData.provideText.split('\n').map(p => p.trim()).filter(p => p),
            avatar: formData.avatarUrl,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        // 更新本地状态
        completeProfile()
        updateProfile(data.profile)
        router.push('/')
      } else {
        setError(data.error || '保存失败，请重试')
      }
    } catch (err) {
      // 如果 API 不存在，暂时使用本地状态
      const ageNum = parseInt(formData.age)
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
        setError('请输入有效的年龄（1-100）')
        return
      }

      completeProfile()
      updateProfile({
        id: user?.id || '',
        name: formData.name,
        age: ageNum,
        city: formData.city,
        bio: formData.bio,
        interests: formData.interestsText.split('\n').map(n => n.trim()).filter(n => n),
        needs: formData.needsText.split('\n').map(n => n.trim()).filter(n => n),
        provide: formData.provideText.split('\n').map(p => p.trim()).filter(p => p),
        avatar: formData.avatarUrl,
        gender: formData.gender || undefined,
      })
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4">
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>完善个人信息</CardTitle>
          <CardDescription>
            请填写你的个人信息，以便我们更好地为你匹配
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form id="profile-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <ProfileFormFields
                userId={user?.id || ''}
                onChange={setFormData}
                error={error}
              />
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !formData}
              >
                {loading ? '保存中...' : '完成'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
