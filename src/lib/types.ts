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
  currentUser: User | null
  userProfilesMap: Record<string, User>
  potentialMatches: User[]
  wantToKnowMatches: User[]
  passedMatches: User[]
  updateProfile: (data: Partial<User>) => void
  addPotentialMatch: (user: User) => void
  wantToKnowUser: (userId: string) => void
  addToWantToKnow: (userId: string) => void
  removeFromWantToKnow: (userId: string) => void
  toggleWantToKnow: (userId: string) => void
  isWantToKnow: (userId: string) => boolean
  passUser: (userId: string) => void
  getWantToKnowUsers: () => User[]
  reinitializeUser: () => void
  clearMatches: () => void
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
  // mockUsers 是内部类型，包含密码用于验证
  // 在实际项目中应该移到后端
  mockUsers: Array<AuthUser & { password: string }>
  checkUserExists: (email: string) => boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => void
  completeProfile: () => void
}
