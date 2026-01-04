import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { matches, matchHistory, userProfiles } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getUserIdFromRequest } from "@/lib/session"

// 匹配操作验证 schema
const matchActionSchema = z.object({
  action: z.enum(["want_to_know", "passed", "block"]),
})

/**
 * POST /api/matches/[matchId]
 * 对匹配用户执行操作
 *
 * 支持的操作：
 * - want_to_know: 想认识（创建匹配记录）
 * - passed: 跳过（记录到历史）
 * - block: 拉黑
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    const { matchId } = await params

    // 验证操作类型
    const body = await request.json()
    const validatedBody = matchActionSchema.safeParse(body)

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: "操作类型无效", details: validatedBody.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { action } = validatedBody.data

    // 检查目标用户是否存在
    const [targetProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, matchId))
      .limit(1)

    if (!targetProfile) {
      return NextResponse.json(
        { error: "目标用户不存在" },
        { status: 404 }
      )
    }

    // 检查是否是自己
    if (matchId === userId) {
      return NextResponse.json(
        { error: "不能对自己执行此操作" },
        { status: 400 }
      )
    }

    switch (action) {
      case "want_to_know": {
        // 检查是否已经存在匹配记录
        const [existingMatch] = await db
          .select()
          .from(matches)
          .where(
            and(
              eq(matches.userId, userId),
              eq(matches.matchedUserId, matchId)
            )
          )
          .limit(1)

        if (existingMatch) {
          return NextResponse.json(
            { error: "已经对此用户执行过操作" },
            { status: 409 }
          )
        }

        // 检查对方是否也想认识我（双向匹配）
        const [theirMatch] = await db
          .select()
          .from(matches)
          .where(
            and(
              eq(matches.userId, matchId),
              eq(matches.matchedUserId, userId),
              eq(matches.matchType, "want_to_know")
            )
          )
          .limit(1)

        let matchType = "want_to_know"
        let isMutual = false

        if (theirMatch) {
          // 双向匹配成功！
          matchType = "mutual"
          isMutual = true

          // 更新对方的匹配类型为 mutual
          await db
            .update(matches)
            .set({ matchType: "mutual", updatedAt: new Date() })
            .where(eq(matches.id, theirMatch.id))
        }

        // 创建匹配记录
        let newMatch
        try {
          ;[newMatch] = await db
            .insert(matches)
            .values({
              userId: userId,
              matchedUserId: matchId,
              matchType,
            })
            .returning()
        } catch (insertError: any) {
          // 捕获唯一约束错误（可能是竞态条件导致的重复插入）
          if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
            // 记录已存在，尝试查询现有记录
            const [existing] = await db
              .select()
              .from(matches)
              .where(
                and(
                  eq(matches.userId, userId),
                  eq(matches.matchedUserId, matchId)
                )
              )
              .limit(1)

            if (existing) {
              return NextResponse.json(
                { error: "已经对此用户执行过操作" },
                { status: 409 }
              )
            }
          }
          // 其他错误继续抛出
          throw insertError
        }

        // 记录到匹配历史
        await db.insert(matchHistory).values({
          userId: userId,
          historyData: {
            matchId: newMatch.id,
            matchedUserId: matchId,
            matchType,
            similarityScore: null,
            viewedAt: new Date().toISOString(),
            action: "interested",
          },
        })

        return NextResponse.json({
          data: {
            match: newMatch,
            isMutual,
          }
        }, { status: 201 })
      }

      case "passed": {
        // 检查是否已经跳过过
        const existingHistory = await db
          .select()
          .from(matchHistory)
          .where(eq(matchHistory.userId, userId))
          .limit(50)

        const hasPassed = existingHistory?.some(
          (h) => h.historyData.matchedUserId === matchId && h.historyData.action === "passed"
        )

        if (hasPassed) {
          return NextResponse.json(
            { error: "已经跳过过此用户" },
            { status: 409 }
          )
        }

        // 记录跳过操作到历史
        await db.insert(matchHistory).values({
          userId: userId,
          historyData: {
            matchId: "",
            matchedUserId: matchId,
            matchType: "passed",
            similarityScore: null,
            viewedAt: new Date().toISOString(),
            action: "passed",
          },
        })

        return NextResponse.json({
          data: {
            message: "已跳过此用户",
          }
        })
      }

      case "block": {
        // 检查是否已经拉黑
        const [existingMatch] = await db
          .select()
          .from(matches)
          .where(
            and(
              eq(matches.userId, userId),
              eq(matches.matchedUserId, matchId),
              eq(matches.matchType, "block")
            )
          )
          .limit(1)

        if (existingMatch) {
          return NextResponse.json(
            { error: "已经拉黑过此用户" },
            { status: 409 }
          )
        }

        // 创建拉黑记录（删除之前的其他类型匹配记录）
        await db
          .delete(matches)
          .where(
            and(
              eq(matches.userId, userId),
              eq(matches.matchedUserId, matchId)
            )
          )

        await db
          .insert(matches)
          .values({
            userId: userId,
            matchedUserId: matchId,
            matchType: "block",
          })

        // 记录到历史
        await db.insert(matchHistory).values({
          userId: userId,
          historyData: {
            matchId: "",
            matchedUserId: matchId,
            matchType: "block",
            similarityScore: null,
            viewedAt: new Date().toISOString(),
            action: "blocked",
          },
        })

        return NextResponse.json({
          data: {
            message: "已拉黑此用户",
          }
        })
      }

      default:
        return NextResponse.json(
          { error: "不支持的操作" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("匹配操作错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/matches/[matchId]
 * 删除匹配记录（取消匹配）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    const { matchId } = await params

    // 查找匹配记录
    const [existingMatch] = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.userId, userId),
          eq(matches.matchedUserId, matchId)
        )
      )
      .limit(1)

    if (!existingMatch) {
      return NextResponse.json(
        { error: "匹配记录不存在" },
        { status: 404 }
      )
    }

    // 删除匹配记录
    await db
      .delete(matches)
      .where(eq(matches.id, existingMatch.id))

    // 如果是双向匹配，也需要删除对方的 mutual 记录
    if (existingMatch.matchType === "mutual") {
      await db
        .delete(matches)
        .where(
          and(
            eq(matches.userId, matchId),
            eq(matches.matchedUserId, userId),
            eq(matches.matchType, "mutual")
          )
        )
    }

    // 记录到历史
    await db.insert(matchHistory).values({
      userId: userId,
      historyData: {
        matchId: existingMatch.id,
        matchedUserId: matchId,
        matchType: existingMatch.matchType,
        similarityScore: existingMatch.similarityScore,
        viewedAt: (existingMatch.createdAt || new Date()).toISOString(),
        action: "passed",
      },
    })

    return NextResponse.json({
      data: {
        message: "已取消匹配",
      }
    })
  } catch (error) {
    console.error("删除匹配记录错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
