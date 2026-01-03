/**
 * 数据库种子数据导入脚本（批量操作版本）
 *
 * 功能：
 * 1. 将假用户导入数据库
 * 2. 为每个用户生成向量嵌入
 * 3. 创建测试账户
 *
 * 优化：使用批量操作减少数据库请求次数
 */

import { db } from "@/lib/db"
import { users, userProfiles } from "@/lib/db/schema"
import { MOCK_USERS } from "@/data/mock/users"
import bcrypt from "bcryptjs"
import { eq, or } from "drizzle-orm"

// 测试账户配置
const TEST_ACCOUNTS = [
  {
    id: 'c6b5bf02-e393-441c-a0bc-28c89759ac8d',
    email: 'test@example.com',
    password: '123456',
    name: '测试账号',
    age: 25,
    gender: '男',
    city: '北京',
    bio: '这是测试账户',
    interests: ['编程', '阅读'],
    needs: ['技术交流'],
    provide: ['技术分享'],
  },
  {
    id: '9d30c7ce-8030-410b-a785-8f04ed6e7b9c',
    email: 'user@example.com',
    password: 'password',
    name: '用户测试',
    age: 28,
    gender: '女',
    city: '上海',
    bio: '这是另一个测试账户',
    interests: ['设计', '旅行'],
    needs: ['设计灵感'],
    provide: ['作品分享'],
  },
]

async function seedDatabase() {
  console.log("开始批量导入种子数据到数据库...\n")

  try {
    // ========== 步骤 1：获取所有现有数据 ==========
    console.log("=== 步骤 1: 查询现有数据 ===")

    // 查询所有现有 users 和 user_profiles（2 次请求）
    const allExistingUsers = await db.select().from(users)
    const allExistingProfiles = await db.select().from(userProfiles)

    const existingEmailsSet = new Set(allExistingUsers.map(u => u.email))
    const existingProfileUserIds = new Set(allExistingProfiles.map(p => p.userId))

    console.log(`现有 users: ${allExistingUsers.length} 个`)
    console.log(`现有 user_profiles: ${allExistingProfiles.length} 个`)

    // ========== 步骤 2：批量准备数据 ==========
    console.log("\n=== 步骤 2: 批量准备数据 ===")

    const usersToInsert: any[] = []
    const profilesToInsert: any[] = []

    // 准备测试账户
    for (const account of TEST_ACCOUNTS) {
      if (!existingEmailsSet.has(account.email)) {
        const hashedPassword = await bcrypt.hash(account.password, 10)
        usersToInsert.push({
          id: account.id,
          email: account.email,
          password: hashedPassword,
          name: account.name,
        })
      }

      // 检查是否需要创建 profile
      if (!existingProfileUserIds.has(account.id)) {
        profilesToInsert.push({
          userId: account.id,
          name: account.name,
          age: account.age,
          gender: account.gender,
          city: account.city,
          avatarUrl: `/avatars/${account.id}.svg`,
          bio: account.bio,
          interests: account.interests,
          needs: account.needs,
          provide: account.provide,
        })
      }
    }

    // 准备 mock 用户
    for (const mockUser of MOCK_USERS) {
      const email = `user_${mockUser.id.split('-')[0]}@rugumock.com`

      if (!existingEmailsSet.has(email)) {
        const hashedPassword = await bcrypt.hash('mock123', 10)
        usersToInsert.push({
          id: mockUser.id,
          email,
          password: hashedPassword,
          name: mockUser.name,
        })
      }

      if (!existingProfileUserIds.has(mockUser.id)) {
        profilesToInsert.push({
          userId: mockUser.id,
          name: mockUser.name,
          age: mockUser.age,
          gender: mockUser.gender,
          city: mockUser.city,
          avatarUrl: `/avatars/${mockUser.id}.svg`,
          bio: mockUser.bio,
          interests: mockUser.interests,
          needs: mockUser.needs,
          provide: mockUser.provide,
        })
      }
    }

    // ========== 步骤 3：批量插入 ==========
    console.log(`\n=== 步骤 3: 批量插入数据 ===`)
    console.log(`准备插入 users: ${usersToInsert.length} 条`)
    console.log(`准备插入 user_profiles: ${profilesToInsert.length} 条`)

    if (usersToInsert.length > 0) {
      await db.insert(users).values(usersToInsert)
      console.log("✅ 批量插入 users 成功")
    } else {
      console.log("⏭️  users 已存在")
    }

    if (profilesToInsert.length > 0) {
      await db.insert(userProfiles).values(profilesToInsert)
      console.log("✅ 批量插入 user_profiles 成功")
    } else {
      console.log("⏭️  user_profiles 已存在")
    }

    // ========== 总结 ==========
    console.log("\n=== 导入完成 ===")
    console.log(`✅ 插入 users: ${usersToInsert.length} 条`)
    console.log(`✅ 插入 user_profiles: ${profilesToInsert.length} 条`)
    console.log("\n测试账户：")
    console.log(`  1. test@example.com / 123456`)
    console.log(`  2. user@example.com / password`)
    console.log("\nMock 用户账户（密码统一为 mock123）：")
    console.log(`  格式: user_xxx@rugumock.com / mock123`)

  } catch (error) {
    console.error("\n❌ 导入失败:", error)
    process.exit(1)
  }
}

seedDatabase()
