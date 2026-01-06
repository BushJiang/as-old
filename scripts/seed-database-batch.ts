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
    name: '陈思远',
    age: 26,
    gender: '男',
    city: '北京',
    bio: '软件工程师，热爱开源和技术分享。喜欢在周末阅读技术博客，偶尔也会写写代码记录学习心得。寻找志同道合的朋友一起交流技术。',
    interests: ['编程', '阅读', '开源', 'AI'],
    needs: ['技术交流', '开源合作', 'AI学习'],
    provide: ['编程经验', '技术分享', '代码审查', '职业建议'],
  },
  {
    id: '9d30c7ce-8030-410b-a785-8f04ed6e7b9c',
    email: 'user@example.com',
    password: 'password',
    name: '林晓芸',
    age: 27,
    gender: '女',
    city: '上海',
    bio: 'UI/UX设计师，专注于用户体验设计。热爱旅行和摄影，用镜头记录生活中的美好瞬间。喜欢参观展览和艺术馆，寻找设计灵感。',
    interests: ['设计', '旅行', '摄影', '艺术'],
    needs: ['设计灵感', '作品反馈', '行业交流'],
    provide: ['设计经验', '用户研究', '原型设计', '视觉设计'],
  },
  {
    id: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
    email: 'demo@example.com',
    password: '123456',
    name: '王子健',
    age: 28,
    gender: '男',
    city: '深圳',
    bio: '产品经理，关注互联网产品和用户体验。热爱阅读和思考，喜欢和不同背景的人交流。业余时间喜欢跑步和健身，保持健康的生活方式。',
    interests: ['产品', '阅读', '跑步', '健身'],
    needs: ['行业交流', '产品思维', '职业发展'],
    provide: ['产品经验', '需求分析', '项目管理', '健身指导'],
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

    // 准备新用户（50位新增用户）
    const NEW_USERS = MOCK_USERS.slice(30) // 跳过前30个原有用户
    for (let i = 0; i < NEW_USERS.length; i++) {
      const newUser = NEW_USERS[i]
      // 使用索引生成唯一的 email（从034开始，因为001-033已被原有用户占用）
      const email = `user${String(i + 34).padStart(3, '0')}@rugumock.com`

      if (!existingEmailsSet.has(email)) {
        const hashedPassword = await bcrypt.hash('mock123', 10)
        usersToInsert.push({
          id: newUser.id,
          email,
          password: hashedPassword,
          name: newUser.name,
        })
      }

      if (!existingProfileUserIds.has(newUser.id)) {
        profilesToInsert.push({
          userId: newUser.id,
          name: newUser.name,
          age: newUser.age,
          gender: newUser.gender,
          city: newUser.city,
          avatarUrl: `/avatars/${newUser.id}.svg`,
          bio: newUser.bio,
          interests: newUser.interests,
          needs: newUser.needs,
          provide: newUser.provide,
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
    console.log(`  1. test@example.com / 123456 (陈思远)`)
    console.log(`  2. user@example.com / password (林晓芸)`)
    console.log(`  3. demo@example.com / 123456 (王子健)`)
    console.log("\nMock 用户账户（密码统一为 mock123）：")
    console.log(`  格式: user_xxx@rugumock.com / mock123`)

  } catch (error) {
    console.error("\n❌ 导入失败:", error)
    process.exit(1)
  }
}

seedDatabase()
