/**
 * OpenAI Bridge
 * 支持 OpenAI / OpenRouter / OpenAI-Compatible 服务
 */

import OpenAI from 'openai'
import type {
  AIBridge,
  AIBridgeConfig,
  StreamCallbacks,
} from '../ai-bridge'
import { parseAgentResponse } from '../ai-bridge'
import type { AgentTurnOutput } from '@/agents/types'
import type { ConversationMessage } from '@/agents/strategies/state-serializer'
import type { AIProvider } from '@/app/stores/game-settings'

export class OpenAIBridge implements AIBridge {
  readonly provider: AIProvider
  private client: OpenAI
  private config: AIBridgeConfig

  constructor(config: AIBridgeConfig, provider: AIProvider = 'openai') {
    this.config = config
    this.provider = provider

    // 根据不同服务设置 baseURL
    const baseURL = this.getBaseURL()

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: baseURL,
      dangerouslyAllowBrowser: true, // 允许在浏览器中使用（生产环境应通过后端调用）
    })
  }

  private getBaseURL(): string | undefined {
    if (this.provider === 'openrouter') {
      return 'https://openrouter.ai/api/v1'
    } else if (this.provider === 'deepseek') {
      return 'https://api.deepseek.com'
    } else if (this.provider === 'grok') {
      return 'https://api.x.ai/v1'
    } else if (this.provider === 'openai-compatible' && this.config.baseUrl) {
      return this.config.baseUrl
    }
    // OpenAI 使用默认 baseURL
    return undefined
  }

  async query(messages: ConversationMessage[]): Promise<AgentTurnOutput> {
    try {
      const openaiMessages = this.convertMessages(messages)

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: openaiMessages,
        temperature: 0.8,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content || ''

      return parseAgentResponse(content)
    } catch (error) {
      throw new Error(`${this.provider} API 调用失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async queryStream(
    messages: ConversationMessage[],
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      const openaiMessages = this.convertMessages(messages)

      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: openaiMessages,
        temperature: 0.8,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        stream: true,
      })

      let accumulatedText = ''
      let thoughtExtracted = false
      let dialogueExtracted = false
      let finishReason: string | null = null

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || ''
        accumulatedText += delta

        // 记录结束原因
        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason
        }

        // 尝试提取 thought
        if (!thoughtExtracted && callbacks.onThought) {
          const thoughtMatch = accumulatedText.match(/"thought"\s*:\s*"([^"]*)"/)
          if (thoughtMatch) {
            callbacks.onThought(thoughtMatch[1])
            thoughtExtracted = true
          }
        }

        // 尝试提取 dialogue
        if (!dialogueExtracted && callbacks.onDialogue) {
          const dialogueMatch = accumulatedText.match(/"dialogue"\s*:\s*"([^"]*)"/)
          if (dialogueMatch) {
            callbacks.onDialogue(dialogueMatch[1])
            dialogueExtracted = true
          }
        }
      }

      // 检查是否因长度截断
      if (finishReason === 'length') {
        throw new Error(`响应被截断（超出 token 限制）。请尝试使用支持更长输出的模型。\n原始响应: ${accumulatedText.slice(0, 500)}...`)
      }

      // 流式完成，解析完整响应
      try {
        const output = parseAgentResponse(accumulatedText)
        callbacks.onComplete?.(output)
      } catch (parseError) {
        // 解析失败时提供更多调试信息
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)
        throw new Error(`${errorMsg}\n原始响应: ${accumulatedText.slice(0, 1000)}`)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      callbacks.onError?.(err)
      throw err
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      })

      return response.choices.length > 0
    } catch (error) {
      console.error(`${this.provider} 配置验证失败:`, error)
      return false
    }
  }

  private convertMessages(messages: ConversationMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map(msg => {
      if (msg.role === 'system') {
        return { role: 'system', content: msg.content }
      } else if (msg.role === 'user') {
        return { role: 'user', content: msg.content }
      } else {
        return { role: 'assistant', content: msg.content }
      }
    })
  }
}
