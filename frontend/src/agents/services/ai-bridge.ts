/**
 * AI 服务桥接器接口
 * 定义统一的 AI 调用接口，由各服务商实现
 */

import type { AIConfig, AIProvider } from '@/app/stores/game-settings'
import type { AgentTurnOutput } from '../types'
import type { ConversationMessage } from '../strategies/state-serializer'

// ============================================
// 桥接器接口
// ============================================

export interface AIBridgeConfig {
  apiKey: string
  model: string
  baseUrl?: string
}

export interface StreamCallbacks {
  onThought?: (thought: string) => void
  onDialogue?: (dialogue: string) => void
  onComplete?: (output: AgentTurnOutput) => void
  onError?: (error: Error) => void
}

export interface AIBridge {
  readonly provider: AIProvider

  /**
   * 发送查询并获取响应（非流式）
   */
  query(messages: ConversationMessage[]): Promise<AgentTurnOutput>

  /**
   * 发送查询并流式获取响应
   */
  queryStream(
    messages: ConversationMessage[],
    callbacks: StreamCallbacks
  ): Promise<void>

  /**
   * 验证配置是否有效
   */
  validateConfig(): Promise<boolean>
}

// ============================================
// 响应解析器
// ============================================

/**
 * 从 LLM 响应中提取 JSON
 */
export function extractJsonFromResponse(response: string): unknown {
  // 尝试直接解析
  try {
    return JSON.parse(response)
  } catch {
    // 尝试提取 ```json ... ``` 块
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      const content = jsonMatch[1].trim()
      try {
        return JSON.parse(content)
      } catch {
        // JSON 可能有额外的括号，尝试修复
        const fixed = tryFixJson(content)
        if (fixed) return fixed
      }
    }

    // 尝试提取 { ... } 块（使用平衡括号匹配）
    const jsonObj = extractBalancedJson(response)
    if (jsonObj) {
      try {
        return JSON.parse(jsonObj)
      } catch {
        // 继续尝试其他方法
      }
    }

    // 最后尝试简单的正则匹配
    const braceMatch = response.match(/\{[\s\S]*\}/)
    if (braceMatch) {
      const fixed = tryFixJson(braceMatch[0])
      if (fixed) return fixed
    }

    throw new Error('无法从响应中提取 JSON')
  }
}

/**
 * 尝试修复常见的 JSON 格式问题
 */
function tryFixJson(content: string): unknown | null {
  // 移除首尾空白
  let json = content.trim()

  // 尝试直接解析
  try {
    return JSON.parse(json)
  } catch {
    // 继续尝试修复
  }

  // 计算括号平衡
  let braceCount = 0
  let bracketCount = 0
  for (const char of json) {
    if (char === '{') braceCount++
    if (char === '}') braceCount--
    if (char === '[') bracketCount++
    if (char === ']') bracketCount--
  }

  // 如果有多余的闭合括号，尝试移除
  while (braceCount < 0) {
    const lastBrace = json.lastIndexOf('}')
    if (lastBrace === -1) break
    json = json.slice(0, lastBrace) + json.slice(lastBrace + 1)
    braceCount++
  }

  while (bracketCount < 0) {
    const lastBracket = json.lastIndexOf(']')
    if (lastBracket === -1) break
    json = json.slice(0, lastBracket) + json.slice(lastBracket + 1)
    bracketCount++
  }

  // 如果缺少闭合括号，尝试添加
  while (braceCount > 0) {
    json += '}'
    braceCount--
  }

  while (bracketCount > 0) {
    json += ']'
    bracketCount--
  }

  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * 使用平衡括号提取第一个完整的 JSON 对象
 */
function extractBalancedJson(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) return null

  let braceCount = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i++) {
    const char = text[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === '\\' && inString) {
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === '{') braceCount++
    if (char === '}') {
      braceCount--
      if (braceCount === 0) {
        return text.slice(start, i + 1)
      }
    }
  }

  return null
}

/**
 * 解析并验证 AI 响应
 * @param response LLM 返回的原始文本
 * @param _availableItems 已废弃，实际可用性在 action executor 中验证
 */
