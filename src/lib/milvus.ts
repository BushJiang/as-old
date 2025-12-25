/**
 * Milvus 向量数据库集成模块
 *
 * 本模块实现了与 Milvus 向量数据库的集成，用于：
 * 1. 存储用户向量表示
 * 2. 执行相似度搜索
 * 3. 实现四种匹配算法
 *
 * 注意：由于浏览器环境限制，当前使用模拟数据
 * 在生产环境中，应在服务端 API 路由中集成真实的 Milvus
 */

import type { User, MatchRequest, MatchResult, MatchType, MilvusConfig } from '@/lib/types'
import { MOCK_USERS } from '@/data/mock/users'

class MilvusService {
  /**
   * 执行匹配搜索（使用模拟数据）
   */
  async searchUsers(request: MatchRequest): Promise<MatchResult> {
    return this.mockSearch(request)
  }

  /**
   * 模拟搜索（用于开发和测试）
   */
  private mockSearch(request: MatchRequest): MatchResult {
    const { type, userId, limit = 4 } = request

    // 从本地数据模拟搜索结果
    let filteredUsers = [...MOCK_USERS].filter(user => user.id !== userId)

    switch (type) {
      case 'similar_interests':
        // 兴趣爱好相似度匹配
        const currentUser = MOCK_USERS.find(u => u.id === userId)
        if (currentUser) {
          filteredUsers = filteredUsers.map(user => ({
            ...user,
            similarity: this.calculateJaccardSimilarity(
              currentUser.interests,
              user.interests
            ),
          }))
            .filter(user => user.similarity > 0.3)
            .sort((a, b) => b.similarity - a.similarity)
        }
        break

      case 'mutual_needs':
        // 相互满足需求：用户的 provide 匹配其他用户的 needs
        filteredUsers = filteredUsers.filter(user => {
          const currentUser = MOCK_USERS.find(u => u.id === userId)
          if (!currentUser) return false
          return this.hasOverlap(currentUser.provide, user.needs)
        })
        break

      case 'mutual_provide':
        // 相互提供：用户可以提供其他用户需要的东西
        filteredUsers = filteredUsers.filter(user => {
          const currentUser = MOCK_USERS.find(u => u.id === userId)
          if (!currentUser) return false
          return this.hasOverlap(currentUser.needs, user.provide)
        })
        break

      case 'deep_analysis':
        // 深度分析：考虑多个维度的潜在匹配
        const currentUser2 = MOCK_USERS.find(u => u.id === userId)
        if (currentUser2) {
          filteredUsers = filteredUsers.map(user => ({
            ...user,
            potentialScore: this.calculatePotentialScore(currentUser2, user),
          }))
            .filter(user => user.potentialScore > 0.4)
            .sort((a, b) => b.potentialScore - a.potentialScore)
        }
        break
    }

    return {
      users: filteredUsers.slice(0, limit),
      matchType: type,
      total: filteredUsers.length,
    }
  }

  /**
   * 计算 Jaccard 相似度
   */
  private calculateJaccardSimilarity(setA: string[], setB: string[]): number {
    const intersection = setA.filter(item => setB.includes(item))
    const union = [...new Set([...setA, ...setB])]
    return union.length === 0 ? 0 : intersection.length / union.length
  }

  /**
   * 检查数组是否有重叠
   */
  private hasOverlap(arr1: string[], arr2: string[]): boolean {
    return arr1.some(item => arr2.includes(item))
  }

  /**
   * 计算潜在匹配分数
   */
  private calculatePotentialScore(user1: User, user2: User): number {
    let score = 0

    // 兴趣相似度 (30%)
    score += this.calculateJaccardSimilarity(user1.interests, user2.interests) * 0.3

    // 需求互补性 (40%)
    const mutualNeeds = this.hasOverlap(user1.provide, user2.needs) &&
                       this.hasOverlap(user2.provide, user1.needs)
    if (mutualNeeds) score += 0.4

    // 提供内容相似度 (30%)
    score += this.calculateJaccardSimilarity(user1.provide, user2.provide) * 0.3

    return score
  }
}

// 导出单例实例
export const milvusService = new MilvusService()

// 导出函数供页面调用
export async function searchUsers(request: MatchRequest): Promise<MatchResult> {
  return milvusService.searchUsers(request)
}
