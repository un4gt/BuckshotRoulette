/**
 * 游戏状态序列化器
 * 将游戏状态转化为 AI 可理解的提示词
 */

import type { GameState, PlayerState, ItemUseRecord } from '@/app/stores/game-store'
import type { ItemType } from '@/entities/items'
import { ITEM_INFO } from '@/entities/items'
import type { GameSnapshot, PlayerSnapshot, QueryType } from '../types'

// ============================================
// 状态转换：GameState -> GameSnapshot
// ============================================

function serializePlayer(player: PlayerState): PlayerSnapshot {
  return {
    name: player.name,
    health: player.health,
    maxHealth: player.maxHealth,
    items: player.items.filter(i => !i.used).map(i => i.type),
    isHandcuffed: player.isHandcuffed,
    sawActive: player.sawActive,
  }
}

/**
 * 从当前玩家视角创建游戏快照
 * @param game 游戏状态
 * @param perspective 视角（demon 或 player）
 */
export function createGameSnapshot(
  game: GameState,
  perspective: 'demon' | 'player'
): GameSnapshot {
  const self = perspective === 'demon' ? game.demon : game.player
  const opponent = perspective === 'demon' ? game.player : game.demon

  const remainingShells = game.shells.slice(game.currentShellIndex)
  const liveCount = remainingShells.filter(s => s.type === 'live').length
  const blankCount = remainingShells.filter(s => s.type === 'blank').length

  return {
    round: game.round,
    remainingShells: {
      total: remainingShells.length,
      liveCount,
      blankCount,
    },
    // 只有当前玩家的私有信息
    currentShellKnown: self.knownCurrentShell,
    phoneHint: self.phoneHint,
    self: serializePlayer(self),
    opponent: serializePlayer(opponent),
    isMyTurn: game.currentTurn === perspective,
    recentActions: game.actionLog.slice(-10),
  }
}

// ============================================
// 状态 -> 提示词
// ============================================

function formatItems(items: ItemType[]): string {
  if (items.length === 0) return '无'
  return items.map(type => {
    const info = ITEM_INFO[type]
    return `${info.icon} ${info.name}`
  }).join('、')
}

function formatItemsDetailed(items: ItemType[]): string {
  if (items.length === 0) return '无可用道具'
  return items.map(type => {
    const info = ITEM_INFO[type]
    return `- ${info.icon} ${info.name}: ${info.description}`
  }).join('\n')
}

export function serializeGameState(snapshot: GameSnapshot): string {
  const { self, opponent, remainingShells, currentShellKnown, phoneHint } = snapshot

  const liveProbability = remainingShells.total > 0
    ? Math.round(remainingShells.liveCount / remainingShells.total * 100)
    : 0

  let stateText = `
## 当前局势

### 回合信息
- 当前回合: 第 ${snapshot.round} 回合
- 轮到: ${snapshot.isMyTurn ? '你' : '对手'}

### 弹仓状态
- 剩余子弹: ${remainingShells.total} 发
- 实弹数量: ${remainingShells.liveCount} 发
- 空弹数量: ${remainingShells.blankCount} 发
- 实弹概率: ${liveProbability}%
${currentShellKnown ? `- ⚠️ 【已知】当前子弹: ${currentShellKnown === 'live' ? '🔴 实弹' : '⚫ 空弹'}` : '- 当前子弹: 未知'}
${phoneHint ? `- 📞 【电话提示】${phoneHint}` : ''}

### 你的状态
- 名称: ${self.name}
- 电量/血量: ${self.health}/${self.maxHealth} ${'█'.repeat(self.health)}${'░'.repeat(self.maxHealth - self.health)}
- 道具: ${formatItems(self.items)}
${self.sawActive ? '- ⚠️ 锯子效果激活（下一发伤害翻倍）' : ''}
${self.isHandcuffed ? '- ⛓️ 被手铐束缚（下回合跳过）' : ''}

### 对手状态
- 名称: ${opponent.name}
- 电量/血量: ${opponent.health}/${opponent.maxHealth} ${'█'.repeat(opponent.health)}${'░'.repeat(opponent.maxHealth - opponent.health)}
- 道具: ${formatItems(opponent.items)}
${opponent.sawActive ? '- ⚠️ 对手锯子效果激活' : ''}
${opponent.isHandcuffed ? '- ⛓️ 对手被手铐束缚（下回合跳过）' : ''}
`.trim()

  return stateText
}

