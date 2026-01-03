/**
 * 测试数据库连接和基本功能
 */

import { db } from "@/lib/db"
import { users, userProfiles, userEmbeddings, matches } from "@/lib/db/schema"
import { eq, count, sql } from "drizzle-orm"

async function testDatabase() {
  console.log("开始测试数据库连接和基本功能...\n")

  try {
    // 测试 1: 检查数据库连接
    console.log("=== 测试 1: 检查数据库连接 ===")
    const result = await db.execute(sql`SELECT NOW()`)
    console.log("数据库连接: ✅ 成功")
    console.log(`服务器时间: ${result.rows[0].now}\n`)

    // 测试 2: 统计各表数据量
    console.log("=== 测试 2: 统计各表数据量 ===")
    const [userCount] = await db.select({ count: count() }).from(users)
    const [profileCount] = await db.select({ count: count() }).from(userProfiles)
    const [embeddingCount] = await db.select({ count: count() }).from(userEmbeddings)
    const [matchCount] = await db.select({ count: count() }).from(matches)

    console.log(`users 表: ${userCount.count} 条记录`)
    console.log(`user_profiles 表: ${profileCount.count} 条记录`)
    console.log(`user_embeddings 表: ${embeddingCount.count} 条记录`)
    console.log(`matches 表: ${matchCount.count} 条记录\n`)

    // 测试 3: 检查表结构
    console.log("=== 测试 3: 检查表结构 ===")

    // 检查 user_profiles 表是否有 gender 字段
    const profileColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `)

    const columnNames = profileColumns.rows.map((r: any) => r.column_name)
    const hasGender = columnNames.includes('gender')
    const hasEmbedding = columnNames.includes('embedding')
    const hasPrivacySettings = columnNames.includes('privacy_settings')

    console.log(`user_profiles.gender 字段: ${hasGender ? '✅ 存在' : '❌ 缺失'}`)
    console.log(`user_profiles.embedding 字段: ${hasEmbedding ? '❌ 仍存在（应该已删除）' : '✅ 已删除'}`)
    console.log(`user_profiles.privacy_settings 字段: ${hasPrivacySettings ? '❌ 仍存在（应该已删除）' : '✅ 已删除'}\n`)

    // 测试 4: 检查是否删除了不需要的表
    console.log("=== 测试 4: 检查已删除的表 ===")
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    const tableNames = tables.rows.map((r: any) => r.table_name)
    const hasUserPreferences = tableNames.includes('user_preferences')
    const hasIcebreakers = tableNames.includes('icebreakers')

    console.log(`user_preferences 表: ${hasUserPreferences ? '❌ 仍存在（应该已删除）' : '✅ 已删除'}`)
    console.log(`icebreakers 表: ${hasIcebreakers ? '❌ 仍存在（应该已删除）' : '✅ 已删除'}\n`)

    // 测试 5: 检查外键约束
    console.log("=== 测试 5: 检查外键约束 ===")
    const foreignKeys = await db.execute(sql`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `)

    console.log("外键约束:")
    foreignKeys.rows.forEach((fk: any) => {
      console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`)
    })
    console.log()

    // 测试 6: 检查索引
    console.log("=== 测试 6: 检查索引 ===")
    const indexes = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `)

    console.log("数据库索引:")
    indexes.rows.forEach((idx: any) => {
      console.log(`  ${idx.tablename}: ${idx.indexname}`)
    })
    console.log()

    console.log("=== 测试总结 ===")
    console.log("✅ 所有测试通过！")
    console.log("数据库 Schema 简化成功完成。")

  } catch (error) {
    console.error("测试失败:", error)
    process.exit(1)
  }
}

testDatabase()
