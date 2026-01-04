import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userEmbeddings } from "@/lib/db/schema";
import { getUserIdFromRequest } from "@/lib/session";
import { eq, and, count, sql } from "drizzle-orm";

/**
 * GET /api/embeddings/status
 * 查询当前用户的向量化状态
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    // 统计各种状态的向量数量
    const [statusStats] = await db
      .select({
        pending: count(sql`CASE WHEN embedding_generation_status = 'pending' THEN 1 END`),
        processing: count(sql`CASE WHEN embedding_generation_status = 'processing' THEN 1 END`),
        completed: count(sql`CASE WHEN embedding_generation_status = 'completed' THEN 1 END`),
        failed: count(sql`CASE WHEN embedding_generation_status = 'failed' THEN 1 END`),
        total: count(),
      })
      .from(userEmbeddings)
      .where(eq(userEmbeddings.userId, userId));

    if (!statusStats || statusStats.total === 0) {
      return NextResponse.json({
        success: true,
        data: {
          status: "not_started",
          progress: 0,
          total: 0,
          pending: 0,
          completed: 0,
          failed: 0,
        },
      });
    }

    // 计算进度
    const progress = statusStats.total > 0
      ? Math.round((statusStats.completed / statusStats.total) * 100)
      : 0;

    // 确定整体状态
    let overallStatus: "pending" | "processing" | "completed" | "failed" | "not_started" = "not_started";

    if (statusStats.pending > 0 && statusStats.completed === 0) {
      overallStatus = "pending";
    } else if (statusStats.pending > 0 || statusStats.processing > 0) {
      overallStatus = "processing";
    } else if (statusStats.failed > 0 && statusStats.completed === 0) {
      overallStatus = "failed";
    } else if (statusStats.completed > 0 && statusStats.pending === 0) {
      overallStatus = "completed";
    }

    return NextResponse.json({
      success: true,
      data: {
        status: overallStatus,
        progress,
        total: statusStats.total,
        pending: statusStats.pending,
        processing: statusStats.processing,
        completed: statusStats.completed,
        failed: statusStats.failed,
      },
    });
  } catch (error) {
    console.error("查询向量化状态错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
