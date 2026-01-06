/**
 * AI 文案生成服务
 *
 * 调用 LLM 生成匹配文案
 */

import { generateMatchCopyPrompt, type MatchCopyInput } from '@/lib/prompts/match-copy-prompt'

// 匹配文案输出类型
export interface MatchCopyOutput {
  hook: string
  bridge: string
  cta: string
}

// 重新导出类型
export type { MatchCopyInput }

// LocalStorage 缓存键前缀
const CACHE_PREFIX = 'match_copy_cache_'
// 缓存过期时间（7天）
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000

/**
 * 从 LocalStorage 读取缓存
 */
function getFromCache(key: string): MatchCopyOutput | null {
  if (typeof window === 'undefined') return null

  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!item) return null

    const cached = JSON.parse(item)

    // 检查是否过期
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }

    return cached.data
  } catch {
    return null
  }
}

/**
 * 写入 LocalStorage 缓存
 */
function setCache(key: string, data: MatchCopyOutput): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }))
  } catch (error) {
    console.error('缓存写入失败:', error)
  }
}

/**
 * 生成旧的缓存 key（用于清除旧缓存）
 */
function generateOldCacheKey(input: MatchCopyInput): string {
  // 旧的逻辑：基于兴趣列表
  const sortedMy = [...input.contextTagsA].sort().join(',')
  const sortedTheir = [...input.contextTagsB].sort().join(',')
  const combined = `${sortedMy}|${sortedTheir}`

  try {
    return btoa(encodeURIComponent(combined)).replace(/=/g, '')
  } catch {
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `cache_${Math.abs(hash)}`
  }
}

/**
 * 生成缓存 key
 */
function generateCacheKey(input: MatchCopyInput): string {
  // 使用 matchType、highlightTagA、highlightTagB 生成 key
  // 确保不同的匹配结果有不同的缓存
  const sortedMy = [...input.contextTagsA].sort().join(',')
  const sortedTheir = [...input.contextTagsB].sort().join(',')

  // 🔥 关键修复：将匹配详情也包含在缓存 key 中
  const matchKey = `${input.matchType}|${input.highlightTagA}|${input.highlightTagB}`

  const combined = `${matchKey}|${sortedMy}|${sortedTheir}`

  // 使用 encodeURIComponent 处理中文，然后 btoa 编码
  try {
    return btoa(encodeURIComponent(combined)).replace(/=/g, '')
  } catch {
    // 降级方案：使用简单的哈希
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `cache_${Math.abs(hash)}`
  }
}

/**
 * 生成匹配文案
 * @param input 匹配数据输入
 * @returns 生成的三明治文案
 */
