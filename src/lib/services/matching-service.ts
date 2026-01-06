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
import { eq, and, sql, desc, ne, gt, isNotNull, inArray } from 'drizzle-orm'
import { vectorCosineDistance, calculateAverageVector, cosineDistance } from '@/lib/db/vector'
import type { InterestMatchDetail } from '@/lib/types'

export interface MatchResult {
  // 用户基本信息（用于显示在卡片右侧）
  userId: string
  name: string
  age: number
  city: string
  avatar: string
  bio: string
  interests: string[]
  needs: string[]
  provide: string[]

  // 当前匹配对的详细信息（必填，用于显示在卡片左侧）
  matchDetail: InterestMatchDetail

  // 相似度（与 matchDetail.similarityPercent/100 一致）
  similarity: number

  // 保留用于向后兼容
  matchReasons?: {
    commonInterests: string[]
    complementaryNeeds: { myNeed: string; theirProvide: string }[]
  }
}

// 每个兴趣搜索前 N 个最相似的结果（可调整）
const TOP_N_PER_INTEREST = 10

/**
 * 搜索相似的兴趣向量
 * @param vector 兴趣向量
 * @param myInterestText 我的兴趣文本
 * @param currentUserId 当前用户ID
 * @param limit 返回结果数量限制
 * @returns 匹配结果数组
 */
async function searchSimilarInterests(
  vector: number[],
  myInterestText: string,
  currentUserId: string,
  limit: number
): Promise<Array<{ userId: string; match: InterestMatchDetail }>> {
  const vectorStr = JSON.stringify(vector)
  const query = sql`
    SELECT
      user_id,
      source_text,
      embedding <=> ${vectorStr}::vector as distance
    FROM user_embeddings
    WHERE user_id != ${currentUserId}
      AND embedding_type = 'interest'
      AND embedding_generation_status = 'completed'
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorStr}::vector ASC
    LIMIT ${limit}
  `

  const result = await db.execute(query)

  return result.rows.map(row => {
    const distance = row.distance as number
    // 新公式：余弦距离 0 → 100%, 1 → 0%, 2 → -100%
    const similarityPercent = (1 - distance) * 100

    return {
      userId: row.user_id as string,
      match: {
        myInterest: myInterestText,
        theirInterest: row.source_text as string,
        similarityPercent
      }
    }
  })
}

/**
 * 兴趣相投匹配（使用向量相似度搜索）
 * 查找与当前用户兴趣相似的其他用户
 *
 * 算法：
 * 1. 分别用每个兴趣向量搜索最相似的兴趣
 * 2. 合并所有结果，按用户聚合
 * 3. 取每个用户最高的相似度
 * 4. 按相似度排序返回
 *
 * @param currentUserId 当前用户ID
 * @param limit 返回结果数量限制
 * @returns 匹配用户列表
 */
