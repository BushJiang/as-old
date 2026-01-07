import type { MatchResult } from '@/lib/services/matching-service'

export type { MatchResult }
export type Gender = 'male' | 'female' | 'other'

export interface User {
  id: string
  name: string
  age: number
  gender?: Gender
  city: string
  avatar: string
  bio: string
  interests: string[]
  needs: string[]
  provide: string[]
}

export interface FilterState {
  ageRange: [number, number]
  city: string | null
  interests: string[]
  showMe: 'everyone' | 'men' | 'women'
}

export interface AppState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  currentPage: 'discover' | 'profile' | 'matches' | 'settings'
  useMockMode: boolean
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setCurrentPage: (page: AppState['currentPage']) => void
  setMockMode: (mock: boolean) => void
}

export interface UserState {
  currentUser: User
  userProfilesMap: Record<string, User>
  potentialMatches: User[]
  potentialMatchesWithDetails: any[] // 包含 bestMatch 和 allMatches 的匹配结果
  wantToKnowMatches: User[]
  passedMatches: User[]
  fetchProfile: () => Promise<boolean>
  updateProfile: (data: Partial<User>) => Promise<boolean>
  createProfile: (profile: {
    name: string
    age: number
    gender?: 'male' | 'female' | 'other'
    city?: string
    avatarUrl?: string
    bio?: string
    interests: string[]
    needs: string[]
    provide: string[]
  }) => Promise<boolean>
  fetchRecommendations: (params?: {
    mode?: 'similar-interests' | 'mutual-needs' | 'mutual-provide' | 'exploratory-discovery' | 'comprehensive'
    limit?: number
    offset?: number
  }) => Promise<boolean>
  addToWantToKnow: (userId: string) => Promise<boolean>
  removeFromWantToKnow: (userId: string) => void
  toggleWantToKnow: (userId: string) => Promise<void>
  isWantToKnow: (userId: string) => boolean
  passUser: (userId: string) => Promise<boolean>
  getWantToKnowUsers: () => User[]
  reinitializeUser: () => Promise<void>
  clearMatches: () => Promise<void>
  setMatchesFromCache: (
    mode: 'similar-interests' | 'mutual-needs' | 'mutual-provide' | 'exploratory-discovery',
    users: User[],
    matchResults: MatchResult[]
  ) => void
}

export interface FilterStateStore {
  filters: FilterState
  setAgeRange: (range: [number, number]) => void
  setCity: (city: string | null) => void
  toggleInterest: (interest: string) => void
  resetFilters: () => void
}

export const INTEREST_CATEGORIES = {
  '文艺': ['读书', '诗歌', '绘画', '音乐', '电影', '戏剧', '摄影', '写作'],
  '运动': ['跑步', '健身', '瑜伽', '游泳', '爬山', '骑行', '足球', '篮球'],
  '科技': ['编程', 'AI', '区块链', '科技新闻', '数码', '游戏', '开源', '创业'],
  '生活': ['美食', '旅行', '园艺', '手工', '宠物', '收藏', '时尚', '家居'],
  '学习': ['语言', '历史', '哲学', '心理学', '科学', '法律', '医学', '教育'],
  '娱乐': ['动漫', '综艺', '直播', 'K歌', '桌游', '密室', '电影', '音乐'],
} as const

// 认证相关类型
export interface AuthUser {
  id: string
  email: string
  hasCompletedProfile: boolean
}

export interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  checkEmailExists: (email: string) => Promise<{ exists: boolean; error?: string }>
  sendVerificationCode: (email: string) => Promise<{ success: boolean; error?: string }>
  loginWithCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  completeProfile: () => void
  initializeSession: () => Promise<void>
}

// 匹配详情相关类型
export interface InterestMatchDetail {
  myInterest: string
  theirInterest: string
  similarityPercent: number
}

export interface MatchedUser extends User {
  bestMatch: InterestMatchDetail
  allMatches: InterestMatchDetail[]
}
