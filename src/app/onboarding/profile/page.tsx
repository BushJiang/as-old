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
import { CheckCircle, Loader2 } from 'lucide-react'

type PageStep = 'form' | 'success' | 'vectorizing'

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, completeProfile } = useAuthStore()
  const { updateProfile } = useUserStore()

  const [formData, setFormData] = useState<ProfileFormData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 新增状态：控制页面步骤
  const [step, setStep] = useState<PageStep>('form')
  const [progress, setProgress] = useState(0)
  const [vectorizeError, setVectorizeError] = useState('')

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData) {
      setError('表单数据未加载')
      return
    }

    setLoading(true)

    try {
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

      if (data.data) {
        // 更新本地状态
        completeProfile()
        updateProfile(data.data)
        // 切换到成功界面，不再自动跳转
        setStep('success')
      } else {
        setError(data.error || '保存失败，请重试')
      }
    } catch (err) {
      console.error('保存资料错误:', err)
      setError('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 开始向量化
  const handleStartMatching = async () => {
    setStep('vectorizing')
    setProgress(0)
    setVectorizeError('')

    try {
      // 1. 先调用 generate 触发向量化
      await embeddingsApi.generate({ embeddingType: 'all' })

      // 2. 轮询状态
      const result = await embeddingsApi.pollStatus(
        (currentProgress) => {
          setProgress(currentProgress)
        },
        1000
      )

      if (result.success) {
        // 向量化完成，跳转到首页
        setTimeout(() => {
          router.push('/')
        }, 500)
      } else {
        setVectorizeError(result.error || '向量化失败，请重试')
        setStep('success')
      }
    } catch (err) {
      console.error('向量化错误:', err)
      setVectorizeError('向量化失败，请重试')
      setStep('success')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4">
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-sm">
          {/* 步骤 1：填写资料表单 */}
          {step === 'form' && (
            <>
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
            </>
          )}

          {/* 步骤 2：完成并开始匹配 */}
          {step === 'success' && (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <CardTitle>资料填写完成</CardTitle>
                <CardDescription>
                  恭喜你完成个人信息填写
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-600 text-center">
                    点击下方按钮，我们将根据你的兴趣和需求为你匹配合适的用户
                  </p>

                  {vectorizeError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md text-center">
                      {vectorizeError}
                    </div>
                  )}

                  <Button
                    onClick={handleStartMatching}
                    className="w-full"
                    size="lg"
                  >
                    开始匹配
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    首次使用需要生成向量数据，可能需要几秒钟
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* 步骤 3：向量化进度 */}
          {step === 'vectorizing' && (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                </div>
                <CardTitle>正在生成匹配数据</CardTitle>
                <CardDescription>
                  请稍候，我们正在分析你的兴趣和需求
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">处理进度</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    正在生成向量嵌入...
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
