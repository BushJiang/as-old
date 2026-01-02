/**
 * 匹配服务
 *
 * 功能：
 * - 兴趣相投匹配：兴趣向量 vs 兴趣向量
 * - 互助合作匹配：需求向量 vs 提供向量
 * - 综合匹配：结合多种策略
 */

import { db } from '@/lib/db'
import { userEmbeddings, userProfiles, users } from '@/lib/db/schema'
import { eq, and, sql, desc, ne, gt } from 'drizzle-orm'

export interface MatchResult {
  userId: string
  name: string
  age: number
  city: string
  avatar: string
  bio: string
  interests: string[]
  needs: string[]
  provide: string[]
  similarity: number
  matchReasons: {
    commonInterests: string[]
    complementaryNeeds: { myNeed: string; theirProvide: string }[]
  }
}

/**
 * 兴趣相投匹配
 * 查找与当前用户兴趣相似的其他用户
 *
 * @param currentUserId 当前用户ID
 * @param limit 返回结果数量限制
 * @returns 匹配用户列表
 */
export async function findSimilarInterests(
  currentUserId: string,
  limit: number = 10
): Promise<MatchResult[]> {
  // 获取当前用户的兴趣向量
  const myInterests = await db.query.userEmbeddings.findMany({
    where: and(
      eq(userEmbeddings.userId, currentUserId),
      eq(userEmbeddings.embeddingType, 'interest'),
      eq(userEmbeddings.embeddingGenerationStatus, 'completed')
    ),
  })

  if (myInterests.length === 0) {
    return []
  }

  // TODO: 实现向量相似度搜索
  // 由于 Drizzle ORM 不直接支持 pgvector 的 <=> 操作符
  // 这里先使用简单的文本匹配，后续需要使用原始 SQL

  // 临时实现：查找有相同兴趣的用户（基于文本）
  const myInterestTexts = myInterests.map(e => e.sourceText)

  // 查找其他用户的兴趣向量
  const otherInterests = await db
    .select({
      userId: userEmbeddings.userId,
      sourceText: userEmbeddings.sourceText,
    })
    .from(userEmbeddings)
    .where(
      and(
        ne(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'interest'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )

  // 统计共同兴趣数量
  const userMatchCount = new Map<string, { count: number; commonInterests: string[] }>()

  for (const interest of otherInterests) {
    if (myInterestTexts.includes(interest.sourceText)) {
      const existing = userMatchCount.get(interest.userId) || { count: 0, commonInterests: [] }
      existing.count++
      existing.commonInterests.push(interest.sourceText)
      userMatchCount.set(interest.userId, existing)
    }
  }

  // 按共同兴趣数量排序
  const sortedMatches = Array.from(userMatchCount.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)

  if (sortedMatches.length === 0) {
    return []
  }

  // 获取匹配用户的详细信息
  const matchedUserIds = sortedMatches.map(m => m[0])
  const profiles = await db.query.userProfiles.findMany({
    where: sql`${userProfiles.userId} = ANY(${matchedUserIds})`,
  })

  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, currentUserId),
  })

  // 构建结果
  const results: MatchResult[] = []
  for (const [userId, matchInfo] of sortedMatches) {
    const profile = profiles.find(p => p.userId === userId)
    if (profile) {
      results.push({
        userId: profile.userId,
        name: profile.name,
        age: profile.age,
        city: profile.city || '',
        avatar: profile.avatarUrl || '',
        bio: profile.bio || '',
        interests: profile.interests || [],
        needs: profile.needs || [],
        provide: profile.provide || [],
        similarity: matchInfo.count / Math.max(myInterests.length, 1),
        matchReasons: {
          commonInterests: matchInfo.commonInterests,
          complementaryNeeds: [],
        },
      })
    }
  }

  return results
}

/**
 * 互助合作匹配
 * 查找需求与提供匹配的用户（我的需求 vs 他们的提供）
 *
 * @param currentUserId 当前用户ID
 * @param limit 返回结果数量限制
 * @returns 匹配用户列表
 */
