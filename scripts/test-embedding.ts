/**
 * 测试硅基流动嵌入模型 API
 */

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || 'sk-akeqmwncwuangpyythireicqaujirrrlupguzljahjqjrhhv'
const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/embeddings'

async function testSiliconFlowEmbedding() {
  console.log('开始测试硅基流动嵌入模型 API...\n')

  const testTexts = [
    '你好，世界',
    '我喜欢阅读和旅行',
    '寻找志同道合的朋友',
  ]

  for (const text of testTexts) {
    try {
      console.log(`测试文本: "${text}"`)

      const response = await fetch(SILICONFLOW_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'Pro/BAAI/bge-m3',
          input: text,
          encoding_format: 'float',
        }),
      })

      console.log(`HTTP 状态: ${response.status}`)

      if (!response.ok) {
        const error = await response.text()
        console.error(`❌ API 调用失败: ${error}\n`)
        continue
      }

      const data = await response.json()

      // 验证响应格式
      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        console.error('❌ 响应格式不正确\n')
        continue
      }

      const embedding = data.data[0].embedding

      console.log(`✅ 成功!`)
      console.log(`  - 向量维度: ${embedding.length}`)
      console.log(`  - 前 5 个值: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`)
      console.log(`  - 模型: ${data.model}`)
      console.log(`  - Token 使用: ${data.usage?.total_tokens || 'N/A'}`)
      console.log()

    } catch (error) {
      console.error(`❌ 请求失败: ${error}\n`)
    }
  }

  console.log('测试完成!')
}

// 运行测试
testSiliconFlowEmbedding().catch(console.error)
