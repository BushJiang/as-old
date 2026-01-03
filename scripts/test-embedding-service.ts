/**
 * 测试嵌入服务
 */

import { generateEmbedding, getModelInfo, getCurrentProvider } from '../src/lib/services/embedding-service'

async function testEmbeddingService() {
  console.log('开始测试嵌入服务...\n')

  // 显示模型信息
  const modelInfo = getModelInfo()
  console.log('模型信息:')
  console.log(`  主服务: ${modelInfo.primary.provider} / ${modelInfo.primary.model}`)
  console.log(`  备用服务: ${modelInfo.fallback.provider} / ${modelInfo.fallback.model}`)
  console.log(`  当前使用: ${getCurrentProvider()}`)
  console.log()

  const testTexts = [
    '我喜欢阅读和旅行',
    '寻找志同道合的朋友',
  ]

  for (const text of testTexts) {
    try {
      console.log(`测试文本: "${text}"`)
      const startTime = Date.now()
      const embedding = await generateEmbedding(text)
      const duration = Date.now() - startTime

      console.log(`✅ 成功!`)
      console.log(`  - 向量维度: ${embedding.length}`)
      console.log(`  - 前 5 个值: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`)
      console.log(`  - 耗时: ${duration}ms`)
      console.log()

      // 测试相似度计算
      if (testTexts.indexOf(text) === 1) {
        const prevEmbedding = await generateEmbedding(testTexts[0])
        const similarity = cosineSimilarity(embedding, prevEmbedding)
        console.log(`  - 相似度: ${similarity.toFixed(4)}`)
        console.log()
      }
    } catch (error) {
      console.error(`❌ 失败: ${error}\n`)
    }
  }

  console.log('测试完成!')
}

// 余弦相似度计算
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('向量维度不匹配')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

testEmbeddingService().catch(console.error)
