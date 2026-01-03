import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = await neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function verifyDatabase() {
  try {
    // 1. 检查 pgvector 扩展
    const extensions = await sql`SELECT extname FROM pg_extension WHERE extname = 'vector';`
    console.log('📦 pgvector 扩展:', extensions.length > 0 ? '✅ 已启用' : '❌ 未启用')

    // 2. 检查表是否创建成功
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
    console.log('\n📊 已创建的表:')
    tables.forEach((t: any) => console.log(`  - ${t.table_name}`))

    // 3. 检查 vector 类型是否可用
    const vectorType = await sql`SELECT typname FROM pg_type WHERE typname = 'vector';`
    console.log('\n🔢 vector 类型:', vectorType.length > 0 ? '✅ 可用' : '❌ 不可用')

    // 4. 检查索引
    const indexes = await sql`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `
    console.log('\n🔍 已创建的索引:', indexes.length, '个')

    console.log('\n✅ 数据库验证完成！')
    process.exit(0)
  } catch (error) {
    console.error('❌ 数据库验证失败:', error)
    process.exit(1)
  }
}

verifyDatabase()
