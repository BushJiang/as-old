/**
 * 向量嵌入服务 (API 版本)
 *
 * 主服务: 硅基流动 (Pro/BAAI/bge-m3)
 * 备用服务: 阿里云 (text-embedding-v4)
 */

import { db } from '@/lib/db'
import { userEmbeddings } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// 嵌入向量类型
export type EmbeddingType = 'interest' | 'need' | 'provide' | 'profile'

// 服务提供商
type Provider = 'siliconflow' | 'alibaba'

// API 配置
const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/embeddings'
const ALIBABA_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings'

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || ''
const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY || ''

// 向量维度
const BGE_M3_DIMENSIONS = 1024
const TEXT_EMBEDDING_V4_DIMENSIONS = 1024

/**
 * 调用硅基流动 API 生成向量
 */
async function generateEmbeddingFromSiliconFlow(text: string): Promise<number[]> {
  if (!SILICONFLOW_API_KEY) {
    throw new Error('SILICONFLOW_API_KEY 环境变量未配置')
  }

  try {
    const response = await fetch(SILICONFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'Pro/BAAI/bge-m3',
        input: text,
        encoding_format: 'float',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`硅基流动 API 调用失败: ${response.status} ${error}`)
    }

    const data = await response.json()

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('硅基流动 API 响应格式不正确')
    }

    const embedding = data.data[0].embedding

    if (embedding.length !== BGE_M3_DIMENSIONS) {
      throw new Error(`向量维度错误: 期望 ${BGE_M3_DIMENSIONS}, 实际 ${embedding.length}`)
    }

    return embedding
  } catch (error) {
    console.error('硅基流动 API 调用失败:', error)
    throw error
  }
}

/**
 * 调用阿里云 API 生成向量 (备用方案)
 */
async function generateEmbeddingFromAlibaba(text: string): Promise<number[]> {
  if (!ALIBABA_API_KEY) {
    throw new Error('ALIBABA_API_KEY 环境变量未配置')
  }

  try {
    const response = await fetch(ALIBABA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ALIBABA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-v4',
        input: text,
        dimensions: TEXT_EMBEDDING_V4_DIMENSIONS,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`阿里云 API 调用失败: ${response.status} ${error}`)
    }

    const data = await response.json()

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('阿里云 API 响应格式不正确')
    }

    const embedding = data.data[0].embedding

    if (embedding.length !== TEXT_EMBEDDING_V4_DIMENSIONS) {
      throw new Error(`向量维度错误: 期望 ${TEXT_EMBEDDING_V4_DIMENSIONS}, 实际 ${embedding.length}`)
    }

    return embedding
  } catch (error) {
    console.error('阿里云 API 调用失败:', error)
    throw error
  }
}

/**
 * 为单个文本生成向量
 * 优先使用硅基流动，失败时自动切换到阿里云
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('输入文本不能为空')
  }

  let lastError: Error | null = null

  // 优先使用硅基流动
  if (SILICONFLOW_API_KEY) {
    try {
      return await generateEmbeddingFromSiliconFlow(text.trim())
    } catch (error) {
      console.warn('硅基流动 API 调用失败，尝试备用方案:', error)
      lastError = error as Error
    }
  }

  // 备用方案: 阿里云
  if (ALIBABA_API_KEY) {
    try {
      return await generateEmbeddingFromAlibaba(text.trim())
    } catch (error) {
      console.error('阿里云 API 调用失败:', error)
      lastError = error as Error
    }
  }

  // 所有方案都失败
  throw lastError || new Error('没有可用的嵌入 API 服务')
}

/**
 * 批量生成向量
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return []
  }

  const results: number[][] = []

  for (const text of texts) {
    try {
      const embedding = await generateEmbedding(text)
      results.push(embedding)
    } catch (error) {
      console.error(`生成向量失败 (${text}):`, error)
      // 失败时跳过，不中断整个批处理
    }
  }

  return results
}

/**
 * 为用户兴趣生成向量记录
 */
export async function generateUserInterestsEmbeddings(
  userId: string,
  interests: string[]
): Promise<number> {
  let count = 0

  for (let i = 0; i < interests.length; i++) {
    const interest = interests[i].trim()
    if (!interest) continue

    try {
      const [existing] = await db
        .select()
        .from(userEmbeddings)
        .where(
          and(
            eq(userEmbeddings.userId, userId),
            eq(userEmbeddings.embeddingType, 'interest'),
            eq(userEmbeddings.sourceIndex, i)
          )
        )
        .limit(1)

      if (existing) {
        // 如果向量已经完成，跳过不重新生成
        if (existing.embeddingGenerationStatus === 'completed') {
          count++
          continue
        }
        // 只更新 pending 或 failed 状态的向量
        await db.update(userEmbeddings)
          .set({
            sourceText: interest,
            embeddingGenerationStatus: 'pending',
            updatedAt: new Date(),
          })
          .where(eq(userEmbeddings.id, existing.id))
      } else {
        await db.insert(userEmbeddings).values({
          userId,
          embeddingType: 'interest',
          sourceText: interest,
          sourceIndex: i,
          embedding: null,
          embeddingGenerationStatus: 'pending',
        })
      }
      count++
    } catch (error) {
      console.error(`生成兴趣向量失败 (${interest}):`, error)
    }
  }

  return count
}

