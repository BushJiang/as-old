/**
 * 用户资料状态管理
 *
 * 管理用户资料、匹配推荐
 * 连接后端 API
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserState } from '@/lib/types'
import { profileApi, matchesApi } from '@/lib/api-client'
import { useAuthStore } from './auth-store'

// 用户资料映射：按 userId 存储多个用户的资料
interface UserProfilesMap {
  [userId: string]: User
}

// 创建默认用户数据
const createDefaultUser = (userId: string): User => ({
  id: userId,
  name: '测试账号',
  age: 26,
  gender: undefined,
  city: '北京',
  avatar: '/avatars/default.svg',
  bio: '一句话介绍自己',
  interests: ['读书', '音乐', '电影', '咖啡'],
  needs: ['深度对话', '精神交流'],
  provide: ['文学分享', '心理咨询'],
})

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: createDefaultUser('00000000-0000-0000-0000-000000000000'),
      userProfilesMap: {},
      potentialMatches: [],
      wantToKnowMatches: [],
      passedMatches: [],

      /**
       * 从后端 API 加载当前用户资料
       */
      fetchProfile: async () => {
        try {
          const result = await profileApi.getProfile()

          if (result.error) {
            console.error('获取用户资料失败:', result.error)
            return false
          }

          if (result.data) {
            const profile: User = {
              id: result.data.userId,
              name: result.data.name,
              age: result.data.age,
              gender: result.data.gender,
              city: result.data.city,
              avatar: result.data.avatarUrl,
              bio: result.data.bio,
              interests: result.data.interests || [],
              needs: result.data.needs || [],
              provide: result.data.provide || [],
            }

            set({ currentUser: profile })

            // 更新资料映射
            set((state) => ({
              userProfilesMap: {
                ...state.userProfilesMap,
                [profile.id]: profile,
              },
            }))

            return true
          }

          return false
        } catch (error) {
          console.error('获取用户资料错误:', error)
          return false
        }
      },

      /**
       * 更新用户资料（同时更新本地状态和后端）
       */
      updateProfile: async (data: Partial<User>) => {
        try {
          // 先更新本地状态（乐观更新）
          set((s) => {
            const updatedUser = s.currentUser ? { ...s.currentUser, ...data } as User : createDefaultUser('00000000-0000-0000-0000-000000000000')
            const newProfilesMap = { ...s.userProfilesMap }
            if (updatedUser.id) {
              newProfilesMap[updatedUser.id] = updatedUser
            }
            return {
              currentUser: updatedUser,
              userProfilesMap: newProfilesMap
            }
          })

          // 调用后端 API 更新（需要将 avatar 映射为 avatarUrl）
          const { avatar, ...restData } = data
          const apiData = avatar !== undefined
            ? { ...restData, avatarUrl: avatar }
            : restData
          const result = await profileApi.updateProfile(apiData)

          if (result.error) {
            console.error('更新用户资料失败:', result.error)
            // 回滚本地状态
            await get().fetchProfile()
            return false
          }

          return true
        } catch (error) {
          console.error('更新用户资料错误:', error)
          return false
        }
      },

      /**
       * 创建用户资料
       */
      createProfile: async (profile: {
        name: string
        age: number
        gender?: 'male' | 'female' | 'other'
        city?: string
        avatarUrl?: string
        bio?: string
        interests: string[]
        needs: string[]
        provide: string[]
      }) => {
        try {
          const result = await profileApi.createProfile(profile)

          if (result.error) {
            console.error('创建用户资料失败:', result.error)
            return false
          }

          // 刷新用户资料
          await get().fetchProfile()

          return true
        } catch (error) {
          console.error('创建用户资料错误:', error)
          return false
        }
      },

      /**
       * 从后端 API 获取推荐匹配
       */
      fetchRecommendations: async (params?: {
        mode?: 'similar-interests' | 'mutual-needs' | 'mutual-provide' | 'exploratory-discovery' | 'comprehensive'
        limit?: number
        offset?: number
      }) => {
        try {
          const result = await matchesApi.getRecommendations(params)

          if (result.error) {
            console.error('获取推荐失败:', result.error)
            return false
          }

          if (result.data && Array.isArray(result.data)) {
            const users: User[] = result.data.map((item: any) => ({
              id: item.userId || item.id,
              name: item.name,
              age: item.age,
              gender: item.gender,
              city: item.city,
              avatar: item.avatarUrl || item.avatar,
              bio: item.bio,
              interests: item.interests || [],
              needs: item.needs || [],
              provide: item.provide || [],
            }))

            set({ potentialMatches: users })

            // 更新用户资料映射
            set((state) => {
              const newProfilesMap = { ...state.userProfilesMap }
              users.forEach(user => {
                newProfilesMap[user.id] = user
              })
              return { userProfilesMap: newProfilesMap }
            })

            return true
          }

          return false
        } catch (error) {
          console.error('获取推荐错误:', error)
          return false
        }
      },

      /**
       * 添加到想认识列表
       */
      addToWantToKnow: async (userId: string) => {
        try {
          const result = await matchesApi.performAction(userId, 'want_to_know')

          if (result.error) {
            console.error('操作失败:', result.error)
            return false
          }

          // 更新本地状态
          const { potentialMatches, wantToKnowMatches } = get()
          const user = potentialMatches.find(u => u.id === userId)

          if (user && !wantToKnowMatches.some(u => u.id === userId)) {
            set({
              wantToKnowMatches: [user, ...wantToKnowMatches]
            })
          }

          return true
        } catch (error) {
          console.error('操作错误:', error)
          return false
        }
      },

      /**
       * 从想认识列表移除
       */
      removeFromWantToKnow: (userId: string) => {
        set((state) => ({
          wantToKnowMatches: state.wantToKnowMatches.filter(u => u.id !== userId)
        }))
      },

      /**
       * 切换想认识状态
       */
      toggleWantToKnow: async (userId: string) => {
        const { wantToKnowMatches } = get()
        const isWantToKnow = wantToKnowMatches.some(u => u.id === userId)

        if (isWantToKnow) {
          get().removeFromWantToKnow(userId)
        } else {
          await get().addToWantToKnow(userId)
        }
      },

      /**
       * 检查是否在想认识列表中
       */
      isWantToKnow: (userId: string) => {
        const { wantToKnowMatches } = get()
        return wantToKnowMatches.some(u => u.id === userId)
      },

      /**
       * 跳过用户
       */
      passUser: async (userId: string) => {
        try {
          const result = await matchesApi.performAction(userId, 'passed')

          if (result.error) {
            console.error('操作失败:', result.error)
            return false
          }

          // 更新本地状态
          set((state) => {
            const user = state.potentialMatches.find(u => u.id === userId)
            return {
              potentialMatches: state.potentialMatches.filter(u => u.id !== userId),
              passedMatches: user ? [...state.passedMatches, user] : state.passedMatches
            }
          })

          return true
        } catch (error) {
          console.error('操作错误:', error)
          return false
        }
      },

      /**
       * 获取想认识的用户列表
       */
      getWantToKnowUsers: () => get().wantToKnowMatches,

      /**
       * 重新初始化当前用户（切换账号时使用）
       */
      reinitializeUser: async () => {
        const authUser = useAuthStore.getState().user

        if (!authUser?.id) {
          // 未登录，使用默认用户
          set({
            currentUser: createDefaultUser('00000000-0000-0000-0000-000000000000'),
            potentialMatches: [],
            wantToKnowMatches: [],
            passedMatches: [],
          })
          return
        }

        // 加载用户资料
        await get().fetchProfile()

        // 加载推荐匹配
        await get().fetchRecommendations()

        // 清空匹配列表
        set({
          wantToKnowMatches: [],
          passedMatches: [],
        })
      },

      /**
       * 清除匹配数据（保留用户资料）
       */
      clearMatches: async () => {
        // 重新获取推荐
        await get().fetchRecommendations()

        set({
          wantToKnowMatches: [],
          passedMatches: [],
        })
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        userProfilesMap: state.userProfilesMap,
        // 不持久化匹配列表，每次从后端获取
        potentialMatches: state.potentialMatches,
        wantToKnowMatches: state.wantToKnowMatches,
        passedMatches: state.passedMatches,
      }),
    }
  )
)
