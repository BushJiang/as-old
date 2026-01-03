/**
 * 验证数据库中的头像 URL
 */

import { db } from "@/lib/db"
import { userProfiles } from "@/lib/db/schema"

async function verifyAvatars() {
  console.log("=== 验证头像 URL ===\n")

  const profiles = await db.select().from(userProfiles).limit(10)

  console.log("前 10 个用户的头像 URL：\n")
  for (const profile of profiles) {
    const isCorrect = profile.avatarUrl === `/avatars/${profile.userId}.svg`
    const status = isCorrect ? '✅' : '❌'
    console.log(`${status} ${profile.name}`)
    console.log(`   ID: ${profile.userId}`)
    console.log(`   URL: ${profile.avatarUrl}`)
    console.log()
  }

  const allProfiles = await db.select().from(userProfiles)
  const correctCount = allProfiles.filter(
    p => p.avatarUrl === `/avatars/${p.userId}.svg`
  ).length

  console.log("=== 统计 ===")
  console.log(`总用户数: ${allProfiles.length}`)
  console.log(`头像 URL 正确: ${correctCount}`)
  console.log(`头像 URL 错误: ${allProfiles.length - correctCount}`)
}

verifyAvatars().catch(console.error)