/**
 * 为用户需求生成向量记录
 */
export async function generateUserNeedsEmbeddings(
  userId: string,
  needs: string[]
): Promise<number> {
  let count = 0

  for (let i = 0; i < needs.length; i++) {
    const need = needs[i].trim()
    if (!need) continue

    try {
      const [existing] = await db
        .select()
        .from(userEmbeddings)
        .where(
          and(
            eq(userEmbeddings.userId, userId),
            eq(userEmbeddings.embeddingType, 'need'),
            eq(userEmbeddings.sourceIndex, i)
          )
        )
        .limit(1)

      if (existing) {
        // 如果向量已经完成，跳过不重新生成
        if (existing.embeddingGenerationStatus === 'completed') {
          count++
          continue
        }
        // 只更新 pending 或 failed 状态的向量
        await db.update(userEmbeddings)
          .set({
            sourceText: need,
            embeddingGenerationStatus: 'pending',
            updatedAt: new Date(),
          })
          .where(eq(userEmbeddings.id, existing.id))
      } else {
        await db.insert(userEmbeddings).values({
          userId,
          embeddingType: 'need',
          sourceText: need,
          sourceIndex: i,
          embedding: null,
          embeddingGenerationStatus: 'pending',
        })
      }
      count++
    } catch (error) {
      console.error(`生成需求向量失败 (${need}):`, error)
    }
  }

  return count
}

/**
 * 为用户提供生成向量记录
 */
export async function generateUserProvidesEmbeddings(
  userId: string,
  provides: string[]
): Promise<number> {
  let count = 0

  for (let i = 0; i < provides.length; i++) {
    const provide = provides[i].trim()
    if (!provide) continue

    try {
      const [existing] = await db
        .select()
        .from(userEmbeddings)
        .where(
          and(
            eq(userEmbeddings.userId, userId),
            eq(userEmbeddings.embeddingType, 'provide'),
            eq(userEmbeddings.sourceIndex, i)
          )
        )
        .limit(1)

      if (existing) {
        // 如果向量已经完成，跳过不重新生成
        if (existing.embeddingGenerationStatus === 'completed') {
          count++
          continue
        }
        // 只更新 pending 或 failed 状态的向量
        await db.update(userEmbeddings)
          .set({
            sourceText: provide,
            embeddingGenerationStatus: 'pending',
            updatedAt: new Date(),
          })
          .where(eq(userEmbeddings.id, existing.id))
      } else {
        await db.insert(userEmbeddings).values({
          userId,
          embeddingType: 'provide',
          sourceText: provide,
          sourceIndex: i,
          embedding: null,
          embeddingGenerationStatus: 'pending',
        })
      }
      count++
    } catch (error) {
      console.error(`生成提供向量失败 (${provide}):`, error)
    }
  }

  return count
}

/**
 * 为用户所有资料生成向量记录
 */
export async function generateUserProfileEmbeddings(
  userId: string,
  profile: {
    interests: string[]
    needs: string[]
    provide: string[]
  }
): Promise<{
  interests: number
  needs: number
  provides: number
}> {
  const interests = await generateUserInterestsEmbeddings(userId, profile.interests || [])
  const needs = await generateUserNeedsEmbeddings(userId, profile.needs || [])
  const provides = await generateUserProvidesEmbeddings(userId, profile.provide || [])

  return { interests, needs, provides }
}

// 导出当前使用的提供商
export function getCurrentProvider(): Provider {
  return SILICONFLOW_API_KEY ? 'siliconflow' : 'alibaba'
}

// 导出模型信息
export function getModelInfo() {
  return {
    primary: {
      provider: 'siliconflow' as Provider,
      model: 'Pro/BAAI/bge-m3',
      dimensions: BGE_M3_DIMENSIONS,
      maxTokens: 8192,
    },
    fallback: {
      provider: 'alibaba' as Provider,
      model: 'text-embedding-v4',
      dimensions: TEXT_EMBEDDING_V4_DIMENSIONS,
      maxTokens: 2048,
    },
  }
}
