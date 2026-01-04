import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { userProfiles, userEmbeddings } from "@/lib/db/schema";
import { generateEmbedding, generateUserProfileEmbeddings } from "@/lib/services/embedding-service";
import { getUserIdFromRequest } from "@/lib/session";
import { eq, and } from "drizzle-orm";

// 请求参数验证 schema
const generateSchema = z.object({
  embeddingType: z.enum(["interest", "need", "provide", "all"]).default("all"),
  forceRegenerate: z.boolean().default(false),
});

/**
 * POST /api/embeddings/generate
 * 手动触发当前用户的向量化
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    // 解析请求参数
    const body = await request.json().catch(() => ({}));
    const validatedData = generateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "参数无效", details: validatedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { embeddingType, forceRegenerate } = validatedData.data;

    // 1. 读取用户资料
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: "用户资料不存在，请先填写资料" },
        { status: 404 }
      );
    }

    // 2. 创建向量记录（pending 状态）
    const createResult = await generateUserProfileEmbeddings(userId, {
      interests: profile.interests || [],
      needs: profile.needs || [],
      provide: profile.provide || [],
    });

    // 3. 获取需要生成的向量记录
    const whereConditions = [
      eq(userEmbeddings.userId, userId),
      eq(userEmbeddings.embeddingGenerationStatus, "pending"),
    ];

    // 根据 embeddingType 过滤
    if (embeddingType !== "all") {
      whereConditions.push(eq(userEmbeddings.embeddingType, embeddingType));
    }

    const pendingEmbeddings = await db
      .select()
      .from(userEmbeddings)
      .where(and(...whereConditions))
      .orderBy(userEmbeddings.createdAt);

    if (pendingEmbeddings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: "没有需要生成的向量",
          total: 0,
          completed: 0,
          failed: 0,
        },
      });
    }

    // 4. 批量生成向量
    let completedCount = 0;
    let failedCount = 0;

    for (const embedding of pendingEmbeddings) {
      try {
        const vector = await generateEmbedding(embedding.sourceText);

        await db
          .update(userEmbeddings)
          .set({
            embedding: vector,
            embeddingGenerationStatus: "completed",
            embeddingGeneratedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userEmbeddings.id, embedding.id));

        completedCount++;
      } catch (error) {
        console.error(`生成向量失败 (${embedding.sourceText}):`, error);

        await db
          .update(userEmbeddings)
          .set({
            embeddingGenerationStatus: "failed",
            updatedAt: new Date(),
          })
          .where(eq(userEmbeddings.id, embedding.id));

        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "向量化完成",
        total: pendingEmbeddings.length,
        completed: completedCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error("向量化错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