export function serializeAvailableActions(snapshot: GameSnapshot): string {
  const { self } = snapshot

  let actionsText = `
## 可用行动

### 道具（可连续使用多个，使用后仍可继续行动）
${formatItemsDetailed(self.items)}

### 开枪（必须二选一，执行后结算）
- 🎯 **SHOOT_OPPONENT** - 射击对手
  - 实弹: 对手受到 ${self.sawActive ? '2' : '1'} 点伤害，回合结束
  - 空弹: 无伤害，回合结束
- 💀 **SHOOT_SELF** - 射击自己
  - 实弹: 自己受到 ${self.sawActive ? '2' : '1'} 点伤害，回合结束
  - 空弹: 无伤害，**继续行动**（不换人）
`.trim()

  return actionsText
}

// ============================================
// 构建查询提示词
// ============================================

export interface QueryContext {
  /** 本回合已使用的道具 */
  usedItemsThisTurn: ItemUseRecord[]
  /** 上一个动作的结果描述 */
  lastActionResult?: string
}

export function buildQueryPrompt(
  snapshot: GameSnapshot,
  queryType: QueryType,
  context?: QueryContext
): string {
  const statePrompt = serializeGameState(snapshot)
  const actionsPrompt = serializeAvailableActions(snapshot)

  let contextPrompt = ''

  switch (queryType) {
    case 'TURN_START':
      contextPrompt = `
## 决策要求

现在轮到你行动。请：
1. 分析弹仓概率和双方状态
2. 决定是否使用道具（可以使用多个）
3. 最终决定向谁开枪

请输出一个决策（使用道具或开枪）。
`
      break

    case 'USE_MORE_ITEMS': {
      const usedItems = context?.usedItemsThisTurn || []
      const usedItemNames = usedItems.map(r => {
        const info = ITEM_INFO[r.itemType]
        return `${info.icon} ${info.name}`
      }).join('、')

      contextPrompt = `
## 本回合已执行的动作

你本回合已使用道具: ${usedItemNames || '无'}

${context?.lastActionResult ? `上一个动作结果: ${context.lastActionResult}` : ''}

## 决策要求

你还有剩余道具可用。请决定：
1. 继续使用道具？（选择 USE_ITEM）
2. 不再使用，直接开枪？（选择 SHOOT_OPPONENT 或 SHOOT_SELF）

请输出你的下一个决策。
`
      break
    }

    case 'CONFIRM_SHOOT':
      contextPrompt = `
## 决策要求

你已无道具可用或选择不再使用道具。
现在**必须开枪**。

请决定射击方向：
- **SHOOT_OPPONENT**: 射击对手
- **SHOOT_SELF**: 射击自己（空弹时可保持回合）

基于当前实弹概率 (${Math.round(snapshot.remainingShells.liveCount / snapshot.remainingShells.total * 100)}%) 做出最优选择。
`
      break
  }

  return `
${statePrompt}

${actionsPrompt}

${contextPrompt}
`.trim()
}

// ============================================
// 构建对话历史
// ============================================

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * 构建完整的对话历史
 */
export function buildConversationHistory(
  systemPrompt: string,
  currentQuery: string,
  previousTurns: Array<{ userMessage: string; assistantResponse: string }>
): ConversationMessage[] {
  const messages: ConversationMessage[] = [
    { role: 'system', content: systemPrompt },
  ]

  // 添加之前的对话轮次
  for (const turn of previousTurns) {
    messages.push({ role: 'user', content: turn.userMessage })
    messages.push({ role: 'assistant', content: turn.assistantResponse })
  }

  // 添加当前查询
  messages.push({ role: 'user', content: currentQuery })

  return messages
}

/**
 * 将道具使用记录转换为对话历史格式
 */
export function itemUseRecordsToConversation(
  _records: ItemUseRecord[],
  _perspective: 'demon' | 'player'
): Array<{ userMessage: string; assistantResponse: string }> {
  // 这里可以根据需要将道具使用记录转换为对话格式
  // 但通常我们会在每次 AI 决策后直接记录
  return []
}
