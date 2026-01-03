/**
 * 测试阿里百炼大模型 (qwen-plus-2025-07-28)
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || 'sk-c0de530e8a8640259022efa1650ce09a',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
})

async function testQwenModel() {
  console.log('开始测试阿里百炼大模型...\n')

  try {
    const messages = [
      {
        role: 'system',
        content: '你是如故社交匹配应用的 AI 助手，帮助用户生成破冰话题和匹配洞察。'
      },
      {
        role: 'user',
        content: '请为一个喜欢阅读、旅行的用户，生成 3 个破冰话题，每句话不超过 20 字。'
      }
    ]

    console.log('发送请求...')
    console.log(`模型: ${process.env.DASHSCOPE_MODEL || 'qwen-plus-2025-07-28'}`)
    console.log('启用思考过程: enable_thinking=true')
    console.log()

    const stream = await openai.chat.completions.create({
      model: process.env.DASHSCOPE_MODEL || 'qwen-plus-2025-07-28',
      messages,
      stream: true,
      enable_thinking: true
    })

    let isAnswering = false
    let thinkingContent = ''
    let answerContent = ''

    console.log('='.repeat(20) + ' 思考过程 ' + '='.repeat(20))

    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta

      // 思考过程
      if (delta.reasoning_content !== undefined && delta.reasoning_content !== null) {
        if (!isAnswering) {
          process.stdout.write(delta.reasoning_content)
          thinkingContent += delta.reasoning_content
        }
      }

      // 正式回复
      if (delta.content !== undefined && delta.content) {
        if (!isAnswering) {
          console.log('\n' + '='.repeat(20) + ' 完整回复 ' + '='.repeat(20))
          isAnswering = true
        }
        process.stdout.write(delta.content)
        answerContent += delta.content
      }
    }

    console.log('\n\n' + '='.repeat(20) + ' 统计信息 ' + '='.repeat(20))
    console.log(`思考内容长度: ${thinkingContent.length} 字`)
    console.log(`回复内容长度: ${answerContent.length} 字`)
    console.log('✅ 测试成功!')

  } catch (error) {
    console.error('\n❌ 错误:', error)
  }
}

testQwenModel()
