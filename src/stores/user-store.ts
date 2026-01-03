import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserState } from '@/lib/types'
import { MOCK_USERS } from '@/data/mock/users'
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

// 获取潜在匹配用户（使用 mock 数据）
const getMockRecommendations = () => {
  return MOCK_USERS.slice(0, 10)
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      // 从 auth-store 获取当前登录用户的 id
      const authUser = useAuthStore.getState().user
      const userId = authUser?.id || '00000000-0000-0000-0000-000000000000'

      // 初始化用户资料映射（从 localStorage 恢复或创建新的）
      const userProfilesMap: UserProfilesMap = {}

      // 初始化当前用户
      const currentUser = createDefaultUser(userId)
      const recommendations = getMockRecommendations()

      return {
        currentUser,
        userProfilesMap,
        potentialMatches: recommendations,
        wantToKnowMatches: [],
        passedMatches: [],

        updateProfile: (data) => set((s) => {
          const updatedUser = s.currentUser ? { ...s.currentUser, ...data } as User : data as User
          // 同时更新资料映射
          const newProfilesMap = { ...s.userProfilesMap }
          if (updatedUser.id) {
            newProfilesMap[updatedUser.id] = updatedUser
          }
          return {
            currentUser: updatedUser,
            userProfilesMap: newProfilesMap
          }
        }),

        addPotentialMatch: (user) => set((s) => ({
          potentialMatches: [user, ...s.potentialMatches]
        })),

        wantToKnowUser: (userId) => {
          const { potentialMatches, wantToKnowMatches } = get()
          const user = potentialMatches.find(u => u.id === userId)
          if (user) {
            set({
              potentialMatches: potentialMatches.filter(u => u.id !== userId),
              wantToKnowMatches: [user, ...wantToKnowMatches]
            })
          }
        },

        addToWantToKnow: (userId) => {
          const { potentialMatches, wantToKnowMatches } = get()
          // 先检查是否已经在想认识列表中
          if (wantToKnowMatches.some(u => u.id === userId)) {
            return
          }
          // 从潜在匹配中找到用户
          const user = potentialMatches.find(u => u.id === userId)
          if (user) {
            set({
              wantToKnowMatches: [user, ...wantToKnowMatches]
            })
          }
        },

        removeFromWantToKnow: (userId) => {
          const { wantToKnowMatches } = get()
          set({
            wantToKnowMatches: wantToKnowMatches.filter(u => u.id !== userId)
          })
        },

        toggleWantToKnow: (userId) => {
          const { potentialMatches, wantToKnowMatches } = get()
          // 检查是否已在收藏列表中
          const existing = wantToKnowMatches.find(u => u.id === userId)
          if (existing) {
            // 已在收藏列表中，移除
            set({
              wantToKnowMatches: wantToKnowMatches.filter(u => u.id !== userId)
            })
          } else {
            // 不在收藏列表中，添加
            const user = potentialMatches.find(u => u.id === userId)
            if (user) {
              set({
                wantToKnowMatches: [user, ...wantToKnowMatches]
              })
            }
          }
        },

        isWantToKnow: (userId) => {
          const { wantToKnowMatches } = get()
          return wantToKnowMatches.some(u => u.id === userId)
        },

        passUser: (userId) => set((s) => {
          const user = s.potentialMatches.find(u => u.id === userId)
          return {
            potentialMatches: s.potentialMatches.filter(u => u.id !== userId),
            passedMatches: user ? [...s.passedMatches, user] : s.passedMatches
          }
        }),

        getWantToKnowUsers: () => get().wantToKnowMatches,

        // 重新初始化当前用户（切换账号时使用）
        reinitializeUser: () => {
          const authUser = useAuthStore.getState().user
          const userId = authUser?.id || '00000000-0000-0000-0000-000000000000'

          // 先检查资料映射中是否已有该用户的资料
          const { userProfilesMap } = get()
          const existingProfile = userProfilesMap[userId]

          // 如果有保存的资料，使用保存的；否则创建新的默认用户
          const currentUser = existingProfile || createDefaultUser(userId)
          const recommendations = getMockRecommendations()

          set({
            currentUser,
            potentialMatches: recommendations,
            wantToKnowMatches: [],
            passedMatches: [],
          })
        },

        // 清除匹配数据（保留用户资料）
        clearMatches: () => {
          const recommendations = getMockRecommendations()
          set({
            wantToKnowMatches: [],
            passedMatches: [],
            potentialMatches: recommendations,
          })
        },
      }
    },
    { name: 'user-storage', storage: createJSONStorage(() => localStorage) }
  )
)
