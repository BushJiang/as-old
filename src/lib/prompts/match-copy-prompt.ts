/**
 * 匹配文案生成提示词
 *
 * 用于根据用户匹配结果生成三明治文案
 */

export type MatchType = 'similar-interests' | 'mutual-needs' | 'mutual-provide' | 'exploratory-discovery'

export interface MatchCopyInput {
  matchType: MatchType // 匹配类型
  myInterests: string[]
  theirInterests: string[]
  theirName: string
  matchDetails: Array<{
    myInterest: string
    theirInterest: string
    similarityPercent: number
  }>
}

export interface MatchCopyOutput {
  hook: string // 共同标签，如"AI爱好者"
  bridge: string // 连接语句，包含具体兴趣
  cta: string // 破冰建议
}

/**
 * 生成三明治文案的提示词
 */
export function generateMatchCopyPrompt(input: MatchCopyInput): string {
  const { matchType, myInterests, theirInterests, theirName, matchDetails } = input

  // 提取最佳匹配
  const bestMatch = matchDetails[0]
  const myInterest = bestMatch.myInterest
  const theirInterest = bestMatch.theirInterest
  const similarity = bestMatch.similarityPercent

  // 根据匹配类型生成不同的提示词
  switch (matchType) {
    case 'similar-interests':
      return generateSimilarInterestsPrompt(myInterests, theirInterests, theirName, myInterest, theirInterest, similarity)

    case 'mutual-needs':
      return generateMutualNeedsPrompt(myInterests, theirInterests, theirName, myInterest, theirInterest, similarity)

    case 'mutual-provide':
      return generateMutualProvidePrompt(myInterests, theirInterests, theirName, myInterest, theirInterest, similarity)

    case 'exploratory-discovery':
      return generateExploratoryDiscoveryPrompt(myInterests, theirInterests, theirName, myInterest, theirInterest, similarity)

    default:
      return generateSimilarInterestsPrompt(myInterests, theirInterests, theirName, myInterest, theirInterest, similarity)
  }
}

/**
 * 兴趣相投匹配文案
 */
function generateSimilarInterestsPrompt(
  myInterests: string[],
  theirInterests: string[],
  theirName: string,
  myInterest: string,
  theirInterest: string,
  similarity: number
): string {
  return `# 角色
你是一个社交应用的文案专家，你的任务是为两位兴趣相似的用户生成一段有吸引力的、能建立信任感的匹配推荐语。

# 上下文
- 用户A的兴趣: ${myInterests.join('、')}
- 用户B（${theirName}）的兴趣: ${theirInterests.join('、')}
- 最佳匹配: "${myInterest}" ↔ "${theirInterest}" (匹配度 ${similarity.toFixed(0)}%)

# 任务指令
1. **提炼共同标签**：为他们的共同点提炼一个上位的、有吸引力的**共同标签**。这个标签应该是一个高度概括的名词或短语，例如"AI爱好者"、"技术探索者"、"视觉创作者"。
2. **构建连接语句**：用一句话自然地描述他们兴趣的匹配关系。这句话必须包含具体的兴趣关键词和匹配度。格式示例："你的【编程】背景与${theirName}的【人工智能】探索欲匹配度达 ${similarity.toFixed(0)}%，简直是天作之合。"
3. **生成破冰建议**：根据他们匹配的兴趣，生成一个具体的、可操作的聊天话题建议。

# 输出格式
严格按照以下 JSON 格式输出，不要添加任何额外的解释或 Markdown 标记：
{
  "hook": "提炼的共同标签",
  "bridge": "连接语句",
  "cta": "破冰建议"
}`
}

/**
 * 需求匹配文案（我的需求 vs 他们的提供）
 */
