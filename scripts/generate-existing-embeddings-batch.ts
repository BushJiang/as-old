/**
 * 数据迁移脚本（优化版）：为现有用户批量生成向量嵌入
 *
 * 优化：
 * 1. 并发调用 API 生成向量（控制并发数避免触发 RPM 限制）
 * 2. 批量写入数据库，减少 I/O 次数
 *
 * 使用方式：
 * bun run scripts/generate-existing-embeddings-batch.ts
 */

import { db } from '@/lib/db'
import { userProfiles, userEmbeddings } from '@/lib/db/schema'
import { generateUserProfileEmbeddings } from '@/lib/services/embedding-service'
import { generateEmbedding } from '@/lib/services/embedding-service'
import { eq } from 'drizzle-orm'

interface MigrationStats {
  total: number
  totalEmbeddings: number
  success: number
  failed: number
  errors: Array<{ userId: string; name: string; error: string }>
}

// 配置（稳定性优化：减少并发以应对网络问题）
const BATCH_SIZE = 3 // 每批并发请求数量（减少以提高稳定性）
const API_DELAY = 200 // API 调用间隔（毫秒，增加延迟避免连接问题）
const DELAY_BETWEEN_BATCHES = 2000 // 批次间延迟（毫秒，增加延迟）

/**
 * 批量生成向量（控制并发）
 */
async function generateEmbeddingsBatch(texts: Array<{ id: string; text: string }>) {
  const results = new Map<string, { success: boolean; vector?: number[]; error?: string }>()

  // 分批处理
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)

    console.log(`  批次 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} 个)`)

    // 并发生成
    const promises = batch.map(async (item) => {
      try {
        // 添加延迟避免触发 RPM 限制
        await new Promise(resolve => setTimeout(resolve, API_DELAY))

        const vector = await generateEmbedding(item.text)
        results.set(item.id, { success: true, vector })

        process.stdout.write('.')
      } catch (error) {
        results.set(item.id, {
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        })
        process.stdout.write('x')
      }
    })

    await Promise.all(promises)

    // 批次间延迟
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  console.log() // 换行

  return results
}

/**
 * 批量更新数据库
 */
async function batchUpdateDatabase(embeddings: Array<{ id: string; vector: number[] }>) {
  // 分批更新（每批 10 个，减少并发压力）
  const UPDATE_BATCH_SIZE = 10

  for (let i = 0; i < embeddings.length; i += UPDATE_BATCH_SIZE) {
    const batch = embeddings.slice(i, i + UPDATE_BATCH_SIZE)

    await Promise.all(
      batch.map(({ id, vector }) =>
        db
          .update(userEmbeddings)
          .set({
            embedding: vector,
            embeddingGenerationStatus: 'completed',
            embeddingGeneratedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userEmbeddings.id, id))
      )
    )
  }
}

async function main() {
  console.log('开始数据迁移：为现有用户批量生成向量嵌入...\n')

  // 1. 读取所有用户资料
  const profiles = await db.select().from(userProfiles)

  console.log(`找到 ${profiles.length} 个用户资料\n`)

  if (profiles.length === 0) {
    console.log('没有用户资料需要处理')
    return
  }

  const stats: MigrationStats = {
    total: profiles.length,
    totalEmbeddings: 0,
    success: 0,
    failed: 0,
    errors: [],
  }

  // 2. 为每个用户生成向量
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i]
    const progress = Math.round(((i + 1) / profiles.length) * 100)

    console.log(`\n[${i + 1}/${profiles.length}] ${progress}% - 处理: ${profile.name}`)

    try {
      // 检查是否已有向量
      const existingEmbeddings = await db
        .select()
        .from(userEmbeddings)
        .where(eq(userEmbeddings.userId, profile.userId))

      // 如果已有向量且全部完成，跳过
      if (existingEmbeddings.length > 0) {
        const completedCount = existingEmbeddings.filter(
          e => e.embeddingGenerationStatus === 'completed'
        ).length

        if (completedCount === existingEmbeddings.length) {
          console.log(`  ✓ 跳过 (已有 ${completedCount} 个向量)`)
          stats.success++
          continue
        }
      }

      // 创建向量记录（pending 状态）
      await generateUserProfileEmbeddings(profile.userId, {
        interests: profile.interests || [],
        needs: profile.needs || [],
        provide: profile.provide || [],
      })

      // 获取需要生成的向量记录
      const pendingEmbeddings = await db
        .select()
        .from(userEmbeddings)
        .where(eq(userEmbeddings.userId, profile.userId))

      console.log(`  需要 ${pendingEmbeddings.length} 个向量`)

      // 批量生成向量
      const results = await generateEmbeddingsBatch(
        pendingEmbeddings.map(e => ({ id: e.id, text: e.sourceText }))
      )

      // 分离成功和失败的结果
      const successEmbeddings: Array<{ id: string; vector: number[] }> = []
      let failedCount = 0

      for (const [id, result] of results.entries()) {
        if (result.success && result.vector) {
          successEmbeddings.push({ id, vector: result.vector })
        } else {
          failedCount++

          // 标记为失败
          await db
            .update(userEmbeddings)
            .set({ embeddingGenerationStatus: 'failed' })
            .where(eq(userEmbeddings.id, id))
        }
      }

      // 批量写入数据库
      if (successEmbeddings.length > 0) {
        console.log(`  批量写入 ${successEmbeddings.length} 个向量到数据库...`)
        await batchUpdateDatabase(successEmbeddings)
      }

      stats.totalEmbeddings += pendingEmbeddings.length

      if (failedCount === 0) {
        console.log(`  ✓ 成功 (${successEmbeddings.length}/${pendingEmbeddings.length})`)
        stats.success++
      } else {
        console.log(`  ✗ 部分失败 (${successEmbeddings.length}/${pendingEmbeddings.length})`)
        stats.failed++
        stats.errors.push({
          userId: profile.userId,
          name: profile.name,
          error: `${failedCount} 个向量生成失败`,
        })
      }
    } catch (error) {
      console.error(`\n  处理失败:`, error)
      stats.failed++
      stats.errors.push({
        userId: profile.userId,
        name: profile.name,
        error: error instanceof Error ? error.message : '未知错误',
      })
    }
  }

  // 3. 显示统计结果
  console.log('\n\n数据迁移完成！\n')
  console.log('统计结果：')
  console.log(`  总用户数: ${stats.total}`)
  console.log(`  总向量数: ${stats.totalEmbeddings}`)
  console.log(`  成功用户: ${stats.success}`)
  console.log(`  失败用户: ${stats.failed}`)

  if (stats.errors.length > 0) {
    console.log('\n错误详情：')
    for (const err of stats.errors) {
      console.log(`  - ${err.name} (${err.userId}): ${err.error}`)
    }
  }
}

main()
  .then(() => {
    console.log('\n脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('脚本执行失败:', error)
    process.exit(1)
  })
