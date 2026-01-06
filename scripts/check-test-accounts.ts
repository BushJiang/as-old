import { db } from '@/lib/db'
import { users, userProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function checkTestAccounts() {
  console.log('=== 检查测试账号 ===\n')

  // 获取所有用户
  const allUsers = await db.select().from(users)

  // 测试账号关键词
  const testKeywords = [
    '测试',
    'test',
    'demo',
    'user',
    'example',
    'mock',
  ]

  // 筛选可能的测试账号
  const testAccounts: Array<{
    id: string
    email: string
    name: string | null
    reason: string
  }> = []

  for (const user of allUsers) {
    const reasons: string[] = []

    // 检查邮箱
    const emailLower = user.email.toLowerCase()
    for (const keyword of testKeywords) {
      if (emailLower.includes(keyword)) {
        reasons.push(`邮箱包含 "${keyword}"`)
        break
      }
    }

    // 检查姓名
    if (user.name) {
      for (const keyword of testKeywords) {
        if (user.name.toLowerCase().includes(keyword)) {
          reasons.push(`姓名包含 "${keyword}"`)
          break
        }
      }
    }

    // 检查特定模式
    if (user.email.match(/\d{3,}@/)) {
      reasons.push('邮箱包含数字模式')
    }

    if (reasons.length > 0) {
      testAccounts.push({
        id: user.id,
        email: user.email,
        name: user.name,
        reason: reasons.join(', '),
      })
    }
  }

  console.log(`找到 ${testAccounts.length} 个疑似测试账号:\n`)

  if (testAccounts.length === 0) {
    console.log('✅ 没有发现明显的测试账号\n')
    return
  }

  for (const account of testAccounts) {
    console.log(`📧 ${account.email}`)
    console.log(`   姓名: ${account.name || '(空)'}`)
    console.log(`   ID: ${account.id}`)
    console.log(`   原因: ${account.reason}`)

    // 检查是否有关联的 profile
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, account.id))
      .limit(1)

    if (profile.length > 0) {
      console.log(`   资料: ${profile[0].bio?.substring(0, 50) || '(无简介)'}...`)
    }

    console.log()
  }

  // 统计分析
  console.log('=== 统计分析 ===\n')
  console.log(`总用户数: ${allUsers.length}`)
  console.log(`测试账号数: ${testAccounts.length}`)
  console.log(`真实用户占比: ${((allUsers.length - testAccounts.length) / allUsers.length * 100).toFixed(1)}%`)

  // 按原因分组
  const reasonGroups = new Map<string, number>()
  for (const account of testAccounts) {
    for (const reason of account.reason.split(', ')) {
      reasonGroups.set(reason, (reasonGroups.get(reason) || 0) + 1)
    }
  }

  console.log('\n按原因分组:')
  for (const [reason, count] of reasonGroups.entries()) {
    console.log(`  - ${reason}: ${count} 个`)
  }
}

checkTestAccounts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
