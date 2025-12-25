'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUserStore } from '@/stores/user-store'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const router = useRouter()
  const { register, user, completeProfile } = useAuthStore()
  const { updateProfile } = useUserStore()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    bio: '',
    interestsText: '',
    needsText: '',
    provideText: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度不能少于6位')
      return
    }

    setStep(2)
  }

  const handleProfileSubmit = async () => {
    setError('')

    if (!formData.name || !formData.city || !formData.bio) {
      setError('请填写所有必填项')
      return
    }

    const interests = formData.interestsText.split('\n').filter(i => i.trim())

    if (interests.length === 0) {
      setError('请至少输入一个兴趣爱好')
      return
    }

    setLoading(true)

    try {
      const success = await register(email, password)
      if (success && user) {
        // 更新用户信息
        updateProfile({
          id: user.id,
          name: formData.name,
          age: 26,
          city: formData.city,
          avatar: '/avatars/default.svg',
          bio: formData.bio,
          interests: interests,
          personalityTags: [],
          isOnline: true,
          lastSeen: '刚刚',
          basicInfo: {
            name: formData.name,
            age: 26,
            city: formData.city,
            bio: formData.bio,
          },
          needs: formData.needsText.split('\n').filter(n => n.trim()),
          provide: formData.provideText.split('\n').filter(p => p.trim()),
        })

        // 标记为已完成个人信息填写
        completeProfile()

        router.push('/')
      } else {
        setError('邮箱已被注册')
      }
    } catch (err) {
      setError('注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {step === 1 ? '创建账号' : '完善资料'}
          </h1>
          <p className="text-xl text-gray-600">
            {step === 1 ? '创建你的如故账号' : '让我们更好地了解你'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleAccountSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl p-8 space-y-6">
              <div>
                <label className="text-xl font-medium text-gray-900 block mb-3">邮箱地址</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="text-xl font-medium text-gray-900 block mb-3">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="••••••••"
                  required
                />
                <p className="text-base text-gray-500 mt-2">至少6位字符</p>
              </div>

              <div>
                <label className="text-xl font-medium text-gray-900 block mb-3">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="text-lg text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-xl bg-blue-700 text-white rounded-xl"
              >
                下一步
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-2xl p-8 space-y-6">
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

            {error && (
              <div className="text-lg text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12 text-xl"
              >
                上一步
              </Button>
              <Button
                onClick={handleProfileSubmit}
                disabled={loading}
                className="flex-1 h-12 text-xl bg-blue-700 text-white rounded-xl"
              >
                {loading ? '注册中...' : '完成注册'}
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="text-center mt-6">
            <span className="text-lg text-gray-600">已有账号？</span>
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="text-lg text-blue-600 font-semibold ml-2"
            >
              立即登录
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
