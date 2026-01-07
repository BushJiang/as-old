/**
 * 嵌入向量生成 API
 *
 * 在服务器端调用硅基流动 API，避免暴露 API key 给客户端
 */

import { NextRequest, NextResponse } from 'next/server'
import { SILICONFLOW_API_KEY } from '@/lib/env'

interface EmbeddingRequest {
  texts: string[]
}

interface EmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EmbeddingRequest
    const { texts } = body

    // 验证输入
    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'texts 必须是非空数组' },
        { status: 400 }
      )
    }

    // 验证每个文本
    for (const text of texts) {
      if (typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json(
          { error: '每个 text 必须是非空字符串' },
          { status: 400 }
        )
      }
    }

    // 调用硅基流动 API
    const response = await fetch('https://api.siliconflow.cn/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
      },
      body: JSON.stringify({
        input: texts,
        model: 'Pro/BAAI/bge-m3',
        encoding_format: 'float',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('硅基流动 API 错误:', error)
      return NextResponse.json(
        { error: error.message || '嵌入生成失败' },
        { status: response.status }
      )
    }

    const data: EmbeddingResponse = await response.json()

    // 返回嵌入向量
    return NextResponse.json({
      embeddings: data.data.map(item => item.embedding),
      model: data.model,
      usage: data.usage,
    })

  } catch (error) {
    console.error('嵌入生成错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    )
  }
}
