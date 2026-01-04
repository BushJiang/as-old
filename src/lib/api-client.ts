/**
 * API 客户端辅助函数
 *
 * 提供统一的 API 调用接口，处理认证、错误等
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

/**
 * 通用 API 请求函数
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}/api${endpoint}`

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // 包含 cookies
    ...options,
  }

  const response = await fetch(url, defaultOptions)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || '请求失败')
  }

  return response
}

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  async login(email: string, password: string) {
    const response = await apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  },

  /**
   * 用户注册
   */
  async register(email: string, password: string) {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  },

  /**
   * 用户登出
   */
  async logout() {
    const response = await apiRequest('/auth/signout', {
      method: 'POST',
    })
    return response.json()
  },

  /**
   * 获取当前会话
   */
  async getSession() {
    try {
      const response = await apiRequest('/auth/session')
      return response.json()
    } catch {
      return null
    }
  },

  /**
   * 检查邮箱是否存在
   */
  async checkEmail(email: string) {
    const response = await apiRequest(`/auth/check-email?email=${encodeURIComponent(email)}`)
    return response.json()
  },
}

/**
 * 用户资料相关 API
 */
export const profileApi = {
  /**
   * 获取当前用户资料
   */
  async getProfile() {
    const response = await apiRequest('/user/profile')
    return response.json()
  },

  /**
   * 创建用户资料
   */
  async createProfile(profile: {
    name: string
    age: number
    gender?: 'male' | 'female' | 'other'
    city?: string
    avatarUrl?: string
    bio?: string
    interests: string[]
    needs: string[]
    provide: string[]
  }) {
    const response = await apiRequest('/user/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    })
    return response.json()
  },

  /**
   * 更新用户资料
   */
  async updateProfile(profile: {
    name?: string
    age?: number
    gender?: 'male' | 'female' | 'other'
    city?: string
    avatarUrl?: string
    bio?: string
    interests?: string[]
    needs?: string[]
    provide?: string[]
  }) {
    const response = await apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    })
    return response.json()
  },
}

/**
 * 匹配相关 API
 */
export const matchesApi = {
  /**
   * 获取推荐匹配
   */
  async getRecommendations(params?: {
    mode?: 'similar-interests' | 'mutual-needs' | 'comprehensive'
    limit?: number
    offset?: number
  }) {
    const query = new URLSearchParams()
    if (params?.mode) query.set('mode', params.mode)
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.offset) query.set('offset', params.offset.toString())

    const response = await apiRequest(`/matches?${query.toString()}`)
    return response.json()
  },

  /**
   * 对匹配用户执行操作
   */
  async performAction(matchId: string, action: 'want_to_know' | 'passed' | 'block') {
    const response = await apiRequest(`/matches/${matchId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
    return response.json()
  },

  /**
   * 获取想认识的用户列表
   */
  async getWantToKnowMatches() {
    const response = await apiRequest('/matches?type=want_to_know')
    return response.json()
  },
}

/**
 * 向量相关 API
 */
export const embeddingsApi = {
  /**
   * 生成用户向量嵌入
   */
  async generate(params?: {
    embeddingType?: 'interest' | 'need' | 'provide' | 'all'
    forceRegenerate?: boolean
  }) {
    const query = new URLSearchParams()
    if (params?.embeddingType) query.set('embeddingType', params.embeddingType)
    if (params?.forceRegenerate) query.set('forceRegenerate', params.forceRegenerate.toString())

    const response = await apiRequest(`/embeddings/generate?${query.toString()}`, {
      method: 'POST',
    })
    return response.json()
  },

  /**
   * 获取向量生成状态
   */
  async getStatus() {
    const response = await apiRequest('/embeddings/status')
    return response.json()
  },

  /**
   * 轮询向量生成进度
   */
  async pollStatus(
    onProgress: (progress: number) => void,
    interval: number = 1000
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return new Promise((resolve) => {
      const timer = setInterval(async () => {
        try {
          const result = await this.getStatus()

          if (result.success && result.data) {
            const { status, progress } = result.data

            if (status === 'completed') {
              clearInterval(timer)
              resolve({ success: true, data: result.data })
            } else if (status === 'failed') {
              clearInterval(timer)
              resolve({ success: false, error: '向量化失败' })
            } else if (progress !== undefined) {
              onProgress(progress)
            }
          }
        } catch (error) {
          clearInterval(timer)
          resolve({ success: false, error: '查询状态失败' })
        }
      }, interval)
    })
  },
}
