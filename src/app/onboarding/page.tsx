'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Heart, Coffee, Check } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, completeProfile } = useAuthStore()
  const { updateProfile } = useUserStore()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    bio: '',
    interestsText: '',
    needs: [] as string[],
    provide: [] as string[],
  })

  const totalSteps = 3

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    if (!user) return

    // 处理兴趣爱好文本
    const interests = formData.interestsText.split('\n').filter(i => i.trim())

    // 更新用户信息
    updateProfile({
      id: user.id,
      name: formData.name,
      age: 26, // 设置默认年龄
      city: formData.city,
      avatar: '/avatars/default.svg',
      bio: formData.bio,
      interests: interests,
      personalityTags: [], // 移除性格标签
      isOnline: true,
      lastSeen: '刚刚',
      basicInfo: {
        name: formData.name,
        age: 26,
        city: formData.city,
        bio: formData.bio,
      },
      needs: formData.needs,
      provide: formData.provide,
    })

    // 标记为已完成个人信息填写
    completeProfile()

    // 跳转到主页
    router.push('/')
  }

  const toggleItem = (category: keyof typeof formData, item: string) => {
    setFormData(prev => {
      const items = prev[category] as string[]
      const newItems = items.includes(item)
        ? items.filter(i => i !== item)
        : [...items, item]
      return { ...prev, [category]: newItems }
    })
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.city && formData.bio
      case 2:
        const interests = formData.interestsText.split('\n').filter(i => i.trim())
        return interests.length > 0
      case 3:
        return formData.needs.length > 0 && formData.provide.length > 0
      default:
        return false
    }
  }

  const getAllInterests = () => {
    return formData.interestsText.split('\n').filter(i => i.trim())
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* 进度条 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>第 {step} 步，共 {totalSteps} 步</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl">
              {step === 1 && <><MapPin className="w-7 h-7 text-purple-600" /> 基本信息</>}
              {step === 2 && <><Heart className="w-7 h-7 text-pink-600" /> 兴趣爱好</>}
              {step === 3 && <><Coffee className="w-7 h-7 text-indigo-600" /> 需求与提供</>}
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              {step === 1 && '填写你的基本信息'}
              {step === 2 && '输入你的兴趣爱好（至少1个）'}
              {step === 3 && '填写你的需求和你能提供的内容'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* 步骤 1: 基本信息 */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">姓名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-white shadow-sm"
                    placeholder="你的姓名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">城市</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-white shadow-sm"
                    placeholder="例如：北京"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">个人简介</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-white shadow-sm h-40"
                    placeholder="介绍一下你自己..."
                  />
                </div>
              </div>
            )}

            {/* 步骤 2: 兴趣爱好 */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">兴趣爱好</label>
                  <textarea
                    value={formData.interestsText}
                    onChange={(e) => setFormData(prev => ({ ...prev, interestsText: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-purple-500/20 focus:border-purple-600 transition-all bg-white shadow-sm h-40"
                    placeholder="每行输入一个兴趣爱好，例如：&#10;读书&#10;音乐&#10;电影&#10;咖啡&#10;旅行"
                  />
                  <p className="text-sm text-gray-500 mt-2">每行一个兴趣爱好</p>
                </div>

                {/* 已输入的兴趣爱好预览 */}
                {getAllInterests().length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">
                        已输入 {getAllInterests().length} 个兴趣爱好
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {getAllInterests().map((interest, index) => (
                        <p key={index} className="text-purple-800">• {interest}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 步骤 3: 需求与提供 */}
            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <h3 className="font-bold mb-4 text-lg text-gray-900">你需要什么？</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    你希望从朋友那里得到什么支持或帮助？
                  </p>
                  <textarea
                    value={formData.needs.join('\n')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      needs: e.target.value.split('\n').filter(n => n.trim())
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all bg-white shadow-sm h-40"
                    placeholder="每行输入一个需求，例如：
深度对话
技术支持
情感支持"
                  />
                </div>

                <div>
                  <h3 className="font-bold mb-4 text-lg text-gray-900">你能提供什么？</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    你可以帮助朋友做什么？
                  </p>
                  <textarea
                    value={formData.provide.join('\n')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      provide: e.target.value.split('\n').filter(p => p.trim())
                    }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all bg-white shadow-sm h-40"
                    placeholder="每行输入一个提供的内容，例如：
心理咨询
技术指导
生活建议"
                  />
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-between gap-4 pt-8">
              <Button
                variant="outline"
                onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                className="h-12 px-8 border-2 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                上一步
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {step === totalSteps ? '完成' : '下一步'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
