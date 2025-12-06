/**
 * AI Services 入口
 * 初始化并导出所有 AI 服务
 */

import { registerBridge } from './ai-bridge'
import { GeminiBridge, OpenAIBridge } from './bridges'
import type { AIBridgeConfig } from './ai-bridge'

// 为 OpenAI 变体创建桥接器类
class OpenAIBridgeFactory extends OpenAIBridge {
  constructor(config: AIBridgeConfig) {
    super(config, 'openai')
  }
}

class OpenRouterBridgeFactory extends OpenAIBridge {
  constructor(config: AIBridgeConfig) {
    super(config, 'openrouter')
  }
}

class DeepSeekBridgeFactory extends OpenAIBridge {
  constructor(config: AIBridgeConfig) {
    super(config, 'deepseek')
  }
}

class GrokBridgeFactory extends OpenAIBridge {
  constructor(config: AIBridgeConfig) {
    super(config, 'grok')
  }
}

class OpenAICompatibleBridgeFactory extends OpenAIBridge {
  constructor(config: AIBridgeConfig) {
    super(config, 'openai-compatible')
  }
}

// 注册所有 AI bridges
export function initializeAIBridges() {
  registerBridge('gemini', GeminiBridge)
  registerBridge('openai', OpenAIBridgeFactory)
  registerBridge('openrouter', OpenRouterBridgeFactory)
  registerBridge('deepseek', DeepSeekBridgeFactory)
  registerBridge('grok', GrokBridgeFactory)
  registerBridge('openai-compatible', OpenAICompatibleBridgeFactory)
}

// 导出所有公共接口
export {
  extractJsonFromResponse,
  parseAgentResponse,
  registerBridge,
  createBridge,
  ConversationManager,
} from './ai-bridge'
export type { AIBridge, AIBridgeConfig, StreamCallbacks } from './ai-bridge'
export * from './bridges'
