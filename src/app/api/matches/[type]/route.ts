/**
 * 匹配 API 路由
 *
 * 支持的匹配类型：
 * - similar-interests: 兴趣相投
 * - mutual-needs: 互助合作
 * - comprehensive: 综合匹配
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  findSimilarInterests,
  findMutualNeeds,
  findComprehensiveMatches,
} from '@/lib/services/matching-service'

type MatchType = 'similar-interests' | 'mutual-needs' | 'comprehensive'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params

    // 验证匹配类型
    const validTypes: MatchType[] = ['similar-interests', 'mutual-needs', 'comprehensive']
    if (!validTypes.includes(type as MatchType)) {
      return NextResponse.json(
        { error: '无效的匹配类型' },
        { status: 400 }
      )
    }

    // 从查询参数获取当前用户ID
    // TODO: 从 NextAuth session 中获取真实用户ID
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 401 }
      )
    }

    // 获取限制参数
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // 根据类型调用不同的匹配服务
    let matches
    switch (type as MatchType) {
      case 'similar-interests':
        matches = await findSimilarInterests(userId, limit)
        break
      case 'mutual-needs':
        matches = await findMutualNeeds(userId, limit)
        break
      case 'comprehensive':
        matches = await findComprehensiveMatches(userId, limit)
        break
    }

    return NextResponse.json({
      success: true,
      matches,
      count: matches.length,
    })
  } catch (error) {
    console.error('匹配 API 错误:', error)
    return NextResponse.json(
      { error: '匹配失败，请稍后重试' },
      { status: 500 }
    )
  }
}
