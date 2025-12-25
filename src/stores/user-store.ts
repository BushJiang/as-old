import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserState } from '@/lib/types'
import { MOCK_USERS } from '@/data/mock/users'
import { generateRecommendations, applyFilters } from '@/lib/recommendation-engine'

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      // 初始化当前用户
      const currentUser = {
        id: 'current-user',
        name: '测试账号',
        age: 26,
        city: '北京',
        avatar: '/avatars/default.svg',
        bio: '内向者，寻找一见如故的朋友。',
        interests: ['读书', '音乐', '电影', '咖啡'],
        personalityTags: ['内向', '温和', '理性'],
        isOnline: true,
        lastSeen: '刚刚',
        basicInfo: {
          name: '测试账号',
          age: 26,
          city: '北京',
          bio: '内向者，寻找一见如故的朋友。',
        },
        needs: ['深度对话', '精神交流', '理解与陪伴'],
        provide: ['文学分享', '心理咨询', '咖啡文化'],
      }

      // 初始化潜在匹配
      const defaultFilters = {
        ageRange: [18, 50] as [number, number],
        city: null as string | null,
        interests: [] as string[],
        personalityTags: [] as string[],
        onlyOnline: false,
        showMe: 'everyone' as const,
      }

      const filteredUsers = MOCK_USERS.filter(user => applyFilters(user, defaultFilters))
      const recommendations = generateRecommendations(currentUser, filteredUsers, 10)

      return {
        currentUser,
        potentialMatches: recommendations,
        likedMatches: [],
        passedMatches: [],

        updateProfile: (data) => set((s) => ({
          currentUser: s.currentUser ? { ...s.currentUser, ...data } as User : data as User
        })),

        addPotentialMatch: (user) => set((s) => ({
          potentialMatches: [user, ...s.potentialMatches]
        })),

        likeUser: (userId) => {
          const { potentialMatches, likedMatches } = get()
          const user = potentialMatches.find(u => u.id === userId)
          if (user) {
            set({
              potentialMatches: potentialMatches.filter(u => u.id !== userId),
              likedMatches: [user, ...likedMatches]
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

        getMatchedUsers: () => get().likedMatches,
      }
    },
    { name: 'user-storage', storage: createJSONStorage(() => localStorage) }
  )
)
