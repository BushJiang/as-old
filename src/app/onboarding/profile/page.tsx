'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { embeddingsApi } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ProfileFormFields, type ProfileFormData } from '@/components/user/ProfileFormFields'
import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, completeProfile } = useAuthStore()
  const { updateProfile } = useUserStore()

  const [formData, setFormData] = useState<ProfileFormData | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVectorizing, setIsVectorizing] = useState(false)
  const [progress, setProgress] = useState(0)

  // 提交表单并自动向量化
  const handleSubmitAndVectorize = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData) {
      setError('表单数据未加载')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. 创建用户资料
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender || undefined,
          city: formData.city,
          bio: formData.bio,
          interests: formData.interestsText.split('\n').map(n => n.trim()).filter(n => n),
          needs: formData.needsText.split('\n').map(n => n.trim()).filter(n => n),
          provide: formData.provideText.split('\n').map(p => p.trim()).filter(p => p),
          avatarUrl: formData.avatarUrl,
        }),
      })

      const data = await response.json()

      if (!data.data) {
        setError(data.error || '保存失败，请重试')
        setIsSubmitting(false)
        return
      }

      // 更新本地状态
      completeProfile()
      updateProfile(data.data)

      // 2. 自动开始向量化
      setIsVectorizing(true)
      setProgress(0)

      console.log('开始向量化...')
      const generateResult = await embeddingsApi.generate({ embeddingType: 'all' })
      console.log('向量化结果:', generateResult)

      // 3. 轮询状态
      const result = await embeddingsApi.pollStatus(
        (currentProgress) => {
          console.log('向量化进度:', currentProgress)
          setProgress(currentProgress)
        },
        1000
      )

      console.log('最终结果:', result)

      if (result.success) {
        // 向量化完成，跳转到首页
        setTimeout(() => {
          router.push('/')
        }, 500)
      } else {
        setError(result.error || '向量化失败，请重试')
        setIsVectorizing(false)
      }
    } catch (err) {
      console.error('操作错误:', err)
      setError('保存失败，请重试')
      setIsSubmitting(false)
      setIsVectorizing(false)
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
            <form id="profile-form" onSubmit={handleSubmitAndVectorize}>
              <div className="flex flex-col gap-4">
                <ProfileFormFields
                  userId={user?.id || ''}
                  onChange={setFormData}
                  error={error}
                />
              </div>

              {/* 向量化进度 */}
              {isVectorizing && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-sm font-medium text-blue-700">
                      正在生成匹配数据...
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-2 text-center">
                    {progress}% 完成
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || isVectorizing || !formData}
                >
                  {isVectorizing ? '生成匹配数据中...' : isSubmitting ? '保存中...' : '完成'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
