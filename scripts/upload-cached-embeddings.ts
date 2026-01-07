/**
 * 上传缓存的嵌入向量到数据库 (Bulk Upsert 方案)
 *
 * 最佳实践：
 * 1. 使用 INSERT ... ON CONFLICT DO UPDATE (批量插入/冲突更新)
 * 2. 最小化网络往返，从 910 次请求减少到 9-10 次批量请求
 * 3. 不需要预先查询 ID，数据库自动处理插入或更新
 *
 * 使用方式：
 * bun run scripts/upload-cached-embeddings.ts
 */

import { db } from '@/lib/db'
import { userEmbeddings } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface CachedEmbedding {
  id: string
  userId: string
  type: 'interest' | 'need' | 'provide' | 'profile'
  sourceText: string
  sourceIndex: number
  embedding: number[]
  cachedAt: string
}

interface OfflineUser {
  id: string
  name: string
  age: number
  gender: string
  city: string
  bio: string
  interests: string[]
  needs: string[]
  provide: string[]
}

interface OfflineCacheData {
  generatedAt: string
  totalUsers: number
  users: OfflineUser[]
  embeddings: CachedEmbedding[]
}

// 配置
const CACHE_FILE_PATH = join(process.cwd(), 'data', 'embeddings-cache.json')
const BATCH_SIZE = 100 // 每批 100 条，平衡参数数量和网络延迟

