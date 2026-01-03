/**
 * 执行数据库迁移脚本
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join } from 'path'

const sql = neon(process.env.DATABASE_URL || '')

async function runMigration() {
  console.log('开始执行数据库迁移...\n')

  try {
    // 读取 SQL 迁移脚本
    const migrationSQL = readFileSync(
      join(process.cwd(), 'drizzle/0002_simplify_schema.sql'),
      'utf-8'
    )

    console.log('执行 SQL:')
    console.log('---')
    console.log(migrationSQL)
    console.log('---\n')

    // 执行迁移（逐条执行）
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`执行: ${statement.substring(0, 50)}...`)
        await sql.query(statement)
      }
    }

    console.log('\n 迁移完成!')

  } catch (error) {
    console.error(' 迁移失败:', error)
    process.exit(1)
  }
}

runMigration()