export function parseAgentResponse(
  response: string,
  _availableItems?: string[]
): AgentTurnOutput {
  const json = extractJsonFromResponse(response)

  if (!json || typeof json !== 'object') {
    throw new Error('响应不是有效的对象')
  }

  const obj = json as Record<string, unknown>

  // 提取字段，提供默认值
  const thought = typeof obj.thought === 'string' ? obj.thought : '...'
  const dialogue = typeof obj.dialogue === 'string' ? obj.dialogue : '...'

  if (!obj.action || typeof obj.action !== 'object') {
    throw new Error('缺少 action 字段')
  }

  const action = obj.action as Record<string, unknown>
  const actionType = action.type as string

  if (!['USE_ITEM', 'SHOOT_OPPONENT', 'SHOOT_SELF'].includes(actionType)) {
    throw new Error(`无效的 action.type: ${actionType}`)
  }

  // 构建结果
  const result: AgentTurnOutput = {
    thought,
    dialogue,
    action: {
      type: actionType as 'USE_ITEM' | 'SHOOT_OPPONENT' | 'SHOOT_SELF',
    } as AgentTurnOutput['action'],
  }

  // 如果是使用道具，添加道具信息
  if (actionType === 'USE_ITEM') {
    const itemId = action.itemId as string
    if (!itemId) {
      throw new Error('使用道具时必须指定 itemId')
    }
    // 只验证是否是有效的道具类型，实际可用性在 action executor 中验证
    const validItemTypes = ['saw', 'handcuffs', 'cigarettes', 'magnifier', 'drink', 'adrenaline', 'medicine', 'inverter', 'phone']
    if (!validItemTypes.includes(itemId)) {
      throw new Error(`无效的道具类型: ${itemId}`)
    }
    (result.action as { type: 'USE_ITEM'; itemId: string }).itemId = itemId

    // 肾上腺素需要 targetItem
    if (itemId === 'adrenaline' && action.targetItem) {
      (result.action as { type: 'USE_ITEM'; itemId: string; targetItem?: string }).targetItem =
        action.targetItem as string
    }
  }

  return result
}

// ============================================
// 桥接器工厂
// ============================================

const bridgeRegistry = new Map<AIProvider, new (config: AIBridgeConfig) => AIBridge>()

export function registerBridge(
  provider: AIProvider,
  bridgeClass: new (config: AIBridgeConfig) => AIBridge
) {
  bridgeRegistry.set(provider, bridgeClass)
}

export function createBridge(config: AIConfig): AIBridge {
  const BridgeClass = bridgeRegistry.get(config.provider)
  if (!BridgeClass) {
    throw new Error(`未找到服务商 ${config.provider} 的桥接器实现`)
  }
  return new BridgeClass({
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
  })
}

// ============================================
// 会话管理器
// ============================================

export class ConversationManager {
  private messages: ConversationMessage[] = []
  private bridge: AIBridge

  constructor(bridge: AIBridge, systemPrompt: string) {
    this.bridge = bridge
    this.messages = [{ role: 'system', content: systemPrompt }]
  }

  /**
   * 发送用户消息并获取 AI 响应
   */
  async chat(userMessage: string): Promise<AgentTurnOutput> {
    this.messages.push({ role: 'user', content: userMessage })

    const response = await this.bridge.query(this.messages)

    // 将 AI 响应添加到历史
    this.messages.push({
      role: 'assistant',
      content: JSON.stringify(response),
    })

    return response
  }

  /**
   * 流式发送消息
   */
  async chatStream(
    userMessage: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    this.messages.push({ role: 'user', content: userMessage })

    await this.bridge.queryStream(this.messages, {
      ...callbacks,
      onComplete: (output) => {
        this.messages.push({
          role: 'assistant',
          content: JSON.stringify(output),
        })
        callbacks.onComplete?.(output)
      },
    })
  }

  /**
   * 获取对话历史
   */
  getHistory(): ConversationMessage[] {
    return [...this.messages]
  }

  /**
   * 清空对话历史（保留系统提示词）
   */
  reset() {
    this.messages = this.messages.slice(0, 1)
  }
}
