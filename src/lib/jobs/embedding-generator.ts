/**
 * 向量异步生成任务
 *
 * 功能：
 * - 监听待生成的向量任务（embedding_generation_status = 'pending'）
 * - 批量获取待处理的嵌入请求
 * - 调用嵌入 API 生成向量
 * - 更新数据库中的向量和状态
 * - 错误重试机制
 */

import { db } from '@/lib/db'
import { userEmbeddings } from '@/lib/db/schema'
import { eq, and, lt } from 'drizzle-orm'
import { generateEmbedding } from '@/lib/services/embedding-service'

// 批量处理数量
const BATCH_SIZE = 10

// 最大重试次数
const MAX_RETRIES = 3

/**
 * 处理单个向量生成任务
 */
async function processEmbedding(embeddingId: string): Promise<boolean> {
  try {
    // 获取向量记录
    const embedding = await db.query.userEmbeddings.findFirst({
      where: eq(userEmbeddings.id, embeddingId),
    })

    if (!embedding) {
      console.error(`向量记录不存在: ${embeddingId}`)
      return false
    }

    // 调用嵌入 API 生成向量
    const vector = await generateEmbedding(embedding.sourceText)

    // 更新数据库
    await db.update(userEmbeddings)
      .set({
        embedding: vector,
        embeddingGenerationStatus: 'completed',
        embeddingGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userEmbeddings.id, embeddingId))

    console.log(`向量生成成功: ${embeddingId} (${embedding.embeddingType}: ${embedding.sourceText})`)
    return true
  } catch (error) {
    console.error(`向量生成失败: ${embeddingId}`, error)

    // 更新为失败状态，并记录重试次数
    const embedding = await db.query.userEmbeddings.findFirst({
      where: eq(userEmbeddings.id, embeddingId),
    })

    if (embedding) {
      const retryCount = (embedding.metadata as any)?.retryCount || 0

      if (retryCount >= MAX_RETRIES) {
        // 超过最大重试次数，标记为永久失败
        await db.update(userEmbeddings)
          .set({
            embeddingGenerationStatus: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(userEmbeddings.id, embeddingId))
      } else {
        // 增加重试计数，保持 pending 状态
        await db.update(userEmbeddings)
          .set({
            metadata: {
              ...(embedding.metadata as any || {}),
              retryCount: retryCount + 1,
              lastError: error instanceof Error ? error.message : String(error),
            },
            updatedAt: new Date(),
          })
          .where(eq(userEmbeddings.id, embeddingId))
      }
    }

    return false
  }
}

/**
 * 处理一批待生成的向量
 */
export async function processPendingEmbeddings(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  try {
    // 获取所有待处理的向量任务
    const pendingEmbeddings = await db.query.userEmbeddings.findMany({
      where: eq(userEmbeddings.embeddingGenerationStatus, 'pending'),
      limit: BATCH_SIZE,
    })

    if (pendingEmbeddings.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    console.log(`开始处理 ${pendingEmbeddings.length} 个向量生成任务`)

    let succeeded = 0
    let failed = 0

    for (const embedding of pendingEmbeddings) {
      const result = await processEmbedding(embedding.id)
      if (result) {
        succeeded++
      } else {
        failed++
      }
    }

    console.log(`向量生成任务完成: 成功 ${succeeded}, 失败 ${failed}`)

    return { processed: pendingEmbeddings.length, succeeded, failed }
  } catch (error) {
    console.error('处理向量生成任务失败:', error)
    return { processed: 0, succeeded: 0, failed: 0 }
  }
}

/**
 * 启动向量生成任务调度器
 * 定期检查并处理待生成的向量
 */
export function startEmbeddingGenerator(intervalMs: number = 30000) {
  console.log(`向量生成任务调度器已启动，间隔: ${intervalMs}ms`)

  const interval = setInterval(async () => {
    try {
      await processPendingEmbeddings()
    } catch (error) {
      console.error('向量生成任务调度器错误:', error)
    }
  }, intervalMs)

  // 返回清理函数
  return () => {
    clearInterval(interval)
    console.log('向量生成任务调度器已停止')
  }
}

/**
 * 手动触发向量生成（用于测试或即时处理）
 */
export async function triggerEmbeddingGeneration(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  return processPendingEmbeddings()
}