export async function findSimilarInterests(
  currentUserId: string,
  limit: number = 10
): Promise<MatchResult[]> {
  // 1. 获取当前用户的所有兴趣向量
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

  // 2. 过滤出有效向量
  const validInterests = myInterests.filter(e => e.embedding !== null)

  if (validInterests.length === 0) {
    // 如果没有向量，使用文本匹配作为降级方案
    return findSimilarInterestsByText(currentUserId, myInterests.map(e => e.sourceText), limit)
  }

  console.log(`[匹配算法] 当前用户有 ${validInterests.length} 个兴趣向量`)
  console.log(`[匹配算法] 兴趣列表:`, validInterests.map(e => e.sourceText))

  // 3. 所有匹配结果（不去重）
  const allMatches: Array<{
    userId: string
    match: InterestMatchDetail
  }> = []

  // 4. 对每个兴趣独立搜索
  for (const myInterest of validInterests) {
    console.log(`[匹配算法] 正在搜索兴趣: "${myInterest.sourceText}"...`)
    const matches = await searchSimilarInterests(
      myInterest.embedding as number[],
      myInterest.sourceText,
      currentUserId,
      TOP_N_PER_INTEREST
    )
    console.log(`[匹配算法] 找到 ${matches.length} 个匹配`)
    allMatches.push(...matches)
  }

  console.log(`[匹配算法] 总共找到 ${allMatches.length} 个兴趣匹配结果`)

  // 5. 按相似度从高到低排序（不删除重复用户）
  allMatches.sort((a, b) => b.match.similarityPercent - a.match.similarityPercent)

  // 6. 取前 limit 个匹配结果（同一个用户可能出现多次）
  const sortedMatches = allMatches.slice(0, limit)

  console.log(`[匹配算法] 返回前 ${sortedMatches.length} 个匹配结果（不删除重复用户）`)

  // 输出详细日志
  console.log(`[匹配详情] 前5个匹配:`)
  sortedMatches.slice(0, 5).forEach((m, idx) => {
    console.log(`  ${idx + 1}. 用户ID: ${m.userId.slice(0, 8)}...`)
    console.log(`     匹配: "${m.match.myInterest}" ↔ "${m.match.theirInterest}": ${m.match.similarityPercent.toFixed(1)}%`)
  })

  if (sortedMatches.length === 0) {
    return []
  }

  // 7. 查询用户详细信息（去重）
  const uniqueUserIds = Array.from(new Set(sortedMatches.map(m => m.userId)))
  const profiles = await db
    .select()
    .from(userProfiles)
    .where(inArray(userProfiles.userId, uniqueUserIds))

  // 8. 构建最终结果（每个匹配都是独立的卡片）
  const results: MatchResult[] = []
  for (const { userId, match } of sortedMatches) {
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
        similarity: match.similarityPercent / 100, // 转换回 0-1 范围
        matchDetail: match, // 当前匹配对的详细信息
        matchReasons: {
          commonInterests: [match.theirInterest],
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
    .where(inArray(userProfiles.userId, matchedUserIds))

  // 构建结果（每个匹配对都是独立的卡片）
  const results: MatchResult[] = []
  for (const [userId, matchInfo] of sortedMatches) {
    const profile = profiles.find(p => p.userId === userId)
    if (profile) {
      // 为每个共同兴趣创建一个匹配卡片
      for (const commonInterest of matchInfo.commonInterests) {
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
          matchDetail: {
            myInterest: commonInterest,
            theirInterest: commonInterest,
            similarityPercent: (matchInfo.count / Math.max(myInterestTexts.length, 1)) * 100,
          },
          matchReasons: {
            commonInterests: matchInfo.commonInterests,
            complementaryNeeds: [],
          },
        })
      }
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

  // 使用原始 SQL 进行向量搜索：我的需求 vs 他们的提供
  const vectorStr = JSON.stringify(avgNeedVector)
  const matches = await db.execute(sql`
    SELECT
      user_id,
      source_text,
      embedding <=> ${vectorStr}::vector as distance
    FROM user_embeddings
    WHERE user_id != ${currentUserId}
      AND embedding_type = 'provide'
      AND embedding_generation_status = 'completed'
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limit * 3}
  `)

  // 按用户聚合并计算平均距离，同时记录每个提供文本的距离
  const userDistanceMap = new Map<string, {
    distance: number
    count: number
    texts: string[]
    provideDistances: Array<{ text: string; distance: number }>
  }>()

  for (const row of matches.rows) {
    const userId = row.user_id as string
    const sourceText = row.source_text as string
    const distance = row.distance as number

    const existing = userDistanceMap.get(userId) || {
      distance: 0,
      count: 0,
      texts: [],
      provideDistances: []
    }
    existing.distance += distance ?? 0
    existing.count++
    existing.texts.push(sourceText)
    existing.provideDistances.push({ text: sourceText, distance: distance ?? 0 })
    userDistanceMap.set(userId, existing)
  }

  // 计算每个用户的平均相似度
  const sortedMatches = Array.from(userDistanceMap.entries())
    .map(([userId, data]) => ({
      userId,
      avgDistance: data.distance / data.count,
      provideTexts: data.texts,
      provideDistances: data.provideDistances,
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
    .where(inArray(userProfiles.userId, matchedUserIds))

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

      // 生成 bestMatch
      let bestMatch: { myInterest: string; theirInterest: string; similarityPercent: number }
      if (complementaryNeeds.length > 0) {
        // 有精确文本匹配，使用第一个
        bestMatch = {
          myInterest: complementaryNeeds[0].myNeed,
          theirInterest: complementaryNeeds[0].theirProvide,
          similarityPercent: match.similarity * 100,
        }
      } else {
        // 无精确匹配：找到语义上最匹配的需求-提供对
        // 获取该用户的提供向量，与我的每个需求向量计算距离
        const theirProvides = await db
          .select()
          .from(userEmbeddings)
          .where(
            and(
              eq(userEmbeddings.userId, match.userId),
              eq(userEmbeddings.embeddingType, 'provide'),
              eq(userEmbeddings.embeddingGenerationStatus, 'completed')
            )
          )

        let bestPair: { myNeed: string; theirProvide: string; distance: number } | null = null

        // 遍历我的需求向量和他们的提供向量，找最小距离
        for (const myNeed of myNeeds) {
          if (!myNeed.embedding) continue
          for (const theirProvide of theirProvides) {
            if (!theirProvide.embedding) continue
            const distance = cosineDistance(myNeed.embedding, theirProvide.embedding)
            if (!bestPair || distance < bestPair.distance) {
              bestPair = {
                myNeed: myNeed.sourceText,
                theirProvide: theirProvide.sourceText,
                distance
              }
            }
          }
        }

        bestMatch = {
          myInterest: bestPair?.myNeed || myNeedTexts[0] || '需求',
          theirInterest: bestPair?.theirProvide || match.provideTexts[0] || '提供',
          similarityPercent: match.similarity * 100,
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
        matchDetail: bestMatch, // 当前匹配对的详细信息
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
    .where(inArray(userProfiles.userId, matchedUserIds))

  // 构建结果（每个匹配对都是独立的卡片）
  const results: MatchResult[] = []
  for (const [userId, matchInfo] of sortedMatches) {
    const profile = profiles.find(p => p.userId === userId)
    if (profile) {
      // 为每个需求-提供匹配对创建一个卡片
      for (const { myNeed, theirProvide } of matchInfo.complementaryNeeds) {
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
          matchDetail: {
            myInterest: myNeed,
            theirInterest: theirProvide,
            similarityPercent: 50, // 文本匹配的默认相似度
          },
          matchReasons: {
            commonInterests: [],
            complementaryNeeds: matchInfo.complementaryNeeds,
          },
        })
      }
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
      // 合并相似度
      existing.similarity = Math.max(existing.similarity, match.similarity)
      // 确保 matchReasons 存在
      if (!existing.matchReasons) {
        existing.matchReasons = { commonInterests: [], complementaryNeeds: [] }
      }
      if (!match.matchReasons) {
        match.matchReasons = { commonInterests: [], complementaryNeeds: [] }
      }
      // 合并匹配原因
      existing.matchReasons.commonInterests = [
        ...existing.matchReasons.commonInterests,
        ...(match.matchReasons.commonInterests || []),
      ]
    } else {
      userMatchMap.set(match.userId, match)
    }
  }

  for (const match of mutualNeeds) {
    const existing = userMatchMap.get(match.userId)
    if (existing) {
      // 合并相似度
      existing.similarity = Math.max(existing.similarity, match.similarity)
      // 确保 matchReasons 存在
      if (!existing.matchReasons) {
        existing.matchReasons = { commonInterests: [], complementaryNeeds: [] }
      }
      if (!match.matchReasons) {
        match.matchReasons = { commonInterests: [], complementaryNeeds: [] }
      }
      // 合并匹配原因
      existing.matchReasons.complementaryNeeds = [
        ...existing.matchReasons.complementaryNeeds,
        ...(match.matchReasons.complementaryNeeds || []),
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

  // 使用原始 SQL 进行向量搜索，找距离最远的（最不相似的）
  const vectorStr = JSON.stringify(avgInterestVector)
  const matches = await db.execute(sql`
    SELECT
      user_id,
      source_text,
      embedding <=> ${vectorStr}::vector as distance
    FROM user_embeddings
    WHERE user_id != ${currentUserId}
      AND embedding_type = 'interest'
      AND embedding_generation_status = 'completed'
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorStr}::vector DESC
    LIMIT ${limit * 3}
  `)

  // 按用户聚合并计算平均距离
  const userDistanceMap = new Map<string, {
    distance: number
    count: number
    texts: string[]
  }>()

  for (const row of matches.rows) {
    const userId = row.user_id as string
    const sourceText = row.source_text as string
    const distance = row.distance as number

    const existing = userDistanceMap.get(userId) || {
      distance: 0,
      count: 0,
      texts: []
    }
    existing.distance += distance ?? 0
    existing.count++
    existing.texts.push(sourceText)
    userDistanceMap.set(userId, existing)
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
    .where(inArray(userProfiles.userId, matchedUserIds))

  // 构建结果
  const results: MatchResult[] = []
  for (const match of sortedMatches) {
    const profile = profiles.find(p => p.userId === match.userId)
    if (profile) {
      // 生成 bestMatch（探索发现：找出最不相似的兴趣）
      const bestMatch = {
        myInterest: myInterests[0]?.sourceText || '兴趣',
        theirInterest: match.differentInterests[0] || '兴趣',
        similarityPercent: match.similarity * 100, // 探索发现的相似度会较低
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
        similarity: match.similarity, // 这里的相似度会很低
        matchDetail: bestMatch, // 当前匹配对的详细信息
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

  // 使用原始 SQL 进行向量搜索：我的提供 vs 他们的需求
  const vectorStr = JSON.stringify(avgProvideVector)
  const matches = await db.execute(sql`
    SELECT
      user_id,
      source_text,
      embedding <=> ${vectorStr}::vector as distance
    FROM user_embeddings
    WHERE user_id != ${currentUserId}
      AND embedding_type = 'need'
      AND embedding_generation_status = 'completed'
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limit * 3}
  `)

  // 按用户聚合并计算平均距离，同时记录每个需求文本的距离
  const userDistanceMap = new Map<string, {
    distance: number
    count: number
    texts: string[]
    needDistances: Array<{ text: string; distance: number }>
  }>()

  for (const row of matches.rows) {
    const userId = row.user_id as string
    const sourceText = row.source_text as string
    const distance = row.distance as number

    const existing = userDistanceMap.get(userId) || {
      distance: 0,
      count: 0,
      texts: [],
      needDistances: []
    }
    existing.distance += distance ?? 0
    existing.count++
    existing.texts.push(sourceText)
    existing.needDistances.push({ text: sourceText, distance: distance ?? 0 })
    userDistanceMap.set(userId, existing)
  }

  // 计算每个用户的平均相似度
  const sortedMatches = Array.from(userDistanceMap.entries())
    .map(([userId, data]) => ({
      userId,
      avgDistance: data.distance / data.count,
      needTexts: data.texts,
      needDistances: data.needDistances,
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
    .where(inArray(userProfiles.userId, matchedUserIds))

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

      // 生成 bestMatch
      let bestMatch: { myInterest: string; theirInterest: string; similarityPercent: number }
      if (complementaryNeeds.length > 0) {
        // 有精确文本匹配，使用第一个
        bestMatch = {
          myInterest: complementaryNeeds[0].myNeed,
          theirInterest: complementaryNeeds[0].theirProvide,
          similarityPercent: match.similarity * 100,
        }
      } else {
        // 无精确匹配：找到语义上最匹配的提供-需求对
        // 获取该用户的需求向量，与我的每个提供向量计算距离
        const theirNeeds = await db
          .select()
          .from(userEmbeddings)
          .where(
            and(
              eq(userEmbeddings.userId, match.userId),
              eq(userEmbeddings.embeddingType, 'need'),
              eq(userEmbeddings.embeddingGenerationStatus, 'completed')
            )
          )

        let bestPair: { myProvide: string; theirNeed: string; distance: number } | null = null

        // 遍历我的提供向量和他们的需求向量，找最小距离
        for (const myProvide of myProvides) {
          if (!myProvide.embedding) continue
          for (const theirNeed of theirNeeds) {
            if (!theirNeed.embedding) continue
            const distance = cosineDistance(myProvide.embedding, theirNeed.embedding)
            if (!bestPair || distance < bestPair.distance) {
              bestPair = {
                myProvide: myProvide.sourceText,
                theirNeed: theirNeed.sourceText,
                distance
              }
            }
          }
        }

        bestMatch = {
          myInterest: bestPair?.myProvide || myProvideTexts[0] || '提供',
          theirInterest: bestPair?.theirNeed || match.needTexts[0] || '需求',
          similarityPercent: match.similarity * 100,
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
        matchDetail: bestMatch, // 当前匹配对的详细信息
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
    .where(inArray(userProfiles.userId, matchedUserIds))

  // 构建结果（每个匹配对都是独立的卡片）
  const results: MatchResult[] = []
  for (const [userId, matchInfo] of sortedMatches) {
    const profile = profiles.find(p => p.userId === userId)
    if (profile) {
      // 为每个提供-需求匹配对创建一个卡片
      for (const { myNeed, theirProvide } of matchInfo.complementaryNeeds) {
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
          matchDetail: {
            myInterest: theirProvide,
            theirInterest: myNeed,
            similarityPercent: 50, // 文本匹配的默认相似度
          },
          matchReasons: {
            commonInterests: [],
            complementaryNeeds: matchInfo.complementaryNeeds,
          },
        })
      }
    }
  }

  return results
}
