/**
 * AI Agent 类型定义
 * 定义 AI 决策的输入输出格式
 */

import type { ItemType } from '@/entities/items'
import type { ShellType } from '@/entities/shell'

// ============================================
// AI 动作类型
// ============================================

export type ActionType = 'USE_ITEM' | 'SHOOT_OPPONENT' | 'SHOOT_SELF'

export interface UseItemAction {
  type: 'USE_ITEM'
  itemId: ItemType
  // 肾上腺素需要指定偷取哪个道具
  targetItem?: ItemType
}

export interface ShootAction {
  type: 'SHOOT_OPPONENT' | 'SHOOT_SELF'
}

export type AgentAction = UseItemAction | ShootAction

// ============================================
// AI 输出格式（严格的 JSON Schema）
// ============================================

export interface AgentTurnOutput {
  /** 内心独白/思考过程，用于调试和 UI 展示 */
  thought: string

  /** 恶魔说的话，符合其冷漠人格 */
  dialogue: string

  /** 决策：使用道具或开枪 */
  action: AgentAction
}

// ============================================
// 游戏状态快照（发送给 AI 的状态）
// ============================================

export interface PlayerSnapshot {
  name: string
  health: number
  maxHealth: number
  items: ItemType[]
  isHandcuffed: boolean
  sawActive: boolean
}

export interface GameSnapshot {
  round: number
  /** 剩余子弹信息 */
  remainingShells: {
    total: number
    liveCount: number
    blankCount: number
  }
  /** 当前子弹是否已知（放大镜/逆转器后） */
  currentShellKnown: ShellType | null
  /** 电话提示 */
  phoneHint: string | null
  /** 自己的状态 */
  self: PlayerSnapshot
  /** 对手的状态 */
  opponent: PlayerSnapshot
  /** 是否是自己的回合 */
  isMyTurn: boolean
  /** 行动历史（最近的 N 条） */
  recentActions: string[]
}

// ============================================
// AI 询问类型（多轮对话）
// ============================================

export type QueryType =
  | 'TURN_START'      // 回合开始，完整决策
  | 'USE_MORE_ITEMS'  // 已使用道具，是否继续使用
  | 'CONFIRM_SHOOT'   // 确认开枪方向

export interface AgentQuery {
  type: QueryType
  gameState: GameSnapshot
  /** 本回合已使用的道具 */
  usedItemsThisTurn: ItemType[]
  /** 附加上下文（如上一个动作的结果） */
  context?: string
}

// ============================================
// AI 响应验证
// ============================================

export interface ValidationResult {
  valid: boolean
  error?: string
  /** 修复后的输出（如果可以自动修复） */
  fixed?: AgentTurnOutput
}

/**
 * 验证 AI 输出是否符合格式要求
 */
export function validateAgentOutput(
  output: unknown,
  availableItems: ItemType[]
): ValidationResult {
  if (!output || typeof output !== 'object') {
    return { valid: false, error: '输出必须是对象' }
  }

  const obj = output as Record<string, unknown>

  // 检查必需字段
  if (typeof obj.thought !== 'string') {
    return { valid: false, error: '缺少 thought 字段' }
  }
  if (typeof obj.dialogue !== 'string') {
    return { valid: false, error: '缺少 dialogue 字段' }
  }
  if (!obj.action || typeof obj.action !== 'object') {
    return { valid: false, error: '缺少 action 字段' }
  }

  const action = obj.action as Record<string, unknown>

  // 验证 action 类型
  if (!['USE_ITEM', 'SHOOT_OPPONENT', 'SHOOT_SELF'].includes(action.type as string)) {
    return { valid: false, error: `无效的 action.type: ${action.type}` }
  }

  // 如果是使用道具，验证道具 ID
  if (action.type === 'USE_ITEM') {
    if (!action.itemId || typeof action.itemId !== 'string') {
      return { valid: false, error: '使用道具时必须指定 itemId' }
    }
    if (!availableItems.includes(action.itemId as ItemType)) {
      return {
        valid: false,
        error: `道具 ${action.itemId} 不可用，可用道具: ${availableItems.join(', ')}`
      }
    }
    // 肾上腺素需要 targetItem
    if (action.itemId === 'adrenaline' && !action.targetItem) {
      return { valid: false, error: '使用肾上腺素时必须指定 targetItem' }
    }
  }

  return { valid: true }
}

// ============================================
// JSON Schema（用于约束 LLM 输出）
// ============================================

export const AGENT_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    thought: {
      type: 'string',
      description: '你的内心思考过程，分析当前局势和决策理由',
    },
    dialogue: {
      type: 'string',
      description: '你作为恶魔说的话，保持简短、冷漠、带有金属质感',
    },
    action: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['USE_ITEM', 'SHOOT_OPPONENT', 'SHOOT_SELF'],
          description: '动作类型：使用道具、射击对手、射击自己',
        },
        itemId: {
          type: 'string',
          enum: ['saw', 'handcuffs', 'cigarettes', 'magnifier', 'drink', 'adrenaline', 'medicine', 'inverter', 'phone'],
          description: '使用的道具ID（仅当 type 为 USE_ITEM 时需要）',
        },
        targetItem: {
          type: 'string',
          description: '肾上腺素偷取的目标道具（仅当使用肾上腺素时需要）',
        },
      },
      required: ['type'],
    },
  },
  required: ['thought', 'dialogue', 'action'],
} as const
