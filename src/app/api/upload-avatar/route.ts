import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json(
        { error: '缺少文件或用户ID' },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      )
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小超过限制' },
        { status: 400 }
      )
    }

    // 确保 avatars 目录存在
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars')
    if (!existsSync(avatarsDir)) {
      await mkdir(avatarsDir, { recursive: true })
    }

    // 确定文件扩展名
    const ext = file.name.split('.').pop()
    // 添加时间戳确保每次上传都是新文件，避免浏览器缓存
    const timestamp = Date.now()
    const filename = `${userId}.${timestamp}.${ext || 'jpg'}`
    const filepath = path.join(avatarsDir, filename)

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // 返回公开访问的 URL（带时间戳）
    const avatarUrl = `/avatars/${filename}?t=${timestamp}`

    return NextResponse.json({
      avatarUrl,
      message: '上传成功'
    })

  } catch (error) {
    console.error('头像上传失败:', error)
    return NextResponse.json(
      { error: '上传失败' },
      { status: 500 }
    )
  }
}
