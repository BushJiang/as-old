/**
 * 认证状态管理
 *
 * 管理用户登录、注册和认证状态
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthState, AuthUser } from '@/lib/types'

// 内部类型：用于 mock 认证存储（包含密码）
// 注意：实际项目中密码应该在后端使用 bcrypt 等方式哈希存储
interface InternalAuthUser extends AuthUser {
  password: string
}

// 初始用户数据库（实际项目中应使用真实的数据库）
const INITIAL_MOCK_USERS: InternalAuthUser[] = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    email: 'test@example.com',
    password: '123456',
    hasCompletedProfile: true,
  },
  {
    id: 'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
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
      mockUsers: INITIAL_MOCK_USERS,

      // 检查用户是否存在
      checkUserExists: (email: string) => {
        return get().mockUsers.some(u => u.email === email)
      },

      // 登录
      login: async (email: string, password: string) => {
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500))

        const user = get().mockUsers.find(
          u => u.email === email && u.password === password
        )

        if (user) {
          set({
            isAuthenticated: true,
            user: {
              id: user.id,
              email: user.email,
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
        const exists = get().mockUsers.some(u => u.email === email)
        if (exists) {
          return false
        }

        // 创建新用户
        const newUser: InternalAuthUser = {
          id: crypto.randomUUID(),
          email,
          password,
          hasCompletedProfile: false,
        }

        // 持久化到 state
        set((state) => ({
          mockUsers: [...state.mockUsers, newUser]
        }))

        set({
          isAuthenticated: true,
          user: {
            id: newUser.id,
            email: newUser.email,
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
        mockUsers: state.mockUsers,
      }),
    }
  )
)
