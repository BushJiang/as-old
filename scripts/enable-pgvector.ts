import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = await neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function enablePgVector() {
  try {
    await db.execute('CREATE EXTENSION IF NOT EXISTS vector;')
    console.log('✅ pgvector 扩展已启用')
    process.exit(0)
  } catch (error) {
    console.error('❌ 启用 pgvector 扩展失败:', error)
    process.exit(1)
  }
}

enablePgVector()
