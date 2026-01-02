/**
 * 向量嵌入服务
 *
 * 功能：
 * - 为单个文本生成向量
 * - 为用户兴趣、需求、提供批量生成向量
 * - 调用嵌入模型 API (bge-m3)
 */

import { db } from '@/lib/db'
import { userEmbeddings } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// 嵌入向量类型
export type EmbeddingType = 'interest' | 'need' | 'provide' | 'profile'

// 嵌入 API 配置
const EMBEDDING_API_URL = process.env.EMBEDDING_API_URL || ''
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || ''

/**
 * 调用嵌入模型 API 生成向量
 * @param text 输入文本
 * @returns 1024维向量
 */
async function generateEmbeddingFromAPI(text: string): Promise<number[]> {
  if (!EMBEDDING_API_URL) {
    throw new Error('EMBEDDING_API_URL 环境变量未配置')
  }

  try {
    const response = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EMBEDDING_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'bge-m3',
        input: text,
        encoding_format: 'float',
      }),
    })

    if (!response.ok) {
      throw new Error(`嵌入 API 调用失败: ${response.statusText}`)
    }

    const data = await response.json()

    // 根据实际 API 响应格式解析
    // 假设返回格式为 { data: [{ embedding: number[] }] }
    if (data.data && data.data[0] && data.data[0].embedding) {
      return data.data[0].embedding
    }

    throw new Error('嵌入 API 响应格式不正确')
  } catch (error) {
    console.error('生成向量失败:', error)
    throw error
  }
}

/**
 * 为单个文本生成向量
 * @param text 输入文本
 * @returns 1024维向量
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('输入文本不能为空')
  }

  return generateEmbeddingFromAPI(text.trim())
}

/**
 * 为用户兴趣生成向量记录
 * @param userId 用户ID
 * @param interests 兴趣数组
 * @returns 创建的向量记录数量
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
      // 检查是否已存在
      const existing = await db.query.userEmbeddings.findFirst({
        where: and(
          eq(userEmbeddings.userId, userId),
          eq(userEmbeddings.embeddingType, 'interest'),
          eq(userEmbeddings.sourceIndex, i)
        ),
      })

      if (existing) {
        // 更新现有记录
        await db.update(userEmbeddings)
          .set({
            sourceText: interest,
            embeddingGenerationStatus: 'pending',
            updatedAt: new Date(),
          })
          .where(eq(userEmbeddings.id, existing.id))
      } else {
        // 创建新记录（状态为 pending，向量由后台任务生成）
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
 * @param userId 用户ID
 * @param needs 需求数组
 * @returns 创建的向量记录数量
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
      const existing = await db.query.userEmbeddings.findFirst({
        where: and(
          eq(userEmbeddings.userId, userId),
          eq(userEmbeddings.embeddingType, 'need'),
          eq(userEmbeddings.sourceIndex, i)
        ),
      })

      if (existing) {
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
 * @param userId 用户ID
 * @param provides 提供数组
 * @returns 创建的向量记录数量
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
      const existing = await db.query.userEmbeddings.findFirst({
        where: and(
          eq(userEmbeddings.userId, userId),
          eq(userEmbeddings.embeddingType, 'provide'),
          eq(userEmbeddings.sourceIndex, i)
        ),
      })

      if (existing) {
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
 * @param userId 用户ID
 * @param profile 用户资料
 * @returns 各类型生成的向量记录数量
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
