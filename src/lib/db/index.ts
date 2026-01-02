/**
 * 数据库连接和导出
 *
 * 使用 Neon PostgreSQL + pgvector 扩展
 * Drizzle ORM 作为数据库操作层
 */

import { drizzle } from '@neondatabase/serverless'
import { neon, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// 设置 WebSocket 用于 Neon 无服务器连接
neonConfig.webSocketConstructor = ws

// 导出 schema 表定义
export * from './schema'

// 创建数据库连接实例
function createDbConnection() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL 环境变量未设置')
  }

  const sql = neon(url)
  return drizzle(sql)
}

// 单例数据库连接
let db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!db) {
    db = createDbConnection()
  }
  return db
}

// 默认导出数据库连接
export const db = getDb()
