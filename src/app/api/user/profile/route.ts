import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { userProfiles, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromRequest } from "@/lib/session"

// 性别值映射（中文转英文）
function normalizeGender(gender: unknown): 'male' | 'female' | 'other' | undefined {
  if (gender === '男' || gender === 'male') return 'male'
  if (gender === '女' || gender === 'female') return 'female'
  if (gender === '保密' || gender === 'other' || gender === '其他') return 'other'
  return undefined
}

// 用户资料验证 schema
const profileSchema = z.object({
  name: z.string().min(1).max(50),
  age: z.number().min(1).max(100),
  gender: z.enum(["male", "female", "other"]).optional(),
  city: z.string().max(100).optional(),
  avatarUrl: z.string().optional(),  // 允许任意字符串（包括相对路径）
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).default([]),
  needs: z.array(z.string()).default([]),
  provide: z.array(z.string()).default([]),
})

// 获取当前用户资料
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    // 查询用户资料
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1)

    return NextResponse.json({
      data: profile || null
    })
  } catch (error) {
    console.error("获取用户资料错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}

// 创建或更新用户资料
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // 转换性别值（中文转英文）
    const normalizedBody = {
      ...body,
      gender: normalizeGender(body.gender)
    }

    // 验证资料数据
    const validatedProfile = profileSchema.safeParse(normalizedBody)
    if (!validatedProfile.success) {
      return NextResponse.json(
        { error: "资料数据无效", details: validatedProfile.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const profile = validatedProfile.data

    // 检查资料是否已存在
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1)

    let createdProfile

    if (existingProfile) {
      // 同时更新 users 表和 user_profiles 表的 name 字段
      if (profile.name) {
        await db
          .update(users)
          .set({ name: profile.name })
          .where(eq(users.id, userId))
      }

      // 更新现有资料
      ;[createdProfile] = await db
        .update(userProfiles)
        .set({
          ...profile,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning()
    } else {
      // 创建新资料时，同时更新 users 表的 name 字段
      if (profile.name) {
        await db
          .update(users)
          .set({ name: profile.name })
          .where(eq(users.id, userId))
      }

      ;[createdProfile] = await db
        .insert(userProfiles)
        .values({
          userId,
          ...profile,
        })
        .returning()
    }

    return NextResponse.json({
      data: createdProfile
    }, { status: existingProfile ? 200 : 201 })
  } catch (error) {
    console.error("创建/更新用户资料错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}

// 更新用户资料
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log("接收到的更新资料数据:", body)

    // 转换性别值（中文转英文）
    const normalizedBody = {
      ...body,
      gender: normalizeGender(body.gender)
    }
    console.log("转换后的数据:", normalizedBody)

    // 验证资料数据
    const validatedProfile = profileSchema.safeParse(normalizedBody)
    if (!validatedProfile.success) {
      console.error("资料验证失败:", validatedProfile.error.flatten().fieldErrors)
      return NextResponse.json(
        { error: "资料数据无效", details: validatedProfile.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const profile = validatedProfile.data

    // 同时更新 users 表和 user_profiles 表的 name 字段
    if (profile.name) {
      await db
        .update(users)
        .set({ name: profile.name })
        .where(eq(users.id, userId))
    }

    // 检查资料是否已存在
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1)

    let updatedProfile

    if (existingProfile) {
      // 更新现有资料
      ;[updatedProfile] = await db
        .update(userProfiles)
        .set({
          ...profile,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning()
    } else {
      // 创建新资料
      ;[updatedProfile] = await db
        .insert(userProfiles)
        .values({
          userId,
          ...profile,
        })
        .returning()
    }

    if (!updatedProfile) {
      return NextResponse.json(
        { error: "用户资料操作失败" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: updatedProfile
    })
  } catch (error) {
    console.error("更新用户资料错误:", error)
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
