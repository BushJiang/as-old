import { db } from '@/lib/db'
import { users, userProfiles, userEmbeddings } from '@/lib/db/schema'

async function checkData() {
  const allUsers = await db.select().from(users)
  const allProfiles = await db.select().from(userProfiles)
  const allEmbeddings = await db.select().from(userEmbeddings)

  console.log('=== 数据库实际数据统计 ===\n')
  console.log('users 表行数:', allUsers.length)
  console.log('user_profiles 表行数:', allProfiles.length)
  console.log('user_embeddings 表行数:', allEmbeddings.length)

  // 检查 user_embeddings 中的状态分布
  const statusMap = new Map()
  allEmbeddings.forEach(e => {
    const status = e.embeddingGenerationStatus || 'null'
    statusMap.set(status, (statusMap.get(status) || 0) + 1)
  })
  console.log('\nuser_embeddings 状态分布:', Object.fromEntries(statusMap))

  // 列出所有用户ID
  console.log('\n=== 所有用户列表 ===')
  allUsers.forEach((u, i) => {
    console.log(`${i + 1}. ${u.id} - ${u.name} (${u.email})`)
  })
}

checkData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
