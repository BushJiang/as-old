import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserState } from '@/lib/types'
import { MOCK_USERS } from '@/data/mock/users'
import { useAuthStore } from './auth-store'

// 创建默认用户数据
const createDefaultUser = (userId: string): User => ({
  id: userId,
  name: '测试账号',
  age: 26,
  city: '北京',
  avatar: '/avatars/default.svg',
  bio: '一句话介绍自己',
  interests: ['读书', '音乐', '电影', '咖啡'],
  needs: ['深度对话', '精神交流', '理解与陪伴'],
  provide: ['文学分享', '心理咨询', '咖啡文化'],
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

      // 初始化当前用户
      const currentUser = createDefaultUser(userId)
      const recommendations = getMockRecommendations()

      return {
        currentUser,
        potentialMatches: recommendations,
        wantToKnowMatches: [],
        passedMatches: [],

        updateProfile: (data) => set((s) => ({
          currentUser: s.currentUser ? { ...s.currentUser, ...data } as User : data as User
        })),

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
          const newUser = createDefaultUser(userId)
          const recommendations = getMockRecommendations()

          set({
            currentUser: newUser,
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
