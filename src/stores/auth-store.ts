/**
 * 认证状态管理
 *
 * 管理用户登录、注册和认证状态
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthState, AuthUser } from '@/lib/types'

// 模拟用户数据库（实际项目中应使用真实的数据库）
const mockUsers: AuthUser[] = [
  {
    id: 'user-001',
    email: 'test@example.com',
    password: '123456',
    hasCompletedProfile: true,
  },
  {
    id: 'user-002',
    email: 'user@example.com',
    password: 'password',
    hasCompletedProfile: false,
  },
]

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,

      // 登录
      login: async (email: string, password: string) => {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500))

        const user = mockUsers.find(
          u => u.email === email && u.password === password
        )

        if (user) {
          set({
            isAuthenticated: true,
            user: {
              id: user.id,
              email: user.email,
              password: '', // 不存储密码
              hasCompletedProfile: user.hasCompletedProfile,
            },
          })
          return true
        }

        return false
      },

      // 注册
      register: async (email: string, password: string) => {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500))

        // 检查邮箱是否已存在
        const exists = mockUsers.some(u => u.email === email)
        if (exists) {
          return false
        }

        // 创建新用户
        const newUser: AuthUser = {
          id: `user-${Date.now()}`,
          email,
          password,
          hasCompletedProfile: false,
        }

        mockUsers.push(newUser)

        set({
          isAuthenticated: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            password: '',
            hasCompletedProfile: false,
          },
        })

        return true
      },

      // 登出
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
        })
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
