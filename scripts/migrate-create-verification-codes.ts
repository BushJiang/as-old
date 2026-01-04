/**
 * 创建邮箱验证码表
 */

import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

async function migrate() {
  console.log("开始创建邮箱验证码表...")

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_verification_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_email_codes_email_created
      ON email_verification_codes(email, created_at);
    `)

    console.log("✅ 邮箱验证码表创建成功")
  } catch (error) {
    console.error("❌ 创建表失败:", error)
    process.exit(1)
  }
}

migrate()