async function main() {
  console.log('='.repeat(80))
  console.log('开始上传缓存的嵌入向量到数据库 (Bulk Upsert)')
  console.log('='.repeat(80))

  // 检查缓存文件
  if (!existsSync(CACHE_FILE_PATH)) {
    console.error(`\n错误: 缓存文件不存在`)
    console.error(`路径: ${CACHE_FILE_PATH}`)
    console.error(`\n请先运行以下命令生成向量:`)
    console.error(`  bun run scripts/generate-embeddings-offline.ts`)
    process.exit(1)
  }

  // 读取缓存
  const cacheData: OfflineCacheData = JSON.parse(readFileSync(CACHE_FILE_PATH, 'utf-8'))
  console.log(`\n缓存信息:`)
  console.log(`  生成时间: ${cacheData.generatedAt}`)
  console.log(`  用户数量: ${cacheData.users.length}`)
  console.log(`  向量数量: ${cacheData.embeddings.length}`)

  if (cacheData.embeddings.length === 0) {
    console.log('\n缓存为空，无需上传')
    return
  }

  // 过滤旧格式向量（没有 type 字段的）
  const validEmbeddings = cacheData.embeddings.filter(
    e => e.type && e.sourceIndex !== undefined && e.embedding?.length > 0
  )

  console.log(`\n过滤旧格式向量:`)
  console.log(`  总向量数: ${cacheData.embeddings.length}`)
  console.log(`  有效向量数: ${validEmbeddings.length}`)
  console.log(`  过滤掉: ${cacheData.embeddings.length - validEmbeddings.length}`)

  if (validEmbeddings.length === 0) {
    console.log('\n没有有效的向量可上传')
    return
  }

  // 分批上传
  const totalBatches = Math.ceil(validEmbeddings.length / BATCH_SIZE)
  let totalSuccess = 0
  let totalFailed = 0

  console.log(`\n开始批量上传 (${totalBatches} 个批次，每批 ${BATCH_SIZE} 条)...`)
  console.log('-'.repeat(80))

  const startTime = Date.now()

  for (let i = 0; i < validEmbeddings.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const chunk = validEmbeddings.slice(i, i + BATCH_SIZE)

    console.log(`\n[批次 ${batchNum}/${totalBatches}] 上传 ${chunk.length} 条向量...`)

    // 构造符合 DB 结构的数据对象
    const values = chunk.map(item => ({
      userId: item.userId,
      embeddingType: item.type,
      sourceText: item.sourceText,
      sourceIndex: item.sourceIndex,
      embedding: item.embedding,
      embeddingGenerationStatus: 'completed' as const,
      embeddingGeneratedAt: new Date(item.cachedAt),
      updatedAt: new Date(),
    }))

    // 步骤 1：尝试批量上传（重试 3 次）
    const MAX_RETRIES = 3
    let batchSuccess = false
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await db.insert(userEmbeddings)
          .values(values)
          .onConflictDoUpdate({
            target: [
              userEmbeddings.userId,
              userEmbeddings.embeddingType,
              userEmbeddings.sourceIndex,
            ],
            set: {
              embedding: sql`excluded.embedding`,
              embeddingGenerationStatus: sql`excluded.embedding_generation_status`,
              embeddingGeneratedAt: sql`excluded.embedding_generated_at`,
              updatedAt: new Date(),
            },
          })

        batchSuccess = true
        totalSuccess += chunk.length
        console.log(`  ✓ 批次成功 (${chunk.length} 条)`)

        // 显示进度
        const progress = Math.round(((i + chunk.length) / validEmbeddings.length) * 100)
        console.log(`  进度: ${progress}%`)
        break
      } catch (error) {
        lastError = error as Error
        if (attempt < MAX_RETRIES) {
          console.log(`  ⚠️  批次失败，第 ${attempt} 次重试中...`)
          await delay(1000)
        } else {
          console.log(`  ✗ 批次重试 ${MAX_RETRIES} 次后仍失败`)
        }
      }
    }

    // 步骤 2：重试失败，降级为逐条上传
    if (!batchSuccess) {
      const errorMsg = lastError?.message || String(lastError)
      console.error(`  错误:`, errorMsg.slice(0, 200) + (errorMsg.length > 200 ? '...' : ''))
      console.log(`  🔄 降级为逐条上传...`)

      let batchSuccessCount = 0
      let batchFailedCount = 0

      for (const item of chunk) {
        try {
          const value = {
            userId: item.userId,
            embeddingType: item.type,
            sourceText: item.sourceText,
            sourceIndex: item.sourceIndex,
            embedding: item.embedding,
            embeddingGenerationStatus: 'completed' as const,
            embeddingGeneratedAt: new Date(item.cachedAt),
            updatedAt: new Date(),
          }

          await db.insert(userEmbeddings)
            .values(value)
            .onConflictDoUpdate({
              target: [
                userEmbeddings.userId,
                userEmbeddings.embeddingType,
                userEmbeddings.sourceIndex,
              ],
              set: {
                embedding: sql`excluded.embedding`,
                embeddingGenerationStatus: sql`excluded.embedding_generation_status`,
                embeddingGeneratedAt: sql`excluded.embedding_generated_at`,
                updatedAt: new Date(),
              },
            })

          batchSuccessCount++
          totalSuccess++
          process.stdout.write('.')
        } catch (singleError) {
          batchFailedCount++
          totalFailed++
          process.stdout.write('x')
        }
      }

      console.log()
      console.log(`  逐条上传完成: 成功 ${batchSuccessCount} 条, 失败 ${batchFailedCount} 条`)

      // 显示进度
      const progress = Math.round(((i + chunk.length) / validEmbeddings.length) * 100)
      console.log(`  进度: ${progress}%`)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)

  // 显示统计结果
  console.log('\n' + '='.repeat(80))
  console.log('上传完成！')
  console.log('='.repeat(80))
  console.log(`缓存总向量数: ${cacheData.embeddings.length}`)
  console.log(`有效向量数: ${validEmbeddings.length}`)
  console.log(`成功上传: ${totalSuccess}`)
  console.log(`失败数量: ${totalFailed}`)
  console.log(`耗时: ${elapsed} 秒`)

  if (totalFailed === 0) {
    console.log('\n✅ 所有向量上传成功！')
    console.log('\n下一步: 运行以下命令验证数据')
    console.log(`  bun run scripts/verify-all-data.ts`)
  } else {
    console.log(`\n⚠️  有 ${totalFailed} 个向量上传失败，请检查错误并重试`)
  }

  console.log('='.repeat(80))
}

main()
  .then(() => {
    console.log('\n脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('脚本执行失败:', errorMsg.slice(0, 500))
    process.exit(1)
  })
