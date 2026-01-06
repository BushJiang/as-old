import { db } from '@/lib/db'
import { users, userProfiles, userEmbeddings } from '@/lib/db/schema'
import { MOCK_USERS } from '@/data/mock/users'

async function verifyData() {
  console.log('=== 数据验证报告 ===\n')

  // 1. 数据库中的数据
  const dbUsers = await db.select().from(users)
  const dbProfiles = await db.select().from(userProfiles)
  const dbEmbeddings = await db.select().from(userEmbeddings)

  // 2. 源文件中的数据
  const totalMockUsers = MOCK_USERS.length

  console.log('📊 数据统计\n')
  console.log(`源文件:`)
  console.log(`  - users.ts: ${totalMockUsers} 个用户\n`)

  console.log(`数据库:`)
  console.log(`  - users 表: ${dbUsers.length} 个用户`)
  console.log(`  - user_profiles 表: ${dbProfiles.length} 个用户资料`)
  console.log(`  - user_embeddings 表: ${dbEmbeddings.length} 个向量\n`)

  // 3. 验证是否全部上传
  const isAllUploaded = dbUsers.length >= totalMockUsers
  console.log(`上传状态: ${isAllUploaded ? '✅ 已全部上传' : '❌ 未全部上传'}\n`)

  // 4. 验证向量化状态
  const completedEmbeddings = dbEmbeddings.filter(
    e => e.embeddingGenerationStatus === 'completed'
  ).length
  const pendingEmbeddings = dbEmbeddings.filter(
    e => e.embeddingGenerationStatus === 'pending'
  ).length

  console.log(`向量化状态:`)
  console.log(`  - 已完成: ${completedEmbeddings} 个`)
  console.log(`  - 待处理: ${pendingEmbeddings} 个`)
  console.log(`  - 状态: ${pendingEmbeddings === 0 ? '✅ 全部完成' : '❌ 有未完成'}\n`)

  // 5. 检查每个用户是否有完整向量
  console.log('📋 用户向量化详情\n')

  const usersWithoutEmbeddings: string[] = []
  const usersWithIncompleteEmbeddings: Array<{name: string, has: number, should: number}> = []

  for (const profile of dbProfiles) {
    const embeddings = dbEmbeddings.filter(
      e => e.userId === profile.userId && e.embeddingGenerationStatus === 'completed'
    )

    const profileOriginal = MOCK_USERS.find(u => u.id === profile.userId)
    if (!profileOriginal) continue

    const expectedCount =
      (profileOriginal.interests?.length || 0) +
      (profileOriginal.needs?.length || 0) +
      (profileOriginal.provide?.length || 0)

    if (embeddings.length === 0) {
      usersWithoutEmbeddings.push(profile.name)
    } else if (embeddings.length < expectedCount) {
      usersWithIncompleteEmbeddings.push({
        name: profile.name,
        has: embeddings.length,
        should: expectedCount,
      })
    }
  }

  if (usersWithoutEmbeddings.length === 0 && usersWithIncompleteEmbeddings.length === 0) {
    console.log('✅ 所有用户向量完整\n')
  } else {
    if (usersWithoutEmbeddings.length > 0) {
      console.log(`❌ 以下用户无向量数据 (${usersWithoutEmbeddings.length} 个):`)
      usersWithoutEmbeddings.forEach(name => console.log(`  - ${name}`))
    }
    if (usersWithIncompleteEmbeddings.length > 0) {
      console.log(`⚠️  以下用户向量不完整 (${usersWithIncompleteEmbeddings.length} 个):`)
      usersWithIncompleteEmbeddings.forEach(u => {
        console.log(`  - ${u.name}: ${u.has}/${u.should}`)
      })
    }
  }

  // 6. 文件结构
  console.log('📁 文件结构\n')
  console.log(`  - src/data/mock/users.ts: 导出 MOCK_USERS (${totalMockUsers}个)\n`)
}

verifyData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
