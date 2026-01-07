/**
 * 完全离线的向量生成脚本
 *
 * 流程：
 * 1. 直接从 Mock 数据读取用户信息（不连接数据库）
 * 2. 调用硅基流动 API 生成向量
 * 3. 保存到本地 JSON 文件
 * 4. 支持断点续传
 *
 * 优势：
 * - 完全不连接数据库，避免 ECONNRESET 错误
 * - 可以随时暂停和继续
 * - 本地有完整的数据备份
 *
 * 使用方式：
 * bun run scripts/generate-embeddings-offline.ts
 */

import { MOCK_USERS } from '../data/mock/users'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { generateEmbedding } from '@/lib/services/embedding-service'

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

interface CachedEmbedding {
  id: string
  userId: string
  type: 'interest' | 'need' | 'provide' | 'profile'
  sourceText: string
  sourceIndex: number
  embedding: number[]
  cachedAt: string
}

interface OfflineCacheData {
  generatedAt: string
  totalUsers: number
  users: OfflineUser[]
  embeddings: CachedEmbedding[]
}

// 配置
const CACHE_FILE_PATH = join(process.cwd(), 'data', 'embeddings-cache.json')
const BATCH_SIZE = 10          // 每批 10 个文本（原 2，提速 5x）
const API_DELAY = 50           // 每个请求间隔 50ms（原 500ms，提速 10x）
const DELAY_BETWEEN_BATCHES = 1000  // 批次间延迟 1 秒（原 3 秒，提速 3x）
const MAX_RETRIES = 3
const RETRY_DELAY = 2000

// 测试账户
const TEST_USERS: OfflineUser[] = [
  {
    id: 'c6b5bf02-e393-441c-a0bc-28c89759ac8d',
    name: '陈思远',
    age: 26,
    gender: '男',
    city: '北京',
    bio: '软件工程师，热爱开源和技术分享。喜欢在周末阅读技术博客，偶尔也会写写代码记录学习心得。寻找志同道合的朋友一起交流技术。',
    interests: ['Go语言后端开发', '阅读技术博客', 'GitHub开源项目', 'AI应用研究'],
    needs: ['后端技术交流', '开源项目共建', 'AI应用开发'],
    provide: ['分布式系统设计', '微服务架构指导', '开源代码贡献', '技术趋势分享'],
  },
  {
    id: '9d30c7ce-8030-410b-a785-8f04ed6e7b9c',
    name: '林晓芸',
    age: 27,
    gender: '女',
    city: '上海',
    bio: 'UI/UX设计师，专注于用户体验设计。热爱旅行和摄影，用镜头记录生活中的美好瞬间。喜欢参观展览和艺术馆，寻找设计灵感。',
    interests: ['UI设计研究', '独自背包旅行', '旅行摄影', '艺术展览参观'],
    needs: ['设计灵感启发', '作品反馈指导', '行业交流圈子'],
    provide: ['用户体验优化', '用户研究服务', '原型设计指导', '视觉设计咨询'],
  },
  {
    id: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
    name: '王子健',
    age: 28,
    gender: '男',
    city: '深圳',
    bio: '产品经理，关注互联网产品和用户体验。热爱阅读和思考，喜欢和不同背景的人交流。业余时间喜欢跑步和健身，保持健康的生活方式。',
    interests: ['互联网产品', '阅读心理学书籍', '晨跑训练', '健身房锻炼'],
    needs: ['产品思维交流', '职业发展建议', '行业人脉拓展'],
    provide: ['产品规划经验', '需求分析方法', '项目管理指导', '健身训练计划'],
  },
]

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * 从缓存加载数据
 */
function loadCache(): OfflineCacheData {
  if (existsSync(CACHE_FILE_PATH)) {
    const data = readFileSync(CACHE_FILE_PATH, 'utf-8')
    return JSON.parse(data)
  }
  return {
    generatedAt: new Date().toISOString(),
    totalUsers: 0,
    users: [],
    embeddings: [],
  }
}

/**
 * 保存到缓存
 */
function saveCache(data: OfflineCacheData): void {
  writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * 生成单个向量（带重试）
 */
async function generateSingleEmbedding(
  text: string,
  context: string
): Promise<number[]> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const vector = await generateEmbedding(text)
      return vector
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      console.log(`    ⚠️  ${context} 失败 (尝试 ${attempt}/${MAX_RETRIES}): ${errorMsg}`)

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY)
      } else {
        throw error
      }
    }
  }

  throw new Error('生成向量失败')
}

/**
 * 为用户生成所有向量
 */
