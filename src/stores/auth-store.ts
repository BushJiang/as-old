/**
 * 认证状态管理
 *
 * 管理用户登录、注册和认证状态
 * 支持邮箱验证码登录和密码登录
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthState, AuthUser } from '@/lib/types'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,

      // 检查邮箱是否已存在
      checkEmailExists: async (email: string) => {
        try {
          const response = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })

          const result = await response.json()

          if (!response.ok) {
            console.error('检查邮箱失败:', result.error)
            return { exists: false, error: result.error }
          }

          return { exists: result.exists }
        } catch (error) {
          console.error('检查邮箱错误:', error)
          return { exists: false, error: '网络错误，请重试' }
        }
      },

      // 发送验证码到邮箱
      sendVerificationCode: async (email: string) => {
        try {
          const response = await fetch('/api/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })

          const result = await response.json()

          if (!response.ok) {
            console.error('发送验证码失败:', result.error)
            return { success: false, error: result.error }
          }

          return { success: true }
        } catch (error) {
          console.error('发送验证码错误:', error)
          return { success: false, error: '网络错误，请重试' }
        }
      },

      // 使用验证码登录
      loginWithCode: async (email: string, code: string) => {
        try {
          const response = await fetch('/api/auth/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
          })

          const result = await response.json()

          if (!response.ok) {
            console.error('验证失败:', result.error)
            return { success: false, error: result.error }
          }

          if (result.user) {
            set({
              isAuthenticated: true,
              user: {
                id: result.user.id,
                email: result.user.email,
                hasCompletedProfile: false,
              },
            })
          }

          return { success: true }
        } catch (error) {
          console.error('登录错误:', error)
          return { success: false, error: '网络错误，请重试' }
        }
      },

      // 密码登录（保留作为备选）
      login: async (email: string, password: string) => {
        try {
          const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          const result = await response.json()

          if (!response.ok) {
            return false
          }

          // 登录成功，重新获取会话
          await get().initializeSession()
          return true
        } catch (error) {
          console.error('登录错误:', error)
          return false
        }
      },

      // 注册（发送验证码）
      register: async (email: string) => {
        return await get().sendVerificationCode(email)
      },

      // 登出
      logout: async () => {
        try {
          await fetch('/api/auth/signout', { method: 'POST' })
        } catch (error) {
          console.error('登出错误:', error)
        } finally {
          set({
            isAuthenticated: false,
            user: null,
          })
        }
      },

      // 完成个人信息填写
      completeProfile: () => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              hasCompletedProfile: true,
            },
          })
        }
      },

      // 初始化会话（页面加载时检查登录状态）
      initializeSession: async () => {
        try {
          const response = await fetch('/api/auth/session')
          const sessionResult = await response.json()

          if (sessionResult?.user) {
            set({
              isAuthenticated: true,
              user: {
                id: sessionResult.user.id,
                email: sessionResult.user.email,
                hasCompletedProfile: false,
              },
            })
          } else {
            set({
              isAuthenticated: false,
              user: null,
            })
          }
        } catch (error) {
          console.error('初始化会话失败:', error)
          set({
            isAuthenticated: false,
            user: null,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
)
