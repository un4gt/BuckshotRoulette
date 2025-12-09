/**
 * 预配置模型桥接器
 * 通过后端代理调用 AI，API Key 存储在后端
 */

import type { AIBridge, AIBridgeConfig, StreamCallbacks } from '../ai-bridge'
import { parseAgentResponse } from '../ai-bridge'
import type { ConversationMessage } from '../../strategies/state-serializer'
import type { AgentTurnOutput } from '../../types'
import type { AIProvider } from '@/app/stores/game-settings'
import { api } from '@/shared/api/client'

export class PresetBridge implements AIBridge {
  readonly provider: AIProvider = 'openai' // 占位，实际由后端处理
  private modelId: string

  constructor(config: AIBridgeConfig & { modelId: string }) {
    this.modelId = config.modelId
  }

  async query(messages: ConversationMessage[]): Promise<AgentTurnOutput> {
    const response = await api.post<{ content: string }>('/game/ai/chat', {
      modelId: this.modelId,
      messages,
      stream: false,
    })

    return parseAgentResponse(response.content)
  }

  async queryStream(
    messages: ConversationMessage[],
    callbacks: StreamCallbacks
  ): Promise<void> {
    let fullContent = ''
    let thoughtContent = ''
    let dialogueContent = ''

    try {
      await api.stream(
        '/game/ai/chat',
        {
          modelId: this.modelId,
          messages,
          stream: true,
        },
        (chunk) => {
          try {
            const data = JSON.parse(chunk)

            if (data.content) {
              fullContent += data.content

              // 尝试实时提取 thought 和 dialogue
              const thoughtMatch = fullContent.match(/"thought"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/)
              if (thoughtMatch && thoughtMatch[1] !== thoughtContent) {
                thoughtContent = thoughtMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
                callbacks.onThought?.(thoughtContent)
              }

              const dialogueMatch = fullContent.match(/"dialogue"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/)
              if (dialogueMatch && dialogueMatch[1] !== dialogueContent) {
                dialogueContent = dialogueMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
                callbacks.onDialogue?.(dialogueContent)
              }
            }
          } catch {
            // 忽略非 JSON chunk
          }
        }
      )

      // 解析完整响应
      const output = parseAgentResponse(fullContent)
      callbacks.onComplete?.(output)
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }

  async validateConfig(): Promise<boolean> {
    // 预配置模型由后端验证
    return true
  }
}

/**
 * 创建预配置模型桥接器
 */
export function createPresetBridge(modelId: string): AIBridge {
  return new PresetBridge({ apiKey: '', model: '', modelId })
}
