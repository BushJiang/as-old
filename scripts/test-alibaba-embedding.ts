/**
 * 测试阿里云嵌入模型 API
 */

const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY || ''
const ALIBABA_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings'

async function testAlibabaEmbedding() {
  console.log('开始测试阿里云嵌入模型 API...\n')

  if (!ALIBABA_API_KEY) {
    console.error('❌ ALIBABA_API_KEY 环境变量未配置')
    console.log('请在 .env 文件中设置: ALIBABA_API_KEY=your-key-here')
    console.log('\n获取阿里云 API Key:')
    console.log('1. 访问: https://dashscope.aliyun.com/')
    console.log('2. 开通灵积服务')
    console.log('3. 创建 API Key')
    return
  }

  const testTexts = [
    '你好，世界',
    '我喜欢阅读和旅行',
    '寻找志同道合的朋友',
  ]

  for (const text of testTexts) {
    try {
      console.log(`测试文本: "${text}"`)

      const response = await fetch(ALIBABA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ALIBABA_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-v4',
          input: text,
          dimensions: 1024,
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
        console.error('❌ 响应格式不正确')
        console.log('响应数据:', JSON.stringify(data, null, 2))
        console.log()
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
testAlibabaEmbedding().catch(console.error)
