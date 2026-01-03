/**
 * 清空数据库中的用户数据
 */

import { db } from "@/lib/db"
import { users, userProfiles } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

async function clearDatabase() {
  console.log("=== 清空数据库 ===\n")

  try {
    // 删除所有 user_profiles 记录
    await db.delete(userProfiles)
    console.log("✅ 已清空 user_profiles 表")

    // 删除所有 users 记录
    await db.delete(users)
    console.log("✅ 已清空 users 表")

    // 验证
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users)
    const profileCount = await db.select({ count: sql<number>`count(*)` }).from(userProfiles)

    console.log(`\nusers 表记录数: ${userCount[0].count}`)
    console.log(`user_profiles 表记录数: ${profileCount[0].count}`)

    console.log("\n=== 清空完成 ===")

  } catch (error) {
    console.error("清空失败:", error)
    process.exit(1)
  }
}

clearDatabase().catch(console.error)
