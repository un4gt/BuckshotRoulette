/**
 * Google Gemini AI Bridge
 * 使用 @google/generative-ai SDK
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  AIBridge,
  AIBridgeConfig,
  StreamCallbacks,
} from '../ai-bridge'
import { parseAgentResponse } from '../ai-bridge'
import type { AgentTurnOutput } from '@/agents/types'
import type { ConversationMessage } from '@/agents/strategies/state-serializer'

export class GeminiBridge implements AIBridge {
  readonly provider = 'gemini' as const
  private client: GoogleGenerativeAI
  private config: AIBridgeConfig

  constructor(config: AIBridgeConfig) {
    this.config = config
    this.client = new GoogleGenerativeAI(config.apiKey)
  }

  async query(messages: ConversationMessage[]): Promise<AgentTurnOutput> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      })

      // 转换消息格式
      const geminiMessages = this.convertMessages(messages)

      // 发送请求
      const result = await model.generateContent({
        contents: geminiMessages,
      })

      const response = result.response
      const text = response.text()

      // 解析响应
      return parseAgentResponse(text)
    } catch (error) {
      throw new Error(`Gemini API 调用失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async queryStream(
    messages: ConversationMessage[],
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      })

      const geminiMessages = this.convertMessages(messages)

      // 使用流式生成
      const result = await model.generateContentStream({
        contents: geminiMessages,
      })

      let accumulatedText = ''
      let thoughtExtracted = false
      let dialogueExtracted = false

      // 处理流式响应
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        accumulatedText += chunkText

        // 尝试提取 thought（仅提取一次）
        if (!thoughtExtracted && callbacks.onThought) {
          const thoughtMatch = accumulatedText.match(/"thought"\s*:\s*"([^"]*)"/)
          if (thoughtMatch) {
            callbacks.onThought(thoughtMatch[1])
            thoughtExtracted = true
          }
        }

        // 尝试提取 dialogue（仅提取一次）
        if (!dialogueExtracted && callbacks.onDialogue) {
          const dialogueMatch = accumulatedText.match(/"dialogue"\s*:\s*"([^"]*)"/)
          if (dialogueMatch) {
            callbacks.onDialogue(dialogueMatch[1])
            dialogueExtracted = true
          }
        }
      }

      // 流式完成，解析完整响应
      const output = parseAgentResponse(accumulatedText)

      callbacks.onComplete?.(output)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      callbacks.onError?.(err)
      throw err
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
      })

      // 发送一个简单的测试请求
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'test' }] }],
      })

      return result.response.text().length > 0
    } catch (error) {
      console.error('Gemini 配置验证失败:', error)
      return false
    }
  }

  /**
   * 转换消息格式为 Gemini 格式
   */
  private convertMessages(messages: ConversationMessage[]) {
    const geminiMessages: Array<{
      role: 'user' | 'model'
      parts: Array<{ text: string }>
    }> = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Gemini 没有 system role，将其作为第一个 user 消息
        geminiMessages.push({
          role: 'user',
          parts: [{ text: `[System Instructions]\n${msg.content}` }],
        })
      } else if (msg.role === 'user') {
        geminiMessages.push({
          role: 'user',
          parts: [{ text: msg.content }],
        })
      } else if (msg.role === 'assistant') {
        geminiMessages.push({
          role: 'model',
          parts: [{ text: msg.content }],
        })
      }
    }

    return geminiMessages
  }
}
