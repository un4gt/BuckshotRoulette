/**
 * useAITurn Hook
 * 处理 AI 回合的逻辑，支持 AI vs AI 模式和观战控制
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '@/app/stores/game-store'
import { useGameSettingsStore } from '@/app/stores/game-settings'
import { useLLMLogStore } from '@/app/stores/llm-log-store'
import {
  createBridge,
  ConversationManager,
} from '@/agents/services'
import {
  createGameSnapshot,
  buildQueryPrompt,
} from '@/agents/strategies/state-serializer'
import { buildSystemPrompt } from '@/agents/prompts/system-prompt'
import { useActionExecutor } from './use-action-executor'
import type { AgentTurnOutput } from '@/agents/types'

interface AITurnState {
  isThinking: boolean
  thought: string
  dialogue: string
  error: string | null
}

const initialAIState: AITurnState = {
  isThinking: false,
  thought: '',
  dialogue: '',
  error: null,
}

export function useAITurn() {
  const { game } = useGameStore()
  const { settings, setSpectatePaused } = useGameSettingsStore()
  const { addLog } = useLLMLogStore()
  const { executeAction } = useActionExecutor()

  // 双方 AI 独立状态
  const [playerAiState, setPlayerAiState] = useState<AITurnState>(initialAIState)
  const [demonAiState, setDemonAiState] = useState<AITurnState>(initialAIState)

  // 每方 AI 使用独立的 conversation manager
  const playerConversationRef = useRef<ConversationManager | null>(null)
  const demonConversationRef = useRef<ConversationManager | null>(null)
  const isProcessingRef = useRef(false)

  // 观战控制 - 等待暂停解除
  const waitForUnpause = useCallback(async () => {
    const { spectate } = settings
    if (!spectate.isPaused) return

    // 等待暂停解除
    return new Promise<void>((resolve) => {
      const checkPause = () => {
        const currentSettings = useGameSettingsStore.getState().settings
        if (!currentSettings.spectate.isPaused) {
          resolve()
        } else {
          setTimeout(checkPause, 100)
        }
      }
      checkPause()
    })
  }, [settings])

  // 根据速度计算延迟时间
  const getDelayTime = useCallback((baseDelay: number) => {
    const { speed } = settings.spectate
    return baseDelay / speed
  }, [settings.spectate])

  /**
   * 初始化 Conversation Manager
   */
  const initConversation = useCallback((playerRole: 'player' | 'demon') => {
    const aiConfig = playerRole === 'demon' ? settings.demonAI : settings.playerAI
    const conversationRef = playerRole === 'demon' ? demonConversationRef : playerConversationRef

    if (!aiConfig || !aiConfig.apiKey) {
      const errorMsg = 'AI 配置未设置或 API Key 为空'
      const setState = playerRole === 'demon' ? setDemonAiState : setPlayerAiState
      setState((prev) => ({
        ...prev,
        error: errorMsg,
      }))
      addLog({
        type: 'error',
        role: playerRole,
        title: '初始化失败',
        content: errorMsg,
      })
      return null
    }

    try {
      addLog({
        type: 'system',
        role: playerRole,
        title: '初始化 AI 服务',
        content: `Provider: ${aiConfig.provider}\nModel: ${aiConfig.model}`,
      })

      const bridge = createBridge(aiConfig)
      const systemPrompt = buildSystemPrompt()
      conversationRef.current = new ConversationManager(bridge, systemPrompt)

      addLog({
        type: 'system',
        role: playerRole,
        title: '系统提示词已加载',
        content: `共 ${systemPrompt.length} 字符`,
        details: systemPrompt,
      })

      return conversationRef.current
    } catch (error) {
      console.error('初始化 AI Bridge 失败:', error)
      const errorMsg = error instanceof Error ? error.message : '初始化失败'
      const setState = playerRole === 'demon' ? setDemonAiState : setPlayerAiState
      setState((prev) => ({
        ...prev,
        error: errorMsg,
      }))
      addLog({
        type: 'error',
        role: playerRole,
        title: '初始化 AI Bridge 失败',
        content: errorMsg,
      })
      return null
    }
  }, [settings, addLog])

  /**
   * 执行 AI 回合
   */
  const executeAITurn = useCallback(
    async (playerRole: 'player' | 'demon') => {
      if (!game || isProcessingRef.current) return

      isProcessingRef.current = true
      const setState = playerRole === 'demon' ? setDemonAiState : setPlayerAiState
      const conversationRef = playerRole === 'demon' ? demonConversationRef : playerConversationRef

      setState({
        isThinking: true,
        thought: '',
        dialogue: '',
        error: null,
      })

      addLog({
        type: 'system',
        role: playerRole,
        title: 'AI 回合开始',
        content: `当前回合: ${game.round}, 阶段: ${game.phase}`,
      })

      try {
        // 观战模式：等待暂停解除
        await waitForUnpause()

        // 初始化对话管理器（如果需要）
        let conversation = conversationRef.current
        if (!conversation) {
          conversation = initConversation(playerRole)
          if (!conversation) {
            throw new Error('无法初始化 AI 服务')
          }
        }

        // 创建游戏状态快照
        const snapshot = createGameSnapshot(game, playerRole)

        addLog({
          type: 'system',
          role: playerRole,
          title: '游戏状态快照',
          content: `我方血量: ${snapshot.self.health}/${snapshot.self.maxHealth}\n对方血量: ${snapshot.opponent.health}/${snapshot.opponent.maxHealth}\n剩余子弹: ${snapshot.remainingShells.total} (实弹率: ${Math.round(snapshot.remainingShells.liveCount / snapshot.remainingShells.total * 100)}%)`,
          details: JSON.stringify(snapshot, null, 2),
        })

        // 构建查询提示词
        const queryPrompt = buildQueryPrompt(snapshot, 'TURN_START')

        addLog({
          type: 'request',
          role: playerRole,
          title: '发送查询',
          content: `向 AI 发送回合决策请求...`,
          details: queryPrompt,
        })

        // 查询 AI（流式）
        await conversation.chatStream(queryPrompt, {
          onThought: (thought) => {
            setState((prev) => ({ ...prev, thought }))
            addLog({
              type: 'thought',
              role: playerRole,
              title: 'AI 思考中',
              content: thought,
            })
          },
          onDialogue: (dialogue) => {
            setState((prev) => ({ ...prev, dialogue }))
            addLog({
              type: 'dialogue',
              role: playerRole,
              title: 'AI 对话',
              content: dialogue,
            })
          },
          onComplete: async (output: AgentTurnOutput) => {
            // 记录完整响应
            addLog({
              type: 'response',
              role: playerRole,
              title: '收到完整响应',
              content: `思考: ${output.thought}\n对话: ${output.dialogue}`,
              details: JSON.stringify(output, null, 2),
            })

            // 记录决策
            const actionDesc = output.action.type === 'USE_ITEM'
              ? `使用道具: ${(output.action as { itemId: string }).itemId}`
              : output.action.type === 'SHOOT_SELF'
              ? '射击自己'
              : '射击对手'

            addLog({
              type: 'action',
              role: playerRole,
              title: 'AI 决策',
              content: actionDesc,
              details: JSON.stringify(output.action, null, 2),
            })

            // 显示完整的思考和对话
            setState((prev) => ({
              ...prev,
              thought: output.thought,
              dialogue: output.dialogue,
              isThinking: false,
            }))

            // 观战模式：等待一段时间让用户看到对话（根据速度调整）
            await new Promise((resolve) => setTimeout(resolve, getDelayTime(1500)))

            // 单步模式：动作执行前暂停
            const currentSettings = useGameSettingsStore.getState().settings
            if (currentSettings.spectate.stepMode) {
              setSpectatePaused(true)
              await waitForUnpause()
            }

            // 执行动作
            const success = await executeAction(output.action, playerRole)

            if (!success) {
              throw new Error('执行动作失败')
            }

            addLog({
              type: 'system',
              role: playerRole,
              title: '动作执行完成',
              content: success ? '✓ 成功' : '✗ 失败',
            })

            // 动作完成后短暂延迟
            await new Promise((resolve) => setTimeout(resolve, getDelayTime(500)))
          },
          onError: (error) => {
            console.error('AI 回合错误:', error)
            setState({
              isThinking: false,
              thought: '',
              dialogue: '',
              error: error.message,
            })
            addLog({
              type: 'error',
              role: playerRole,
              title: 'AI 回合错误',
              content: error.message,
            })
          },
        })
      } catch (error) {
        console.error('AI 回合执行失败:', error)
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        setState({
          isThinking: false,
          thought: '',
          dialogue: '',
          error: errorMsg,
        })
        addLog({
          type: 'error',
          role: playerRole,
          title: 'AI 回合执行失败',
          content: errorMsg,
        })
      } finally {
        isProcessingRef.current = false
      }
    },
    [game, initConversation, executeAction, addLog, waitForUnpause, getDelayTime, setSpectatePaused]
  )

  /**
   * 监听游戏状态，自动执行 AI 回合
   */
  useEffect(() => {
    if (!game) return

    // 确保只在有效的游戏状态下触发 AI 回合
    // 检查是否有弹药（避免在 startNewRound 完成前触发）
    const hasAmmo = game.shells.length > 0 && game.currentShellIndex < game.shells.length

    // 检查是否是 AI 的回合
    if (game.phase === 'demon-turn' && game.demon.isAI && hasAmmo) {
      executeAITurn('demon')
    } else if (game.phase === 'player-turn' && game.player.isAI && hasAmmo) {
      executeAITurn('player')
    }
  }, [game?.phase, game?.currentTurn, game?.shells.length, game?.currentShellIndex, executeAITurn])

  /**
   * 游戏重置时清理对话历史
   */
  useEffect(() => {
    if (!game) {
      playerConversationRef.current = null
      demonConversationRef.current = null
      setPlayerAiState(initialAIState)
      setDemonAiState(initialAIState)
    }
  }, [game])

  // 返回当前回合的 AI 状态（向后兼容）
  const currentAiState = game?.currentTurn === 'demon' ? demonAiState : playerAiState

  return {
    aiState: currentAiState,
    playerAiState,
    demonAiState,
    executeAITurn,
    isAIvsAI: game?.player.isAI && game?.demon.isAI,
  }
}
