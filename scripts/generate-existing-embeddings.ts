/**
 * 数据迁移脚本：为现有用户生成向量嵌入
 *
 * 功能：
 * 1. 读取数据库中所有用户资料
 * 2. 为每个用户调用向量化服务
 * 3. 批量生成兴趣、需求、提供向量
 * 4. 显示进度和错误统计
 *
 * 使用方式：
 * bun run scripts/generate-existing-embeddings.ts
 */

import { db } from '@/lib/db'
import { userProfiles, userEmbeddings } from '@/lib/db/schema'
import { generateUserProfileEmbeddings } from '@/lib/services/embedding-service'
import { generateEmbedding } from '@/lib/services/embedding-service'
import { eq } from 'drizzle-orm'

interface MigrationStats {
  total: number
  success: number
  failed: number
  errors: Array<{ userId: string; name: string; error: string }>
}

async function main() {
  console.log('开始数据迁移：为现有用户生成向量嵌入...\n')

  // 1. 读取所有用户资料
  const profiles = await db.select().from(userProfiles)

  console.log(`找到 ${profiles.length} 个用户资料\n`)

  if (profiles.length === 0) {
    console.log('没有用户资料需要处理')
    return
  }

  const stats: MigrationStats = {
    total: profiles.length,
    success: 0,
    failed: 0,
    errors: [],
  }

  // 2. 为每个用户生成向量
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i]
    const progress = Math.round(((i + 1) / profiles.length) * 100)

    process.stdout.write(`\r[${i + 1}/${profiles.length}] ${progress}% - 处理: ${profile.name}`)

    try {
      // 检查是否已有向量
      const existingEmbeddings = await db
        .select()
        .from(userEmbeddings)
        .where(eq(userEmbeddings.userId, profile.userId))

      // 如果已有向量，跳过
      if (existingEmbeddings.length > 0) {
        const completedCount = existingEmbeddings.filter(
          e => e.embeddingGenerationStatus === 'completed'
        ).length

        if (completedCount === existingEmbeddings.length) {
          console.log(`\r[${i + 1}/${profiles.length}] ${progress}% - 跳过: ${profile.name} (已有向量)`)
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

      // 逐个生成向量
      let completedCount = 0
      let failedCount = 0

      for (const embedding of pendingEmbeddings) {
        try {
          const vector = await generateEmbedding(embedding.sourceText)

          await db
            .update(userEmbeddings)
            .set({
              embedding: vector,
              embeddingGenerationStatus: 'completed',
              embeddingGeneratedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(userEmbeddings.id, embedding.id))

          completedCount++
        } catch (error) {
          console.error(`\n  生成向量失败 (${embedding.sourceText}):`, error)

          await db
            .update(userEmbeddings)
            .set({
              embeddingGenerationStatus: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(userEmbeddings.id, embedding.id))

          failedCount++
        }
      }

      if (failedCount === 0) {
        stats.success++
      } else {
        stats.failed++
        stats.errors.push({
          userId: profile.userId,
          name: profile.name,
          error: `${failedCount} 个向量生成失败`,
        })
      }
    } catch (error) {
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
  console.log(`  成功: ${stats.success}`)
  console.log(`  失败: ${stats.failed}`)

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
