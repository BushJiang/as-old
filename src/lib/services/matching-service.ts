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
import { vectorCosineDistance, calculateAverageVector } from '@/lib/db/vector'

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
 * 兴趣相投匹配（使用向量相似度搜索）
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
  const myInterests = await db
    .select()
    .from(userEmbeddings)
    .where(
      and(
        eq(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'interest'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )

  if (myInterests.length === 0) {
    return []
  }

  // 计算平均兴趣向量
  const interestVectors = myInterests
    .filter(e => e.embedding !== null)
    .map(e => e.embedding as number[])

  if (interestVectors.length === 0) {
    // 如果没有向量，使用文本匹配作为降级方案
    return findSimilarInterestsByText(currentUserId, myInterests.map(e => e.sourceText), limit)
  }

  const avgVector = calculateAverageVector(interestVectors)

  // 使用余弦距离进行向量搜索
  const matches = await db
    .select({
      userId: userEmbeddings.userId,
      sourceText: userEmbeddings.sourceText,
      distance: vectorCosineDistance(userEmbeddings.embedding, avgVector),
    })
    .from(userEmbeddings)
    .where(
      and(
        ne(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'interest'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )
    .orderBy(vectorCosineDistance(userEmbeddings.embedding, avgVector))
    .limit(limit * 3) // 获取更多结果，因为需要按用户聚合

  // 按用户聚合并计算平均距离
  const userDistanceMap = new Map<string, { distance: number; count: number; texts: string[] }>()

  for (const match of matches) {
    const existing = userDistanceMap.get(match.userId) || { distance: 0, count: 0, texts: [] }
    existing.distance += (match.distance as number) ?? 0
    existing.count++
    existing.texts.push(match.sourceText)
    userDistanceMap.set(match.userId, existing)
  }

  // 计算每个用户的平均相似度
  const sortedMatches = Array.from(userDistanceMap.entries())
    .map(([userId, data]) => ({
      userId,
      avgDistance: data.distance / data.count,
      commonInterests: data.texts,
      similarity: 1 - data.distance / data.count, // 余弦距离转相似度
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  if (sortedMatches.length === 0) {
    return []
  }

  // 获取匹配用户的详细信息
  const matchedUserIds = sortedMatches.map(m => m.userId)
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(sql`${userProfiles.userId} = ANY(${matchedUserIds})`)

  // 获取当前用户的兴趣文本
  const myInterestTexts = myInterests.map(e => e.sourceText)

  // 构建结果
  const results: MatchResult[] = []
  for (const match of sortedMatches) {
    const profile = profiles.find(p => p.userId === match.userId)
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
        similarity: match.similarity,
        matchReasons: {
          commonInterests: match.commonInterests.filter(t => myInterestTexts.includes(t)),
          complementaryNeeds: [],
        },
      })
    }
  }

  return results
}

/**
 * 兴趣相投匹配（文本匹配降级方案）
 */
async function findSimilarInterestsByText(
  currentUserId: string,
  myInterestTexts: string[],
  limit: number
): Promise<MatchResult[]> {
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
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(sql`${userProfiles.userId} = ANY(${matchedUserIds})`)

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
        similarity: matchInfo.count / Math.max(myInterestTexts.length, 1),
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
 * 互助合作匹配（向量匹配）
 * 查找需求与提供匹配的用户（我的需求向量 vs 他们的提供向量）
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
  const myNeeds = await db
    .select()
    .from(userEmbeddings)
    .where(
      and(
        eq(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'need'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )

  if (myNeeds.length === 0) {
    return []
  }

  // 提取向量并计算平均需求向量
  const needVectors = myNeeds
    .filter(e => e.embedding !== null)
    .map(e => e.embedding as number[])

  if (needVectors.length === 0) {
    // 如果没有向量，使用文本匹配作为降级方案
    return findMutualNeedsByText(currentUserId, myNeeds.map(e => e.sourceText), limit)
  }

  const avgNeedVector = calculateAverageVector(needVectors)

  // 使用余弦距离进行向量搜索：我的需求 vs 他们的提供
  const matches = await db
    .select({
      userId: userEmbeddings.userId,
      sourceText: userEmbeddings.sourceText,
      distance: vectorCosineDistance(userEmbeddings.embedding, avgNeedVector),
    })
    .from(userEmbeddings)
    .where(
      and(
        ne(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'provide'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )
    .orderBy(vectorCosineDistance(userEmbeddings.embedding, avgNeedVector))
    .limit(limit * 3) // 获取更多结果，因为需要按用户聚合

  // 按用户聚合并计算平均距离
  const userDistanceMap = new Map<string, {
    distance: number
    count: number
    texts: string[]
  }>()

  for (const match of matches) {
    const existing = userDistanceMap.get(match.userId) || {
      distance: 0,
      count: 0,
      texts: []
    }
    existing.distance += (match.distance as number) ?? 0
    existing.count++
    existing.texts.push(match.sourceText)
    userDistanceMap.set(match.userId, existing)
  }

  // 计算每个用户的平均相似度
  const sortedMatches = Array.from(userDistanceMap.entries())
    .map(([userId, data]) => ({
      userId,
      avgDistance: data.distance / data.count,
      provideTexts: data.texts,
      similarity: 1 - data.distance / data.count, // 余弦距离转相似度
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  if (sortedMatches.length === 0) {
    return []
  }

  // 获取匹配用户的详细信息
  const matchedUserIds = sortedMatches.map(m => m.userId)
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(sql`${userProfiles.userId} = ANY(${matchedUserIds})`)

  // 获取当前用户的需求文本（用于显示匹配原因）
  const myNeedTexts = myNeeds.map(e => e.sourceText)

  // 构建结果
  const results: MatchResult[] = []
  for (const match of sortedMatches) {
    const profile = profiles.find(p => p.userId === match.userId)
    if (profile) {
      // 构建互补需求对（简单匹配：如果需求文本和提供文本相同）
      const complementaryNeeds: { myNeed: string; theirProvide: string }[] = []
      for (const needText of myNeedTexts) {
        if (match.provideTexts.includes(needText)) {
          complementaryNeeds.push({ myNeed: needText, theirProvide: needText })
        }
      }

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
        similarity: match.similarity,
        matchReasons: {
          commonInterests: [],
          complementaryNeeds,
        },
      })
    }
  }

  return results
}

/**
 * 互助合作匹配（文本匹配降级方案）
 */
async function findMutualNeedsByText(
  currentUserId: string,
  myNeedTexts: string[],
  limit: number
): Promise<MatchResult[]> {
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
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(sql`${userProfiles.userId} = ANY(${matchedUserIds})`)

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
        similarity: matchInfo.count / Math.max(myNeedTexts.length, 1),
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

/**
 * 探索发现匹配（反向推荐）
 * 查找兴趣最不相似的用户，打破信息茧房
 *
 * @param currentUserId 当前用户ID
 * @param limit 返回结果数量限制
 * @returns 匹配用户列表
 */
export async function findExploratoryDiscovery(
  currentUserId: string,
  limit: number = 10
): Promise<MatchResult[]> {
  // 获取当前用户的兴趣向量
  const myInterests = await db
    .select()
    .from(userEmbeddings)
    .where(
      and(
        eq(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'interest'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )

  if (myInterests.length === 0) {
    return []
  }

  // 提取向量并计算平均兴趣向量
  const interestVectors = myInterests
    .filter(e => e.embedding !== null)
    .map(e => e.embedding as number[])

  if (interestVectors.length === 0) {
    // 如果没有向量，返回空结果（探索发现必须基于向量）
    return []
  }

  const avgInterestVector = calculateAverageVector(interestVectors)

  // 使用余弦距离进行向量搜索，找距离最远的（最不相似的）
  const matches = await db
    .select({
      userId: userEmbeddings.userId,
      sourceText: userEmbeddings.sourceText,
      distance: vectorCosineDistance(userEmbeddings.embedding, avgInterestVector),
    })
    .from(userEmbeddings)
    .where(
      and(
        ne(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'interest'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )
    .orderBy(sql`vector_cosine_distance(${userEmbeddings.embedding}, ${avgInterestVector}) DESC`) // 降序：距离最远的在前
    .limit(limit * 3)

  // 按用户聚合并计算平均距离
  const userDistanceMap = new Map<string, {
    distance: number
    count: number
    texts: string[]
  }>()

  for (const match of matches) {
    const existing = userDistanceMap.get(match.userId) || {
      distance: 0,
      count: 0,
      texts: []
    }
    existing.distance += (match.distance as number) ?? 0
    existing.count++
    existing.texts.push(match.sourceText)
    userDistanceMap.set(match.userId, existing)
  }

  // 计算每个用户的平均相似度（注意：这里相似度低是好事）
  const sortedMatches = Array.from(userDistanceMap.entries())
    .map(([userId, data]) => ({
      userId,
      avgDistance: data.distance / data.count,
      differentInterests: data.texts,
      similarity: 1 - data.distance / data.count, // 余弦距离转相似度（这个值会很小）
    }))
    .sort((a, b) => a.similarity - b.similarity) // 升序：相似度最低的在前
    .slice(0, limit)

  if (sortedMatches.length === 0) {
    return []
  }

  // 获取匹配用户的详细信息
  const matchedUserIds = sortedMatches.map(m => m.userId)
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(sql`${userProfiles.userId} = ANY(${matchedUserIds})`)

  // 构建结果
  const results: MatchResult[] = []
  for (const match of sortedMatches) {
    const profile = profiles.find(p => p.userId === match.userId)
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
        similarity: match.similarity, // 这里的相似度会很低
        matchReasons: {
          commonInterests: [], // 探索发现没有共同兴趣
          complementaryNeeds: [],
        },
      })
    }
  }

  return results
}

/**
 * 互助合作匹配（我的提供 vs 他们的需求）
 * 与 findMutualNeeds 相反的方向
 *
 * @param currentUserId 当前用户ID
 * @param limit 返回结果数量限制
 * @returns 匹配用户列表
 */
export async function findMutualProvide(
  currentUserId: string,
  limit: number = 10
): Promise<MatchResult[]> {
  // 获取当前用户的提供向量
  const myProvides = await db
    .select()
    .from(userEmbeddings)
    .where(
      and(
        eq(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'provide'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )

  if (myProvides.length === 0) {
    return []
  }

  // 提取向量并计算平均提供向量
  const provideVectors = myProvides
    .filter(e => e.embedding !== null)
    .map(e => e.embedding as number[])

  if (provideVectors.length === 0) {
    // 如果没有向量，使用文本匹配作为降级方案
    return findMutualProvideByText(currentUserId, myProvides.map(e => e.sourceText), limit)
  }

  const avgProvideVector = calculateAverageVector(provideVectors)

  // 使用余弦距离进行向量搜索：我的提供 vs 他们的需求
  const matches = await db
    .select({
      userId: userEmbeddings.userId,
      sourceText: userEmbeddings.sourceText,
      distance: vectorCosineDistance(userEmbeddings.embedding, avgProvideVector),
    })
    .from(userEmbeddings)
    .where(
      and(
        ne(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'need'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )
    .orderBy(vectorCosineDistance(userEmbeddings.embedding, avgProvideVector))
    .limit(limit * 3)

  // 按用户聚合并计算平均距离
  const userDistanceMap = new Map<string, {
    distance: number
    count: number
    texts: string[]
  }>()

  for (const match of matches) {
    const existing = userDistanceMap.get(match.userId) || {
      distance: 0,
      count: 0,
      texts: []
    }
    existing.distance += (match.distance as number) ?? 0
    existing.count++
    existing.texts.push(match.sourceText)
    userDistanceMap.set(match.userId, existing)
  }

  // 计算每个用户的平均相似度
  const sortedMatches = Array.from(userDistanceMap.entries())
    .map(([userId, data]) => ({
      userId,
      avgDistance: data.distance / data.count,
      needTexts: data.texts,
      similarity: 1 - data.distance / data.count,
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  if (sortedMatches.length === 0) {
    return []
  }

  // 获取匹配用户的详细信息
  const matchedUserIds = sortedMatches.map(m => m.userId)
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(sql`${userProfiles.userId} = ANY(${matchedUserIds})`)

  // 获取当前用户的提供文本
  const myProvideTexts = myProvides.map(e => e.sourceText)

  // 构建结果
  const results: MatchResult[] = []
  for (const match of sortedMatches) {
    const profile = profiles.find(p => p.userId === match.userId)
    if (profile) {
      // 构建互补需求对
      const complementaryNeeds: { myNeed: string; theirProvide: string }[] = []
      for (const provideText of myProvideTexts) {
        if (match.needTexts.includes(provideText)) {
          complementaryNeeds.push({ myNeed: provideText, theirProvide: provideText })
        }
      }

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
        similarity: match.similarity,
        matchReasons: {
          commonInterests: [],
          complementaryNeeds,
        },
      })
    }
  }

  return results
}

/**
 * 互助合作匹配（文本匹配降级方案）
 */
async function findMutualProvideByText(
  currentUserId: string,
  myProvideTexts: string[],
  limit: number
): Promise<MatchResult[]> {
  // 查找其他用户的需求向量
  const otherNeeds = await db
    .select({
      userId: userEmbeddings.userId,
      sourceText: userEmbeddings.sourceText,
    })
    .from(userEmbeddings)
    .where(
      and(
        ne(userEmbeddings.userId, currentUserId),
        eq(userEmbeddings.embeddingType, 'need'),
        eq(userEmbeddings.embeddingGenerationStatus, 'completed')
      )
    )

  // 统计提供与需求的匹配数量
  const userMatchCount = new Map<string, {
    count: number
    complementaryNeeds: { myNeed: string; theirProvide: string }[]
  }>()

  for (const need of otherNeeds) {
    const myProvide = myProvideTexts.find(p => p === need.sourceText)
    if (myProvide) {
      const existing = userMatchCount.get(need.userId) || {
        count: 0,
        complementaryNeeds: []
      }
      existing.count++
      existing.complementaryNeeds.push({ myNeed: need.sourceText, theirProvide: myProvide })
      userMatchCount.set(need.userId, existing)
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
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(sql`${userProfiles.userId} = ANY(${matchedUserIds})`)

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
        similarity: matchInfo.count / Math.max(myProvideTexts.length, 1),
        matchReasons: {
          commonInterests: [],
          complementaryNeeds: matchInfo.complementaryNeeds,
        },
      })
    }
  }

  return results
}
