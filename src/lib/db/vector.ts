import { sql } from "drizzle-orm"

/**
 * 向量相似度搜索辅助函数
 *
 * 使用 pgvector 的操作符进行向量搜索
 * 参考：https://github.com/pgvector/pgvector
 */

/**
 * JavaScript 版本：计算两个向量的余弦距离
 * 范围：0（完全相同）到 2（完全相反）
 *
 * @param a 向量 A（1024维数组）
 * @param b 向量 B（1024维数组）
 * @returns 余弦距离
 */
export function cosineDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`向量长度不匹配: ${a.length} vs ${b.length}`)
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const cosineSimilarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  return 1 - cosineSimilarity
}

/**
 * SQL 版本：余弦距离（Cosine Distance）
 * 范围：0（完全相同）到 2（完全相反）
 * 操作符：<=>
 *
 * @param embeddingColumn 向量列
 * @param queryVector 查询向量（1024维数组）
 * @returns SQL 片段
 */
export function vectorCosineDistance(
  embeddingColumn: any,
  queryVector: number[]
) {
  return sql`${embeddingColumn} <=> ${JSON.stringify(queryVector)}::vector`
}

/**
 * 欧氏距离（L2 Distance）
 * 范围：0（完全相同）到正无穷
 * 操作符：<->
 *
 * @param embeddingColumn 向量列
 * @param queryVector 查询向量（1024维数组）
 * @returns SQL 片段
 */
export function vectorL2Distance(
  embeddingColumn: any,
  queryVector: number[]
) {
  return sql`${embeddingColumn} <-> ${JSON.stringify(queryVector)}::vector`
}

/**
 * 内积（Inner Product）
 * 范围：负无穷到正 infinity
 * 操作符：<#>
 *
 * @param embeddingColumn 向量列
 * @param queryVector 查询向量（1024维数组）
 * @returns SQL 片段
 */
export function vectorInnerProduct(
  embeddingColumn: any,
  queryVector: number[]
) {
  return sql`${embeddingColumn} <#> ${JSON.stringify(queryVector)}::vector`
}

/**
 * 向量余弦相似度
 * 范围：-1（完全相反）到 1（完全相同）
 * 通过 1 - 余弦距离 计算
 *
 * @param embeddingColumn 向量列
 * @param queryVector 查询向量（1024维数组）
 * @returns SQL 片段
 */
export function vectorCosineSimilarity(
  embeddingColumn: any,
  queryVector: number[]
) {
  return sql`1 - (${embeddingColumn} <=> ${JSON.stringify(queryVector)}::vector)`
}

/**
 * 计算平均向量
 * 用于将多个向量聚合为一个代表向量
 *
 * @param vectors 向量数组（每个向量是 1024 维数组）
 * @returns 平均向量
 */
export function calculateAverageVector(vectors: number[][]): number[] {
  if (vectors.length === 0) {
    throw new Error("向量数组不能为空")
  }

  const dimension = vectors[0].length
  const avg = new Array(dimension).fill(0)

  for (const vector of vectors) {
    for (let i = 0; i < dimension; i++) {
      avg[i] += vector[i]
    }
  }

  return avg.map(v => v / vectors.length)
}

/**
 * 验证向量格式
 * 确保 1024 维且所有值都是数字
 *
 * @param vector 待验证的向量
 * @returns 是否有效
 */
export function isValidVector(vector: unknown): vector is number[] {
  if (!Array.isArray(vector)) {
    return false
  }

  if (vector.length !== 1024) {
    return false
  }

  return vector.every(v => typeof v === "number" && !isNaN(v))
}
