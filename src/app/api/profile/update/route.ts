/**
 * 用户资料更新 API
 *
 * 功能：
 * - 更新用户资料
 * - 触发向量生成任务（异步）
 * - 立即返回成功，不阻塞用户操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateUserProfileEmbeddings } from '@/lib/services/embedding-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, age, city, bio, interests, needs, provide } = body

    // 验证必填字段
    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      )
    }

    // 更新用户资料
    await db.update(userProfiles)
      .set({
        name,
        age,
        city,
        bio,
        interests: interests || [],
        needs: needs || [],
        provide: provide || [],
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))

    // 异步生成向量（不等待完成）
    generateUserProfileEmbeddings(userId, {
      interests: interests || [],
      needs: needs || [],
      provide: provide || [],
    }).catch(error => {
      console.error('向量生成任务创建失败:', error)
    })

    return NextResponse.json({
      success: true,
      message: '资料更新成功，向量正在后台生成',
    })
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return NextResponse.json(
      { error: '更新失败，请稍后重试' },
      { status: 500 }
    )
  }
}
