import { db } from "@/lib/db"
import { users, userProfiles } from "@/lib/db/schema"
import { count } from "drizzle-orm"

async function checkUsers() {
  console.log("=== 检查数据库用户数据 ===\n")

  // 统计用户数
  const [userCount] = await db.select({ count: count() }).from(users)
  const [profileCount] = await db.select({ count: count() }).from(userProfiles)

  console.log(`users 表记录数: ${userCount.count}`)
  console.log(`user_profiles 表记录数: ${profileCount.count}\n`)

  // 列出所有用户
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
  }).from(users).orderBy(users.id)

  console.log(`所有用户列表 (共 ${allUsers.length} 个):`)
  allUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email} - ${u.name}`)
  })

  console.log("\n=== 完成 ===")
  process.exit(0)
}

checkUsers().catch(console.error)