export async function generateMatchCopy(input: MatchCopyInput): Promise<MatchCopyOutput> {
  // 生成缓存 key
  const cacheKey = generateCacheKey(input)

  // 检查持久化缓存
  const cached = getFromCache(cacheKey)
  if (cached) {
    console.log('[AI文案] 使用缓存，key:', cacheKey)
    console.log('[AI文案] 缓存数据:', JSON.stringify(cached))
    return cached
  }

  // 🔥 清除旧的缓存（基于旧的 key 生成逻辑）
  // 旧的 key 只包含兴趣，不包含匹配度
  try {
    const oldKey = generateOldCacheKey(input)
    localStorage.removeItem(`${CACHE_PREFIX}${oldKey}`)
    console.log('[AI文案] 清除旧缓存，oldKey:', oldKey)
  } catch (e) {
    // 忽略错误
  }

  // 生成提示词
  const prompt = generateMatchCopyPrompt(input)

  console.log('='.repeat(80));
  console.log('📝 生成提示词');
  console.log('='.repeat(80));
  console.log('6. 发送给大模型的完整提示词（prompt）：');
  console.log(prompt);
  console.log('');
  console.log('提示词中包含的关键变量：');
  console.log('   - matchType:', input.matchType);
  console.log('   - highlightTagA:', input.highlightTagA);
  console.log('   - highlightTagB:', input.highlightTagB);
  console.log('   - contextTagsA:', input.contextTagsA);
  console.log('   - contextTagsB:', input.contextTagsB);
  console.log('='.repeat(80));

  try {
    console.log('[AI文案] 调用 LLM 生成')
    // 调用 LLM API
    const response = await fetch('/api/ai/generate-copy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate copy')
    }

    const data = await response.json()

    // 解析 JSON 响应
    let result: MatchCopyOutput
    try {
      result = JSON.parse(data.result)
      console.log('='.repeat(80));
      console.log('✅ LLM 返回的原始数据：');
      console.log('='.repeat(80));
      console.log('   - data.result:', data.result);
      console.log('   - 解析后的 JSON:', JSON.stringify(result, null, 2));
      console.log('='.repeat(80));
    } catch (parseError) {
      console.log('='.repeat(80));
      console.log('❌ LLM 返回数据解析失败，使用降级方案');
      console.log('='.repeat(80));
      console.log('   - 原始数据:', data.result);
      console.log('   - 解析错误:', parseError);
      console.log('='.repeat(80));
      // 如果解析失败，使用降级方案
      result = generateFallbackCopy(input)
    }

    // 持久化缓存结果
    setCache(cacheKey, result)

    return result
  } catch (error) {
    console.error('AI 文案生成失败，使用降级方案:', error)
    const fallback = generateFallbackCopy(input)
    // 降级方案也缓存
    setCache(cacheKey, fallback)
    return fallback
  }
}

/**
 * 降级方案：生成简单的文案
 */
function generateFallbackCopy(input: MatchCopyInput): MatchCopyOutput {
  const { matchType, theirName, highlightTagA, highlightTagB } = input

  // 根据匹配类型生成不同的文案
  switch (matchType) {
    case 'similar-interests':
      return {
        hook: extractCommonLabel(highlightTagA, highlightTagB),
        bridge: `你的【${highlightTagA}】与${theirName}的【${highlightTagB}】很合拍，像是找到了同类。`,
        cta: `聊聊${highlightTagB}吧？`,
      }

    case 'mutual-needs':
      return {
        hook: '完美互补',
        bridge: `你正在寻找【${highlightTagA}】，${theirName}刚好拥有丰富的【${highlightTagB}】经验，这就是你要找的贵人。`,
        cta: '要不要约个时间请教一下？',
      }

    case 'mutual-provide':
      return {
        hook: '你的价值被需要',
        bridge: `${theirName}需要你的【${highlightTagA}】能力，而你能帮他解决【${highlightTagB}】问题。`,
        cta: '也许你们可以一起开启一个小项目？',
      }

    case 'exploratory-discovery':
      return {
        hook: '探索新世界',
        bridge: `虽然你的【${highlightTagA}】和${theirName}的【${highlightTagB}】看似不同，但正是这种差异能带来全新的视角。`,
        cta: '给彼此一个认识的机会，说不定会发现新大陆？',
      }

    default:
      return {
        hook: '志同道合的朋友',
        bridge: `你的【${highlightTagA}】与${theirName}的【${highlightTagB}】很有共鸣。`,
        cta: '聊聊吧？',
      }
  }
}

/**
 * 提取共同标签
 */
function extractCommonLabel(interest1: string, interest2: string): string {
  // 简单的共同标签提取逻辑
  const keywords = {
    '编程': '技术探索者',
    '代码': '技术探索者',
    '开发': '技术探索者',
    'AI': 'AI爱好者',
    '人工智能': 'AI爱好者',
    '机器学习': 'AI爱好者',
    '阅读': '阅读爱好者',
    '读书': '阅读爱好者',
    '写作': '创作者',
    '绘画': '创作者',
    '音乐': '音乐爱好者',
    '电影': '影视爱好者',
  }

  for (const [key, label] of Object.entries(keywords)) {
    if (interest1.includes(key) || interest2.includes(key)) {
      return label
    }
  }

  return '志同道合的朋友'
}
