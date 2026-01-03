/**
 * 检查数据库中所有用户数据
 */

import { db } from "@/lib/db"
import { users, userProfiles } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

async function checkAllUsers() {
  console.log("=== 检查数据库用户数据 ===\n")

  // 统计
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users)
  const [profileCount] = await db.select({ count: sql<number>`count(*)` }).from(userProfiles)

  console.log(`users 表记录数: ${userCount.count}`)
  console.log(`user_profiles 表记录数: ${profileCount.count}\n`)

  // 获取所有 users
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
  }).from(users).orderBy(users.id)

  console.log("=== 所有 users 表记录 ===\n")

  // 分类显示
  const testAccounts = allUsers.filter(u => u.email.includes('test') || u.email.includes('user@example'))
  const mockUsers = allUsers.filter(u => u.email.includes('rugumock'))
  const others = allUsers.filter(u => !u.email.includes('test') && !u.email.includes('user@example') && !u.email.includes('rugumock'))

  console.log(`【测试账户】${testAccounts.length} 条:`)
  testAccounts.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email} - ${u.name}`)
    console.log(`     ID: ${u.id}`)
  })

  console.log(`\n【Mock 用户】${mockUsers.length} 条:`)
  mockUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email}`)
  })

  if (others.length > 0) {
    console.log(`\n【其他用户】${others.length} 条:`)
    others.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email} - ${u.name}`)
      console.log(`     ID: ${u.id}`)
    })
  }

  // 检查哪些 users 没有 profile
  console.log(`\n=== 缺少 user_profiles 的用户 ===\n`)

  const usersWithoutProfiles = []
  for (const user of allUsers) {
    const profiles = await db.select().from(userProfiles).where(sql`${userProfiles.userId} = ${user.id}`)
    if (profiles.length === 0) {
      usersWithoutProfiles.push(user)
    }
  }

  if (usersWithoutProfiles.length > 0) {
    console.log(`共有 ${usersWithoutProfiles.length} 个用户缺少 user_profiles:`)
    usersWithoutProfiles.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email} - ${u.name}`)
    })
  } else {
    console.log("✅ 所有 users 都有对应的 user_profiles")
  }

  console.log("\n=== 完成 ===")
}

checkAllUsers().catch(console.error)
