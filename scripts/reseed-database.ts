/**
 * 重新导入数据库脚本
 *
 * 功能：
 * 1. 清空现有数据（users、user_profiles、user_embeddings）
 * 2. 导入所有 Mock 用户（80位）
 * 3. 导入测试账户
 *
 * 警告：此脚本会删除所有现有数据！
 */

import { db } from "@/lib/db"
import { users, userProfiles, userEmbeddings } from "@/lib/db/schema"
import { MOCK_USERS } from "../data/mock/users"
import bcrypt from "bcryptjs"

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
    interests: ['Go语言后端开发', '阅读技术博客', 'GitHub开源项目', 'AI应用研究'],
    needs: ['后端技术交流', '开源项目共建', 'AI应用开发'],
    provide: ['分布式系统设计', '微服务架构指导', '开源代码贡献', '技术趋势分享'],
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
    interests: ['UI设计研究', '独自背包旅行', '旅行摄影', '艺术展览参观'],
    needs: ['设计灵感启发', '作品反馈指导', '行业交流圈子'],
    provide: ['用户体验优化', '用户研究服务', '原型设计指导', '视觉设计咨询'],
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
    interests: ['互联网产品', '阅读心理学书籍', '晨跑训练', '健身房锻炼'],
    needs: ['产品思维交流', '职业发展建议', '行业人脉拓展'],
    provide: ['产品规划经验', '需求分析方法', '项目管理指导', '健身训练计划'],
  },
]

async function reseedDatabase() {
  console.log("=".repeat(80))
  console.log("🔄 开始重新导入数据库")
  console.log("=".repeat(80))

  try {
    // ========== 步骤 1：清空现有数据 ==========
    console.log("\n=== 步骤 1: 清空现有数据 ===")

    console.log("🗑️  删除 user_embeddings...")
    await db.delete(userEmbeddings)
    console.log("✅ 已删除 user_embeddings")

    console.log("🗑️  删除 user_profiles...")
    await db.delete(userProfiles)
    console.log("✅ 已删除 user_profiles")

    console.log("🗑️  删除 users...")
    await db.delete(users)
    console.log("✅ 已删除 users")

    // ========== 步骤 2：批量准备数据 ==========
    console.log("\n=== 步骤 2: 批量准备数据 ===")

    const usersToInsert: any[] = []
    const profilesToInsert: any[] = []

    // 准备测试账户
    for (const account of TEST_ACCOUNTS) {
      const hashedPassword = await bcrypt.hash(account.password, 10)
      usersToInsert.push({
        id: account.id,
        email: account.email,
        password: hashedPassword,
        name: account.name,
      })

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

    // 准备 Mock 用户（全部80位）
    for (let i = 0; i < MOCK_USERS.length; i++) {
      const mockUser = MOCK_USERS[i]
      const email = `user${String(i + 1).padStart(3, '0')}@rugumock.com`

      const hashedPassword = await bcrypt.hash('mock123', 10)
      usersToInsert.push({
        id: mockUser.id,
        email,
        password: hashedPassword,
        name: mockUser.name,
      })

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

    console.log(`准备插入 users: ${usersToInsert.length} 条`)
    console.log(`准备插入 user_profiles: ${profilesToInsert.length} 条`)

    // ========== 步骤 3：批量插入 ==========
    console.log("\n=== 步骤 3: 批量插入数据 ===")

    console.log("📝 插入 users...")
    await db.insert(users).values(usersToInsert)
    console.log("✅ 批量插入 users 成功")

    console.log("📝 插入 user_profiles...")
    await db.insert(userProfiles).values(profilesToInsert)
    console.log("✅ 批量插入 user_profiles 成功")

    // ========== 总结 ==========
    console.log("\n" + "=".repeat(80))
    console.log("✅ 数据导入完成")
    console.log("=".repeat(80))
    console.log(`总计导入: ${usersToInsert.length} 个用户`)
    console.log(`  - 测试账户: ${TEST_ACCOUNTS.length} 个`)
    console.log(`  - Mock 用户: ${MOCK_USERS.length} 个`)
    console.log("\n📋 测试账户：")
    console.log(`  1. test@example.com / 123456 (陈思远)`)
    console.log(`  2. user@example.com / password (林晓芸)`)
    console.log(`  3. demo@example.com / 123456 (王子健)`)
    console.log("\n📋 Mock 用户账户（密码统一为 mock123）：")
    console.log(`  格式: user_xxx@rugumock.com / mock123`)
    console.log(`  范围: user_001@rugumock.com ~ user_080@rugumock.com`)
    console.log("\n⚠️  下一步：运行以下命令生成向量")
    console.log(`  1. bun run scripts/generate-embeddings-offline.ts  # 离线生成向量缓存`)
    console.log(`  2. bun run scripts/upload-cached-embeddings.ts      # 上传向量到数据库`)
    console.log("=".repeat(80))

  } catch (error) {
    console.error("\n❌ 导入失败:", error)
    process.exit(1)
  }
}

reseedDatabase()
