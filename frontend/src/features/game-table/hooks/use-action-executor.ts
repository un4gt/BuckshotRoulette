/**
 * useActionExecutor Hook
 * 执行 AI 决策的动作
 */

import { useCallback } from 'react'
import { useGameStore } from '@/app/stores/game-store'
import type { AgentAction } from '@/agents/types'
import type { ItemType } from '@/entities/items'

export function useActionExecutor() {
  const { game, useItem, shoot } = useGameStore()

  /**
   * 执行 AI 动作
   * @returns 是否成功执行
   */
  const executeAction = useCallback(
    async (action: AgentAction, playerRole: 'player' | 'demon'): Promise<boolean> => {
      if (!game) return false

      const currentPlayer = playerRole === 'player' ? game.player : game.demon

      try {
        switch (action.type) {
          case 'USE_ITEM': {
            const itemType = action.itemId as ItemType

            // 查找该类型的未使用道具
            const item = currentPlayer.items.find(
              (i) => i.type === itemType && !i.used
            )

            if (!item) {
              console.error(`道具 ${itemType} 不可用`)
              return false
            }

            // 如果是肾上腺素，需要传入目标道具
            if (itemType === 'adrenaline') {
              if (!action.targetItem) {
                console.error('使用肾上腺素时必须指定 targetItem')
                return false
              }
              useItem(item.id, action.targetItem as ItemType)
            } else {
              useItem(item.id)
            }

            return true
          }

          case 'SHOOT_OPPONENT': {
            shoot('opponent')
            return true
          }

          case 'SHOOT_SELF': {
            shoot('self')
            return true
          }

          default:
            console.error('未知的动作类型:', action)
            return false
        }
      } catch (error) {
        console.error('执行动作时出错:', error)
        return false
      }
    },
    [game, useItem, shoot]
  )

  return { executeAction }
}
