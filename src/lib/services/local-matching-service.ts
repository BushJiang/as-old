/**
 * 本地向量匹配服务
 *
 * 功能：
 * 1. 从本地数据读取用户
 * 2. 调用嵌入 API 生成向量
 * 3. 计算余弦相似度
 * 4. 返回匹配结果
 */

import type { User, MatchResult } from '@/lib/types'

// ============================================================================
// 1. 嵌入生成（调用硅基流动 API）
// ============================================================================

interface EmbeddingRequest {
  input: string[]
  model: string
  encoding_format: 'float'
}

interface EmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

/**
 * 调用本地 API 路由生成嵌入向量
 * 通过服务器端调用硅基流动 API，避免暴露 API key
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch('/api/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ texts }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '嵌入生成失败')
  }

  const data = await response.json()
  return data.embeddings
}

/**
 * 生成用户的所有嵌入向量
 */
async function generateUserEmbeddings(user: User): Promise<{
  interestEmbeddings: number[][]
  needEmbeddings: number[][]
  provideEmbeddings: number[][]
}> {
  const [interestEmbeddings, needEmbeddings, provideEmbeddings] = await Promise.all([
    generateEmbeddings(user.interests),
    generateEmbeddings(user.needs),
    generateEmbeddings(user.provide),
  ])

  return {
    interestEmbeddings,
    needEmbeddings,
    provideEmbeddings,
  }
}

// ============================================================================
// 2. 向量运算（余弦相似度）
// ============================================================================

/**
 * 计算两个向量的余弦相似度
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('向量长度不匹配')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * 向量池平均（将多个向量合并为一个）
 */
function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) {
    return []
  }

  const dimension = vectors[0].length
  const result = new Array(dimension).fill(0)

  for (const vec of vectors) {
    for (let i = 0; i < dimension; i++) {
      result[i] += vec[i]
    }
  }

  for (let i = 0; i < dimension; i++) {
    result[i] /= vectors.length
  }

  return result
}

// ============================================================================
// 3. 匹配算法
// ============================================================================

interface UserWithEmbeddings extends User {
  interestEmbeddings: number[][]
  needEmbeddings: number[][]
  provideEmbeddings: number[][]
}

/**
 * 计算两个用户的匹配度
 */
function calculateMatch(
  userA: UserWithEmbeddings,
  userB: UserWithEmbeddings,
  mode: 'similar-interests' | 'mutual-needs' | 'mutual-provide' | 'exploratory-discovery' | 'comprehensive'
): { score: number; myInterest: string; theirInterest: string } {
  let similarities: number[] = []
  let myInterest = ''
  let theirInterest = ''

  switch (mode) {
    case 'similar-interests': {
      // 计算兴趣相似度
      const interestSims: number[] = []
      for (const embA of userA.interestEmbeddings) {
        for (const embB of userB.interestEmbeddings) {
          interestSims.push(cosineSimilarity(embA, embB))
        }
      }
      similarities = interestSims

      // 找到最匹配的兴趣对
      if (userA.interests.length > 0 && userB.interests.length > 0) {
        myInterest = userA.interests[0]
        theirInterest = userB.interests[0]
      }
      break
    }

    case 'mutual-needs': {
      // 我的需求 vs 他们的提供（找能帮助我的人）
      const needProvideSims: number[] = []
      for (const needEmb of userA.needEmbeddings) {
        for (const provideEmb of userB.provideEmbeddings) {
          needProvideSims.push(cosineSimilarity(needEmb, provideEmb))
        }
      }

      similarities = needProvideSims

      if (userA.needs.length > 0 && userB.provide.length > 0) {
        myInterest = userA.needs[0]
        theirInterest = userB.provide[0]
      }
      break
    }

    case 'mutual-provide': {
      // 我的提供 vs 他们的需求（我能帮助谁）
      const provideNeedSims: number[] = []
      for (const provideEmb of userA.provideEmbeddings) {
        for (const needEmb of userB.needEmbeddings) {
          provideNeedSims.push(cosineSimilarity(provideEmb, needEmb))
        }
      }

      similarities = provideNeedSims

      if (userA.provide.length > 0 && userB.needs.length > 0) {
        myInterest = userA.provide[0]
        theirInterest = userB.needs[0]
      }
      break
    }

    case 'exploratory-discovery': {
      // 综合所有向量的相似度
      const allVecsA = [
        ...userA.interestEmbeddings,
        ...userA.needEmbeddings,
        ...userA.provideEmbeddings,
      ]
      const allVecsB = [
        ...userB.interestEmbeddings,
        ...userB.needEmbeddings,
        ...userB.provideEmbeddings,
      ]

      for (const embA of allVecsA) {
        for (const embB of allVecsB) {
          similarities.push(cosineSimilarity(embA, embB))
        }
      }

      if (userA.interests.length > 0 && userB.interests.length > 0) {
        myInterest = userA.interests[0]
        theirInterest = userB.interests[0]
      }
      break
    }

    default: {
      // comprehensive: 综合所有维度
      const allSims: number[] = []

      // 兴趣相似度
      for (const embA of userA.interestEmbeddings) {
        for (const embB of userB.interestEmbeddings) {
          allSims.push(cosineSimilarity(embA, embB))
        }
      }

      // 需求匹配度
      for (const needEmb of userA.needEmbeddings) {
        for (const provideEmb of userB.provideEmbeddings) {
          allSims.push(cosineSimilarity(needEmb, provideEmb))
        }
      }

      similarities = allSims

      if (userA.interests.length > 0 && userB.interests.length > 0) {
        myInterest = userA.interests[0]
        theirInterest = userB.interests[0]
      }
      break
    }
  }

  // 计算平均相似度
  const avgSimilarity =
    similarities.length > 0
      ? similarities.reduce((sum, s) => sum + s, 0) / similarities.length
      : 0

  return {
    score: avgSimilarity,
    myInterest,
    theirInterest,
  }
}

