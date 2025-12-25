export interface User {
  id: string
  name: string
  age: number
  city: string
  avatar: string
  bio: string
  interests: string[]
  personalityTags: string[]
  isOnline: boolean
  lastSeen: string
  // 新增字段
  basicInfo: {
    name: string
    age: number
    city: string
    bio: string
  }
  needs: string[]
  provide: string[]
}

export interface FilterState {
  ageRange: [number, number]
  city: string | null
  interests: string[]
  personalityTags: string[]
  onlyOnline: boolean
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
  potentialMatches: User[]
  likedMatches: User[]
  passedMatches: User[]
  updateProfile: (data: Partial<User>) => void
  addPotentialMatch: (user: User) => void
  likeUser: (userId: string) => void
  passUser: (userId: string) => void
  getMatchedUsers: () => User[]
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

export const PERSONALITY_TAGS = [
  '内向', '外向', '理性', '感性', '创新', '稳重', '幽默', '严肃',
  '艺术', '技术宅', '文艺', '运动', '旅行', '美食', '宅', '社交',
  '独立', '依赖', '乐观', '悲观', '现实', '理想', '温柔', '强势',
  '细心', '粗心', '耐心', '急躁', '安静', '活泼', '严肃', '随和',
] as const

// 认证相关类型
export interface AuthUser {
  id: string
  email: string
  password: string
  hasCompletedProfile: boolean
}

export interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => void
  completeProfile: () => void
}

// 匹配算法类型
export type MatchType =
  | 'similar_interests'     // 兴趣爱好相似
  | 'mutual_needs'          // 相互满足需求
  | 'mutual_provide'        // 相互提供
  | 'deep_analysis'         // 深度分析

export interface MatchRequest {
  type: MatchType
  userId: string
  limit?: number
}

export interface MatchResult {
  users: User[]
  matchType: MatchType
  total: number
}

// Milvus 向量数据库类型
export interface MilvusConfig {
  host: string
  port: string
  collectionName: string
}