async function generateVectorsForUser(
  user: OfflineUser,
  cache: OfflineCacheData
): Promise<CachedEmbedding[]> {
  const newEmbeddings: CachedEmbedding[] = []

  // 需要生成的向量列表
  const vectorsToGenerate: Array<{ type: 'interest' | 'need' | 'provide'; texts: string[] }> = [
    { type: 'interest', texts: user.interests },
    { type: 'need', texts: user.needs },
    { type: 'provide', texts: user.provide },
  ]

  let totalCount = 0
  for (const { type, texts } of vectorsToGenerate) {
    totalCount += texts.length
  }

  console.log(`  需要生成 ${totalCount} 个向量`)

  // 检查缓存中是否已存在
  const cachedEmbeddings = cache.embeddings.filter(e => e.userId === user.id)
  const cachedKeys = new Set(cachedEmbeddings.map(e => `${e.type}-${e.sourceIndex}`))

  // 分批生成所有类型的向量（每种类型独立索引）
  for (const { type, texts } of vectorsToGenerate) {
    console.log(`  处理 ${type} (${texts.length} 个)`)

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)

      // 并发生成
      const promises = batch.map(async (text, batchIndex) => {
        const index = i + batchIndex // 每种类型独立索引
        const key = `${type}-${index}`

        // 如果缓存中已有，跳过
        if (cachedKeys.has(key)) {
          console.log(`    ✓ 跳过 ${type}[${index}]: ${text.slice(0, 25)}...`)
          return
        }

        try {
          await delay(API_DELAY)

          const vector = await generateSingleEmbedding(
            text,
            `${type}[${index}]: ${text.slice(0, 25)}`
          )

          newEmbeddings.push({
            id: generateId(),
            userId: user.id,
            type,
            sourceText: text,
            sourceIndex: index,
            embedding: vector,
            cachedAt: new Date().toISOString(),
          })

          console.log(`    ✓ ${type}[${index}]: ${text.slice(0, 25)}...`)
          process.stdout.write('.')
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知错误'
          console.log(`    ✗ ${type}[${index}]: ${text.slice(0, 25)}...`)
          console.log(`      错误: ${errorMsg}`)
          process.stdout.write('x')
        }
      })

      await Promise.all(promises)

      // 批次间延迟
      if (i + BATCH_SIZE < texts.length) {
        await delay(DELAY_BETWEEN_BATCHES)
      }
    }
  }

  console.log() // 换行

  return newEmbeddings
}

async function main() {
  console.log('='.repeat(80))
  console.log('开始生成嵌入向量（完全离线模式）')
  console.log('='.repeat(80))

  // 加载缓存
  let cache = loadCache()
  console.log(`\n现有缓存: ${cache.embeddings.length} 个向量`)

  // 合并所有用户数据
  const allUsers: OfflineUser[] = [...TEST_USERS, ...MOCK_USERS]
  console.log(`总用户数: ${allUsers.length} 个`)
  console.log(`  - 测试账户: ${TEST_USERS.length} 个`)
  console.log(`  - Mock 用户: ${MOCK_USERS.length} 个\n`)

  // 初始化用户数据（兼容旧格式）
  if (!cache.users || cache.users.length === 0) {
    cache.users = allUsers
    saveCache(cache)
    console.log('已初始化用户数据\n')
  }

  let successCount = 0
  let skipCount = 0
  let failedCount = 0

  // 统计已缓存的用户
  const cachedUserIds = new Set(cache.embeddings.map(e => e.userId))

  // 为每个用户生成向量
  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i]
    const progress = Math.round(((i + 1) / allUsers.length) * 100)

    console.log(`\n[${i + 1}/${allUsers.length}] ${progress}% - ${user.name}`)
    console.log(`  userId: ${user.id}`)

    // 检查是否已全部缓存
    if (cachedUserIds.has(user.id)) {
      const userCachedCount = cache.embeddings.filter(e => e.userId === user.id).length
      const expectedCount = user.interests.length + user.needs.length + user.provide.length

      if (userCachedCount >= expectedCount) {
        console.log(`  ✓ 跳过 (已缓存 ${userCachedCount} 个向量)`)
        skipCount++
        continue
      }
    }

    try {
      // 生成向量
      const newEmbeddings = await generateVectorsForUser(user, cache)

      // 添加到缓存
      cache.embeddings.push(...newEmbeddings)
      cache.totalUsers = allUsers.length
      cache.generatedAt = new Date().toISOString()

      // 保存缓存
      saveCache(cache)

      if (newEmbeddings.length > 0) {
        console.log(`  ✓ 成功缓存 ${newEmbeddings.length} 个向量`)
        successCount++
      } else {
        console.log(`  ⚠️  没有新向量生成`)
      }
    } catch (error) {
      console.error(`\n  处理失败:`, error)
      failedCount++
    }
  }

  // 显示统计结果
  console.log('\n' + '='.repeat(80))
  console.log('向量生成完成！')
  console.log('='.repeat(80))
  console.log(`总用户数: ${allUsers.length}`)
  console.log(`成功用户: ${successCount}`)
  console.log(`跳过用户: ${skipCount}`)
  console.log(`失败用户: ${failedCount}`)
  console.log(`总向量数: ${cache.embeddings.length}`)
  console.log(`\n缓存文件: ${CACHE_FILE_PATH}`)
  console.log('\n下一步: 运行以下命令上传到数据库')
  console.log(`  bun run scripts/upload-cached-embeddings.ts`)
  console.log('='.repeat(80))
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
