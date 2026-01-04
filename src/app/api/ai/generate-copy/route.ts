/**
 * AI 文案生成 API
 *
 * 调用 LLM 生成匹配文案
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 验证 schema
const generateCopySchema = z.object({
  prompt: z.string().min(1),
})

// LLM API 配置
const CHAT_API_URL = 'https://api.siliconflow.cn/v1/chat/completions'
const API_KEY = process.env.SILICONFLOW_API_KEY || ''

const MODEL = 'Qwen/Qwen2.5-7B-Instruct' // 或其他支持的模型

/**
 * POST /api/ai/generate-copy
 * 生成匹配文案
 */
export async function POST(request: NextRequest) {
  try {
    // 验证请求体
    const body = await request.json()
    const validatedBody = generateCopySchema.safeParse(body)

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: '请求参数无效', details: validatedBody.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { prompt } = validatedBody.data

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API 密钥未配置' },
        { status: 500 }
      )
    }

    // 调用 LLM API
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文案生成助手，严格按照用户要求的 JSON 格式输出结果，不要添加任何额外的解释或 Markdown 标记。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('LLM API 错误:', errorText)
      return NextResponse.json(
        { error: 'LLM API 调用失败', details: errorText },
        { status: 500 }
      )
    }

    const data = await response.json()

    // 提取生成的内容
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'LLM 返回内容为空' },
        { status: 500 }
      )
    }

    // 清理可能的 Markdown 代码块标记
    let cleanedContent = content.trim()
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7)
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3)
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3)
    }
    cleanedContent = cleanedContent.trim()

    // 尝试解析 JSON
    let parsedResult
    try {
      parsedResult = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON 解析失败:', cleanedContent)
      // 如果解析失败，返回原始内容
      parsedResult = {
        hook: '志同道合的朋友',
        bridge: cleanedContent,
        cta: '聊聊吧？',
      }
    }

    return NextResponse.json({
      result: JSON.stringify(parsedResult),
    })
  } catch (error) {
    console.error('文案生成错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
