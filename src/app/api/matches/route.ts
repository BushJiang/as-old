import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  findSimilarInterests,
  findMutualNeeds,
  findComprehensiveMatches,
  findExploratoryDiscovery,
  findMutualProvide,
  type MatchResult
} from "@/lib/services/matching-service"
import { db } from "@/lib/db"
import { userProfiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromRequest } from "@/lib/session"

// 匹配模式验证 schema
const matchQuerySchema = z.object({
  mode: z.enum([
    "similar-interests",
    "mutual-needs",
    "mutual-provide",
    "exploratory-discovery",
    "comprehensive"
  ]).default("comprehensive"),
  limit: z.string().transform(val => parseInt(val, 10)).default(10),
  offset: z.string().transform(val => parseInt(val, 10)).default(0),
})

/**
 * GET /api/matches
 * 获取推荐匹配列表
 *
 * 支持的匹配模式：
 * - similar-interests: 兴趣相投匹配（兴趣向量相似度）
 * - mutual-needs: 需求匹配（我的需求 vs 他们的提供）
 * - mutual-provide: 互助合作（我的提供 vs 他们的需求）
 * - exploratory-discovery: 探索发现（反向推荐，打破信息茧房）
 * - comprehensive: 综合匹配（结合以上两种）
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    // 验证查询参数
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const validatedQuery = matchQuerySchema.safeParse(searchParams)

    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: "查询参数无效", details: validatedQuery.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { mode, limit, offset } = validatedQuery.data

    // 检查用户是否已创建资料
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1)

    if (!profile) {
      return NextResponse.json(
        { error: "请先创建个人资料" },
        { status: 400 }
      )
    }

    // 根据匹配模式调用对应的服务
    let matches: MatchResult[] = []

    switch (mode) {
      case "similar-interests":
        matches = await findSimilarInterests(userId, limit + offset)
        break
      case "mutual-needs":
        matches = await findMutualNeeds(userId, limit + offset)
        break
      case "mutual-provide":
        matches = await findMutualProvide(userId, limit + offset)
        break
      case "exploratory-discovery":
        matches = await findExploratoryDiscovery(userId, limit + offset)
        break
      case "comprehensive":
        matches = await findComprehensiveMatches(userId, limit + offset)
        break
    }

    // 应用分页
    const paginatedMatches = matches.slice(offset, offset + limit)

    return NextResponse.json({
      data: paginatedMatches
    })
  } catch (error) {
    console.error("获取匹配列表错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