// ============================================================================
// 4. 主匹配函数
// ============================================================================

export async function matchUsersLocal(
  currentUser: User,
  candidateUsers: User[],
  mode: 'similar-interests' | 'mutual-needs' | 'mutual-provide' | 'exploratory-discovery' | 'comprehensive' = 'comprehensive',
  limit: number = 20
): Promise<MatchResult[]> {
  console.log('='.repeat(80))
  console.log('开始本地向量匹配计算')
  console.log('='.repeat(80))
  console.log('当前用户:', currentUser.name)
  console.log('候选用户数:', candidateUsers.length)
  console.log('匹配模式:', mode)

  // 步骤 1: 生成当前用户的嵌入向量
  console.log('\n[1/3] 生成当前用户的嵌入向量...')
  const currentUserEmbeddings = await generateUserEmbeddings(currentUser)
  console.log(`  ✓ 兴趣: ${currentUserEmbeddings.interestEmbeddings.length} 个向量`)
  console.log(`  ✓ 需求: ${currentUserEmbeddings.needEmbeddings.length} 个向量`)
  console.log(`  ✓ 提供: ${currentUserEmbeddings.provideEmbeddings.length} 个向量`)

  // 步骤 2: 生成候选用户的嵌入向量并计算匹配度
  console.log('\n[2/3] 生成候选用户的嵌入向量并计算匹配度...')

  const userWithEmbeddings: UserWithEmbeddings = {
    ...currentUser,
    ...currentUserEmbeddings,
  }

  const matches: Array<{
    user: User
    score: number
    myInterest: string
    theirInterest: string
  }> = []

  for (let i = 0; i < candidateUsers.length; i++) {
    const candidate = candidateUsers[i]
    console.log(`  处理候选用户 ${i + 1}/${candidateUsers.length}: ${candidate.name}...`)

    // 生成候选用户的嵌入向量
    const candidateEmbeddings = await generateUserEmbeddings(candidate)

    const candidateWithEmbeddings: UserWithEmbeddings = {
      ...candidate,
      ...candidateEmbeddings,
    }

    // 计算匹配度
    const matchResult = calculateMatch(userWithEmbeddings, candidateWithEmbeddings, mode)
    console.log(`    相似度: ${(matchResult.score * 100).toFixed(1)}%`)

    matches.push({
      user: candidate,
      score: matchResult.score,
      myInterest: matchResult.myInterest,
      theirInterest: matchResult.theirInterest,
    })
  }

  // 步骤 3: 按相似度排序
  console.log('\n[3/3] 按相似度排序...')
  matches.sort((a, b) => b.score - a.score)

  // 构造返回结果
  const results: MatchResult[] = matches.slice(0, limit).map(match => ({
    userId: match.user.id,
    name: match.user.name,
    age: match.user.age,
    gender: match.user.gender,
    city: match.user.city,
    avatar: match.user.avatar,
    bio: match.user.bio,
    interests: match.user.interests,
    needs: match.user.needs,
    provide: match.user.provide,
    matchDetail: {
      myInterest: match.myInterest,
      theirInterest: match.theirInterest,
      similarityScore: match.score,
      similarityPercent: Math.round(match.score * 100),
    },
    similarity: match.score,
  }))

  console.log('\n' + '='.repeat(80))
  console.log('匹配完成！')
  console.log('='.repeat(80))
  console.log('返回结果数:', results.length)
  console.log('最高相似度:', results[0]?.matchDetail.similarityPercent || 0, '%')
  console.log('='.repeat(80))

  return results
}
