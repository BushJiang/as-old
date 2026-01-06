/**
 * 优化后的匹配文案生成提示词 (v3.0 - 严格句式版)
 * 修改重点：
 * 1. Bridge 部分强制点出双方具体标签
 * 2. 标签内容强制使用【】包裹
 * 3. 针对不同模式定制动词（喜欢/寻找/擅长/关注）
 */

export type MatchType =
  | "similar-interests"
  | "mutual-needs"
  | "mutual-provide"
  | "exploratory-discovery";

export interface MatchCopyInput {
  matchType: MatchType;
  myName?: string; // (可选)
  theirName: string;

  // 关键匹配点
  highlightTagA: string; // 我的标签
  highlightTagB: string; // 对方的标签

  // 辅助上下文
  contextTagsA: string[];
  contextTagsB: string[];

  myBio?: string;
  theirBio?: string;
  myCity?: string;
  theirCity?: string;
}

export function generateMatchCopyPrompt(input: MatchCopyInput): string {
  const { matchType } = input;

  switch (matchType) {
    case "similar-interests":
      return promptSimilarInterests(input);
    case "mutual-needs":
      return promptMutualNeeds(input);
    case "mutual-provide":
      return promptMutualProvide(input);
    case "exploratory-discovery":
      return promptExploratoryDiscovery(input);
    default:
      return promptSimilarInterests(input);
  }
}

// ==========================================
// 1. 💗 兴趣相投 (修正版)
// 修改：Bridge 字数缩减至 15-20 字，严格句式
// ==========================================
function promptSimilarInterests(input: MatchCopyInput): string {
  return `# Role
资深社交破冰顾问。

# Input Data
- 我 (${input.myName || "我"}) 的兴趣: ${input.highlightTagA}
- 对方 (${input.theirName}) 的兴趣: ${input.highlightTagB}

# Task
生成一段"三明治结构"的推荐语。

1. **Hook (标签)**: 4-8字。提炼一个属于我们俩的"圈层标签"（如"吸猫体质"、"科幻原住民"）。
2. **Bridge (连接)**: 15-20字。**必须严格执行以下句式，保持精简**：
   - 句式模板："你喜欢【${input.highlightTagA}】，${input.theirName} 喜欢【${input.highlightTagB}】，（短语总结共鸣）。"
   - 注意：标签内容必须用【】括起来。
3. **CTA (破冰)**: 15字以内。给出一个具体的聊天话题。

# Output JSON
{"hook": "...", "bridge": "...", "cta": "..."}`;
}

// ==========================================
// 2. 🎯 需求匹配
// 逻辑：你寻找 A，他擅长 B -> 互补
// ==========================================
function promptMutualNeeds(input: MatchCopyInput): string {
  return `# Role
资源连接专家。

# Input Data
- 我的需求: ${input.highlightTagA}
- 对方 (${input.theirName}) 的提供: ${input.highlightTagB}

# Task
生成一段推荐语，强调供需的完美契合。

1. **Hook (标签)**: 4-8字。给对方一个"救星"或"专家"人设。
2. **Bridge (连接)**: 15-20字。**必须严格执行以下句式**：
   - 句式模板："你正在寻找【${input.highlightTagA}】，而 ${input.theirName} 刚好擅长【${input.highlightTagB}】，（一句话描述这种匹配的难得性）。"
   - 注意：标签内容必须用【】括起来。
3. **CTA (破冰)**: 15字以内。鼓励直接发起请教。

# Output JSON
{"hook": "...", "bridge": "...", "cta": "..."}`;
}

// ==========================================
// 3. 🤝 助人为乐 (互助合作)
// 逻辑：你擅长 A，他需要 B -> 价值
// ==========================================
function promptMutualProvide(input: MatchCopyInput): string {
  return `# Role
社区互助大使。

# Input Data
- 我的提供: ${input.highlightTagA}
- 对方 (${input.theirName}) 的需求: ${input.highlightTagB}

# Task
生成一段推荐语，强调我的价值和对方的需要。

1. **Hook (标签)**: 4-8字。赋予我一个"施助者"的身份（如"指路明灯"）。
2. **Bridge (连接)**: 15-20字。**必须严格执行以下句式**：
   - 句式模板："你擅长【${input.highlightTagA}】，而 ${input.theirName} 正好需要【${input.highlightTagB}】，（一句话肯定你能提供的帮助）。"
   - 注意：标签内容必须用【】括起来。
3. **CTA (破冰)**: 15字以内。建议主动伸出援手。

# Output JSON
{"hook": "...", "bridge": "...", "cta": "..."}`;
}

// ==========================================
// 4. 🧭 探索发现
// 逻辑：你关注 A，他偏爱 B -> 反差/深层联系
// ==========================================
function promptExploratoryDiscovery(input: MatchCopyInput): string {
  return `# Role
灵魂共鸣捕手。

# Input Data
- 我的特质: ${input.highlightTagA}
- 对方 (${input.theirName}) 的特质: ${input.highlightTagB}

# Task
生成一段充满"意外发现"感的推荐语。

1. **Hook (标签)**: 4-8字。富有诗意或幽默感的标签。
2. **Bridge (连接)**: 15-20字。**必须严格执行以下句式**：
   - 句式模板："虽然你关注【${input.highlightTagA}】，而 ${input.theirName} 偏爱【${input.highlightTagB}】，但（转折，指出你们在底层价值观或生活态度上的某种惊人相似）。"
   - 注意：标签内容必须用【】括起来。
3. **CTA (破冰)**: 15字以内。一个开放式的好问题。

# Output JSON
{"hook": "...", "bridge": "...", "cta": "..."}`;
}
