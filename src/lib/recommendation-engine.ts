import type { User } from './types'

/**
 * 基于规则的推荐算法（Mock版）
 * 根据用户资料生成匹配分数
 */
export function calculateMatchScore(user1: User, user2: User): number {
  let score = 0

  // 兴趣匹配 (40%)
  const commonInterests = user1.interests.filter(i => user2.interests.includes(i))
  score += (commonInterests.length / Math.max(user1.interests.length, user2.interests.length)) * 40

  // 性格标签匹配 (30%)
  const commonTags = user1.personalityTags.filter(t => user2.personalityTags.includes(t))
  score += (commonTags.length / Math.max(user1.personalityTags.length, user2.personalityTags.length)) * 30

  // 年龄接近度 (20%)
  const ageDiff = Math.abs(user1.age - user2.age)
  score += Math.max(0, 20 - ageDiff * 2)

  // 城市匹配 (10%)
  if (user1.city === user2.city) {
    score += 10
  }

  return Math.round(score)
}

/**
 * 生成匹配推荐列表
 */
export function generateRecommendations(
  currentUser: User,
  allUsers: User[],
  limit: number = 10
): User[] {
  return allUsers
    .filter(user => user.id !== currentUser.id)
    .map(user => ({
      user,
      score: calculateMatchScore(currentUser, user)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.user)
}

/**
 * 生成破冰话题
 */
export function generateIceBreaker(user1: User, user2: User): string {
  const commonInterests = user1.interests.filter(i => user2.interests.includes(i))

  if (commonInterests.length > 0) {
    const interest = commonInterests[0]
    return `看到你也喜欢"${interest}"！你最近在关注这个领域的什么呢？`
  }

  if (user1.city === user2.city) {
    return `我们都在${user1.city}呢！你最喜欢这个城市的哪里？`
  }

  const personalities = [
    '感觉你是个很有趣的人，能分享一下最近让你开心的事情吗？',
    '你的简介很有个性，想听听你的故事。',
    '发现我们有相似的性格特质，这挺难得的。',
  ]

  return personalities[Math.floor(Math.random() * personalities.length)]
}

/**
 * 应用筛选器
 */
export function applyFilters(user: User, filters: any): boolean {
  // 年龄筛选
  if (user.age < filters.ageRange[0] || user.age > filters.ageRange[1]) {
    return false
  }

  // 城市筛选
  if (filters.city && user.city !== filters.city) {
    return false
  }

  // 在线状态筛选
  if (filters.onlyOnline && !user.isOnline) {
    return false
  }

  // 兴趣筛选
  if (filters.interests.length > 0) {
    const hasCommonInterest = filters.interests.some((interest: string) =>
      user.interests.includes(interest)
    )
    if (!hasCommonInterest) {
      return false
    }
  }

  // 性格标签筛选
  if (filters.personalityTags.length > 0) {
    const hasCommonTag = filters.personalityTags.some((tag: string) =>
      user.personalityTags.includes(tag)
    )
    if (!hasCommonTag) {
      return false
    }
  }

  return true
}
