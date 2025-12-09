/**
 * 系统提示词构建器
 * 组合人格、规则和输出格式要求
 */

import { DEALER_PERSONA, DEALER_PERSONA_SHORT } from './dealer-persona'
import { GAME_RULES, GAME_RULES_SHORT } from './rules-context'
import { AGENT_OUTPUT_SCHEMA } from '../types'

export interface SystemPromptOptions {
  /** 使用简短版本（节省 token） */
  compact?: boolean
  /** 语言 */
  language?: 'zh' | 'en'
}

export function buildSystemPrompt(options: SystemPromptOptions = {}): string {
  const { compact = false } = options

  const persona = compact ? DEALER_PERSONA_SHORT : DEALER_PERSONA
  const rules = compact ? GAME_RULES_SHORT : GAME_RULES

  return `
${persona}

${rules}

# 输出格式要求

你必须以 JSON 格式输出你的决策。严格遵循以下格式：

\`\`\`json
{
  "thought": "你的内心思考过程，分析局势和决策理由（中文）",
  "dialogue": "你作为恶魔说的话，简短冷漠（中文）",
  "action": {
    "type": "USE_ITEM 或 SHOOT_OPPONENT 或 SHOOT_SELF",
    "itemId": "道具ID（仅当 type 为 USE_ITEM 时需要）",
    "targetItem": "目标道具（仅当使用肾上腺素时需要）"
  }
}
\`\`\`

## 道具 ID 对照表
- saw: 锯子
- handcuffs: 手铐
- cigarettes: 香烟
- magnifier: 放大镜
- drink: 饮料
- adrenaline: 肾上腺素
- medicine: 过期药物
- inverter: 逆转器
- phone: 电话

## 重要提醒
1. 只输出 JSON，不要有其他内容
2. thought 中要体现你的概率分析和策略思考
3. dialogue 要符合恶魔冷漠的人格，不超过一句话
4. action.type 必须是三个选项之一
5. 使用道具时必须提供 itemId
6. 只能使用你当前拥有的道具
`
}

/**
 * 构建带有 JSON Schema 的系统提示词（用于支持结构化输出的 API）
 */
export function buildSystemPromptWithSchema(options: SystemPromptOptions = {}): {
  prompt: string
  schema: typeof AGENT_OUTPUT_SCHEMA
} {
  return {
    prompt: buildSystemPrompt(options),
    schema: AGENT_OUTPUT_SCHEMA,
  }
}

/**
 * 生成回合开始的提示词
 */
export function buildTurnStartPrompt(): string {
  return `
现在是你的回合。

请根据当前局势，决定你的行动：
1. 分析弹仓概率和双方状态
2. 考虑是否使用道具
3. 决定射击方向

以 JSON 格式输出你的决策。
`
}

/**
 * 生成道具使用后的提示词
 */
export function buildAfterItemPrompt(
  itemUsed: string,
  result: string
): string {
  return `
你使用了 ${itemUsed}。
结果：${result}

你还有其他道具可用。请决定下一步：
- 继续使用道具？
- 还是开枪？

以 JSON 格式输出你的决策。
`
}

/**
 * 生成强制开枪的提示词
 */
export function buildMustShootPrompt(): string {
  return `
你已经使用完想用的道具（或没有道具）。
现在必须开枪。

请决定射击方向：
- SHOOT_OPPONENT: 射击对手
- SHOOT_SELF: 射击自己

以 JSON 格式输出你的决策。
`
}
