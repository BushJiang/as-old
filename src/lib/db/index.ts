/**
 * 数据库连接和导出
 *
 * 使用 Neon PostgreSQL + pgvector 扩展
 * Drizzle ORM 作为数据库操作层
 */

import { drizzle } from 'drizzle-orm/neon-http'
import { neon, neonConfig } from '@neondatabase/serverless'
import * as schema from './schema'

// 导出 schema 表定义
export * from './schema'

// 配置 Neon 连接
neonConfig.fetchConnectionCache = true

// 创建数据库连接实例
function createDbConnection() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL 环境变量未设置')
  }

  const sql = neon(url)
  return drizzle(sql, { schema })
}

// 单例数据库连接
let dbInstance: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDbConnection()
  }
  return dbInstance
}

// 默认导出数据库连接
export const db = getDb()
