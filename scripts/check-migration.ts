/**
 * 检查数据库迁移是否成功
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || '')

async function checkMigration() {
  console.log('开始检查数据库迁移...\n')

  try {
    // 1. 检查所有表
    console.log('=== 1. 检查数据库表 ===')
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log('当前数据库中的表：')
    tables.forEach((t: any) => console.log(`  - ${t.table_name}`))

    // 2. 检查是否删除了不需要的表
    console.log('\n=== 2. 验证已删除的表 ===')
    const deletedTables = ['user_preferences', 'icebreakers']
    for (const tableName of deletedTables) {
      const exists = tables.some((t: any) => t.table_name === tableName)
      console.log(`  ${tableName}: ${exists ? '❌ 仍然存在（需要手动删除）' : '✅ 已成功删除'}`)
    }

    // 3. 检查 user_profiles 表的字段
    console.log('\n=== 3. 检查 user_profiles 表字段 ===')
    const userProfileColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `
    console.log('user_profiles 表字段：')
    userProfileColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`)
    })

    // 4. 验证 user_profiles 表的字段删除
    console.log('\n=== 4. 验证 user_profiles 字段删除 ===')
    const fieldsToDelete = ['embedding', 'embedding_generated_at', 'embedding_generation_status', 'privacy_settings']
    for (const fieldName of fieldsToDelete) {
      const exists = userProfileColumns.some((col: any) => col.column_name === fieldName)
      console.log(`  ${fieldName}: ${exists ? '❌ 仍然存在（需要手动删除）' : '✅ 已成功删除'}`)
    }

    // 5. 验证 gender 字段是否添加
    console.log('\n=== 5. 验证 gender 字段 ===')
    const hasGender = userProfileColumns.some((col: any) => col.column_name === 'gender')
    console.log(`  gender 字段: ${hasGender ? '✅ 已成功添加' : '❌ 未添加（需要手动添加）'}`)

    // 6. 检查 matches 表的字段
    console.log('\n=== 6. 检查 matches 表字段 ===')
    const matchColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'matches'
      ORDER BY ordinal_position
    `
    console.log('matches 表字段：')
    matchColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

    // 7. 验证 metadata 字段是否删除
    console.log('\n=== 7. 验证 matches.metadata 字段删除 ===')
    const hasMetadata = matchColumns.some((col: any) => col.column_name === 'metadata')
    console.log(`  metadata 字段: ${hasMetadata ? '❌ 仍然存在（需要手动删除）' : '✅ 已成功删除'}`)

    // 8. 检查索引
    console.log('\n=== 8. 检查 user_profiles 表索引 ===')
    const indexes = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'user_profiles'
      ORDER BY indexname
    `
    console.log('user_profiles 表索引：')
    indexes.forEach((idx: any) => console.log(`  - ${idx.indexname}`))

    // 9. 验证 embedding_status 索引是否删除
    console.log('\n=== 9. 验证 embedding_status 索引删除 ===')
    const hasEmbeddingIndex = indexes.some((idx: any) => idx.indexname === 'idx_user_profiles_embedding_status')
    console.log(`  idx_user_profiles_embedding_status: ${hasEmbeddingIndex ? '❌ 仍然存在（需要手动删除）' : '✅ 已成功删除'}`)

    // 总结
    console.log('\n=== 迁移检查总结 ===')
    const currentTableCount = tables.length
    const expectedTableCount = 5 // users, user_profiles, matches, match_history, user_embeddings

    console.log(`当前表数量: ${currentTableCount}（预期: ${expectedTableCount}）`)
    console.log(`保留的 5 张核心表:`)
    const coreTables = ['users', 'user_profiles', 'matches', 'match_history', 'user_embeddings']
    coreTables.forEach((tableName) => {
      const exists = tables.some((t: any) => t.table_name === tableName)
      console.log(`  ${tableName}: ${exists ? '✅' : '❌ 缺失'}`)
    })

  } catch (error) {
    console.error('检查失败:', error)
  }
}

checkMigration()