function generateMutualNeedsPrompt(
  myInterests: string[],
  theirInterests: string[],
  theirName: string,
  myInterest: string,
  theirInterest: string,
  similarity: number
): string {
  return `# 角色
你是一个社交应用的文案专家，你的任务是为两位需求互补的用户生成一段有吸引力的匹配推荐语。

# 上下文
- 用户A的需求: ${myInterests.join('、')}
- 用户B（${theirName}）的提供: ${theirInterests.join('、')}
- 最佳匹配: 用户A需要【${myInterest}】，用户B提供【${theirInterest}】(匹配度 ${similarity.toFixed(0)}%)

# 任务指令
1. **提炼吸引点**：为他们的互补关系提炼一个有吸引力的**标签**，体现"完美互补"的感觉。例如："完美互补"、"需求契合"、"各取所需"。
2. **构建连接语句**：用一句话自然地描述他们的需求-提供关系。格式示例："你正在寻找【${myInterest}】，${theirName}刚好拥有丰富的【${theirInterest}】经验，匹配度达 ${similarity.toFixed(0)}%。"
3. **生成行动建议**：生成一个具体的、可操作的请教或合作建议。例如："要不要约个时间请教一下？"或"可以深入聊聊这个话题。"

# 输出格式
严格按照以下 JSON 格式输出，不要添加任何额外的解释或 Markdown 标记：
{
  "hook": "提炼的标签",
  "bridge": "连接语句",
  "cta": "行动建议"
}`
}

/**
 * 助人为乐匹配文案（我的提供 vs 他们的需求）
 */
function generateMutualProvidePrompt(
  myInterests: string[],
  theirInterests: string[],
  theirName: string,
  myInterest: string,
  theirInterest: string,
  similarity: number
): string {
  return `# 角色
你是一个社交应用的文案专家，你的任务是为两位能够互相帮助的用户生成一段有吸引力的匹配推荐语。

# 上下文
- 用户A的提供: ${myInterests.join('、')}
- 用户B（${theirName}）的需求: ${theirInterests.join('、')}
- 最佳匹配: 用户A提供【${myInterest}】，用户B需要【${theirInterest}】(匹配度 ${similarity.toFixed(0)}%)

# 任务指令
1. **提炼价值标签**：为他们的互助关系提炼一个体现价值的**标签**，让提供方感到被需要。例如："你的价值被需要"、"能够帮到你"、"乐于助人"。
2. **构建连接语句**：用一句话自然地描述他们的提供-需求关系。格式示例："${theirName}需要你的【${myInterest}】能力，而你能帮他解决【${theirInterest}】问题，匹配度达 ${similarity.toFixed(0)}%。"
3. **生成行动建议**：生成一个具体的、可操作的合作建议。例如："也许你们可以一起开启一个小项目？"或"你的经验正好能帮到他。"

# 输出格式
严格按照以下 JSON 格式输出，不要添加任何额外的解释或 Markdown 标记：
{
  "hook": "提炼的标签",
  "bridge": "连接语句",
  "cta": "行动建议"
}`
}

/**
 * 探索发现匹配文案（最不相似的兴趣）
 */
function generateExploratoryDiscoveryPrompt(
  myInterests: string[],
  theirInterests: string[],
  theirName: string,
  myInterest: string,
  theirInterest: string,
  similarity: number
): string {
  return `# 角色
你是一个社交应用的文案专家，你的任务是为两位兴趣不同的用户生成一段鼓励探索、开放视野的匹配推荐语。

# 上下文
- 用户A的兴趣: ${myInterests.join('、')}
- 用户B（${theirName}）的兴趣: ${theirInterests.join('、')}
- 最佳匹配: 用户A的【${myInterest}】与用户B的【${theirInterest}】(差异较大，匹配度 ${similarity.toFixed(0)}%)

# 任务指令
1. **提炼探索标签**：为他们的差异提炼一个鼓励探索的**标签**。例如："探索新世界"、"拓展视野"、"全新视角"、"跨界碰撞"。
2. **构建连接语句**：用一句话自然地描述他们兴趣的差异价值，强调差异能带来新的启发。格式示例："虽然你的【${myInterest}】和${theirName}的【${theirInterest}】看似不同，但正是这种差异能带来全新的视角和启发。"
3. **生成开放建议**：生成一个鼓励了解新领域、拓展视野的建议。例如："给彼此一个认识的机会，说不定会发现新大陆？"或"了解一下完全不同的领域也很有趣。"

# 输出格式
严格按照以下 JSON 格式输出，不要添加任何额外的解释或 Markdown 标记：
{
  "hook": "提炼的标签",
  "bridge": "连接语句",
  "cta": "开放建议"
}`
}
