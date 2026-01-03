/**
 * 检查数据库数据一致性
 */

import { db } from "@/lib/db"
import { users, userProfiles } from "@/lib/db/schema"

async function checkData() {
  console.log("=== 检查数据库数据 ===\n")

  const allUsers = await db.select().from(users)
  const allProfiles = await db.select().from(userProfiles)

  console.log(`users 表: ${allUsers.length} 条`)
  console.log(`user_profiles 表: ${allProfiles.length} 条`)

  const profileUserIds = new Set(allProfiles.map(p => p.userId))
  const missingProfiles = allUsers.filter(u => !profileUserIds.has(u.id))

  console.log(`\n缺少 user_profiles 的用户: ${missingProfiles.length} 个\n`)

  if (missingProfiles.length > 0) {
    missingProfiles.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email}`)
      console.log(`   ID: ${u.id}`)
      console.log(`   Name: ${u.name}`)
    })
  }

  console.log("\n=== 完成 ===")
}

checkData().catch(console.error)