export async function findMutualNeeds(
  currentUserId: string,
  limit: number = 10
): Promise<MatchResult[]> {
  // 获取当前用户的需求向量
  const myNeeds = await db.query.userEmbeddings.findMany({
    where: and(
      eq(userEmbeddings.userId, currentUserId),
      eq(userEmbeddings.embeddingType, 'need'),
      eq(userEmbeddings.embeddingGenerationStatus, 'completed')
    ),
  })

  if (myNeeds.length === 0) {
    return []
  }

  const myNeedTexts = myNeeds.map(e => e.sourceText)

  // 查找其他用户的提供向量
  const otherProvides = await db
    .select({
      userId: userEmbeddings.userId,
      sourceText: userEmbeddings.sourceText,
    })
    .from(userEmbeddings)
    .where(
      and(
        ne(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'provide'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )

  // 统计需求与提供的匹配数量
  const userMatchCount = new Map<string, {
    count: number
    complementaryNeeds: { myNeed: string; theirProvide: string }[]
  }>()

  for (const provide of otherProvides) {
    // 检查是否有匹配的需求（这里使用简单文本匹配，后续用向量相似度）
    const myNeed = myNeedTexts.find(n => n === provide.sourceText)
    if (myNeed) {
      const existing = userMatchCount.get(provide.userId) || {
        count: 0,
        complementaryNeeds: []
      }
      existing.count++
      existing.complementaryNeeds.push({ myNeed, theirProvide: provide.sourceText })
      userMatchCount.set(provide.userId, existing)
    }
  }

  // 按匹配数量排序
  const sortedMatches = Array.from(userMatchCount.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)

  if (sortedMatches.length === 0) {
    return []
  }

  // 获取匹配用户的详细信息
  const matchedUserIds = sortedMatches.map(m => m[0])
  const profiles = await db.query.userProfiles.findMany({
    where: sql`${userProfiles.userId} = ANY(${matchedUserIds})`,
  })

  // 构建结果
  const results: MatchResult[] = []
  for (const [userId, matchInfo] of sortedMatches) {
    const profile = profiles.find(p => p.userId === userId)
    if (profile) {
      results.push({
        userId: profile.userId,
        name: profile.name,
        age: profile.age,
        city: profile.city || '',
        avatar: profile.avatarUrl || '',
        bio: profile.bio || '',
        interests: profile.interests || [],
        needs: profile.needs || [],
        provide: profile.provide || [],
        similarity: matchInfo.count / Math.max(myNeeds.length, 1),
        matchReasons: {
          commonInterests: [],
          complementaryNeeds: matchInfo.complementaryNeeds,
        },
      })
    }
  }

  return results
}

/**
 * 综合匹配
 * 结合兴趣相投和互助合作
 *
 * @param currentUserId 当前用户ID
 * @param limit 返回结果数量限制
 * @returns 匹配用户列表
 */
export async function findComprehensiveMatches(
  currentUserId: string,
  limit: number = 10
): Promise<MatchResult[]> {
  // 同时获取两种匹配结果
  const [similarInterests, mutualNeeds] = await Promise.all([
    findSimilarInterests(currentUserId, limit * 2),
    findMutualNeeds(currentUserId, limit * 2),
  ])

  // 合并并去重
  const userMatchMap = new Map<string, MatchResult>()

  for (const match of similarInterests) {
    const existing = userMatchMap.get(match.userId)
    if (existing) {
      // 合并相似度和匹配原因
      existing.similarity = Math.max(existing.similarity, match.similarity)
      existing.matchReasons.commonInterests = [
        ...existing.matchReasons.commonInterests,
        ...match.matchReasons.commonInterests,
      ]
    } else {
      userMatchMap.set(match.userId, match)
    }
  }

  for (const match of mutualNeeds) {
    const existing = userMatchMap.get(match.userId)
    if (existing) {
      existing.similarity = Math.max(existing.similarity, match.similarity)
      existing.matchReasons.complementaryNeeds = [
        ...existing.matchReasons.complementaryNeeds,
        ...match.matchReasons.complementaryNeeds,
      ]
    } else {
      userMatchMap.set(match.userId, match)
    }
  }

  // 按相似度排序并返回前 N 个
  return Array.from(userMatchMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}
