import { create } from 'zustand'
import { type Shell, generateShells } from '@/entities/shell'
import { type Item, type ItemType, generateItems } from '@/entities/items'
import type { AIProvider } from './game-settings'
import type { ShellType } from '@/entities/shell'

export type PlayerRole = 'player' | 'demon'

/** 道具使用记录 */
export interface ItemUseRecord {
  itemType: ItemType
  result: string
  /** 是否为私有结果（只有使用者知道） */
  isPrivate: boolean
  /** 私有数据（如放大镜看到的子弹类型） */
  privateData?: unknown
}

export interface PlayerState {
  role: PlayerRole
  name: string
  health: number
  maxHealth: number
  items: Item[]
  isAI: boolean
  aiProvider?: AIProvider
  isHandcuffed: boolean
  sawActive: boolean
  /** 闸刀状态：生命值低于阈值时触发，被实弹击中直接死亡 */
  guillotineActive: boolean

  // === 私有信息（只有该玩家知道） ===
  /** 放大镜查看的当前子弹类型 */
  knownCurrentShell: ShellType | null
  /** 电话提示内容 */
  phoneHint: string | null
  /** 是否使用过逆转器（需要更新已知子弹状态） */
  usedInverterOnKnownShell: boolean
}

export type GamePhase =
  | 'idle'           // 未开始
  | 'loading'        // 加载中
  | 'round-start'    // 回合开始（上弹、发道具）
  | 'player-turn'    // 玩家回合
  | 'demon-turn'     // 恶魔回合
  | 'shooting'       // 开枪动画中
  | 'round-end'      // 回合结束
  | 'endless-prompt' // 无尽模式选择（三回合胜利后）
  | 'game-over'      // 游戏结束

export interface GameState {
  phase: GamePhase
  // === 三局制状态 ===
  match: MatchNumber           // 当前大局（1/2/3）
  subRound: number             // 当前小局（弹药轮次）
  matchConfig: MatchConfig     // 当前局配置

  round: number
  shells: Shell[]
  currentShellIndex: number
  liveCount: number
  blankCount: number
  player: PlayerState
  demon: PlayerState
  currentTurn: PlayerRole
  winner: PlayerRole | null
  actionLog: string[]

  // === 本回合信息 ===
  /** 本回合使用的道具记录 */
  currentTurnItemUses: ItemUseRecord[]
  /** 当前射击目标（用于动画） */
  shootingTarget: 'self' | 'opponent' | null
  /** 当前射击的子弹类型（用于动画，射击后设置） */
  lastShotResult: 'live' | 'blank' | null

  // === 分数系统（仅 Human vs AI 模式） ===
  /** 当前累计分数 */
  score: number
  /** 是否进入无尽模式 */
  isEndlessMode: boolean
  /** 无尽模式轮数（从1开始） */
  endlessRound: number
}

interface GameStore {
  game: GameState | null

  // Actions
  initGame: (params: {
    playerName: string
    isPlayerAI: boolean
    playerAIProvider?: AIProvider
    playerAIModel?: string
    demonAIProvider: AIProvider
    demonAIModel: string
  }) => void

  startNewRound: () => void
  /** 进入下一大局（一方死亡后） */
  advanceMatch: () => void
  shoot: (target: 'self' | 'opponent') => void
  useItem: (itemId: string, targetItem?: ItemType) => ItemUseRecord | null
  nextTurn: () => void
  addLog: (message: string) => void
  setPhase: (phase: GamePhase) => void
  resetGame: () => void
  /** 检查并更新闸刀状态 */
  checkGuillotine: () => void

  // 获取当前玩家的私有信息
  getCurrentPlayerPrivateInfo: () => { knownShell: ShellType | null; phoneHint: string | null } | null

  // === 分数与无尽模式 ===
  /** 计算当前回合分数（不含倍数） */
  calculateMatchScore: () => number
  /** 结算当前回合分数并累加 */
  settleMatchScore: () => void
  /** 开始无尽模式 */
  startEndlessMode: () => void
  /** 拒绝无尽模式，结束游戏 */
  declineEndlessMode: () => void
}

// === 三局制配置 ===
export type MatchNumber = 1 | 2 | 3

export interface MatchConfig {
  initialHealth: number
  itemsPerRound: number
  initialShells: number   // 该局起始子弹数
  hasGuillotine: boolean  // 闸刀机制（第三局）
}

// 子弹数量上限
const MAX_SHELLS = 8

export const MATCH_CONFIGS: Record<MatchNumber, MatchConfig> = {
  1: { initialHealth: 2, itemsPerRound: 0, initialShells: 2, hasGuillotine: false },  // 第一局：纯心理博弈，无道具
  2: { initialHealth: 4, itemsPerRound: 2, initialShells: 3, hasGuillotine: false },  // 第二局：引入道具
  3: { initialHealth: 5, itemsPerRound: 4, initialShells: 4, hasGuillotine: true },   // 第三局：闸刀机制
}

// 闸刀触发阈值：生命值低于此值时触发一击必杀
const GUILLOTINE_THRESHOLD = 2

// === 分数系统常量 ===
const MATCH_BASE_SCORES: Record<MatchNumber, number> = {
  1: 100,
  2: 250,
  3: 500,
}
const ENDLESS_BASE_SCORE = 500  // 无尽模式基础分（同第三回合）
const HP_BONUS = 25             // 每点血量奖励
const ITEM_BONUS = 30           // 每个未使用道具奖励
const ENDLESS_MULTIPLIER = 2    // 无尽模式倍数

function createInitialPlayerState(
  role: PlayerRole,
  name: string,
  isAI: boolean,
  aiProvider?: AIProvider,
  initialHealth: number = 4
): PlayerState {
  return {
    role,
    name,
    health: initialHealth,
    maxHealth: initialHealth,
    items: [],
    isAI,
    aiProvider,
    isHandcuffed: false,
    sawActive: false,
    guillotineActive: false,
    knownCurrentShell: null,
    phoneHint: null,
    usedInverterOnKnownShell: false,
  }
}

function clearPlayerTurnState(player: PlayerState): PlayerState {
  return {
    ...player,
    knownCurrentShell: null,
    phoneHint: null,
    usedInverterOnKnownShell: false,
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,

  initGame: ({ playerName, isPlayerAI, playerAIProvider, playerAIModel, demonAIProvider, demonAIModel }) => {
    const initialMatch: MatchNumber = 1
    const matchConfig = MATCH_CONFIGS[initialMatch]

    // 生成 AI 名称：显示模型名称
    const playerDisplayName = isPlayerAI
      ? `玩家 AI: ${playerAIModel || playerAIProvider?.toUpperCase() || 'Unknown'}`
      : playerName || '玩家'
    const demonDisplayName = `恶魔 AI: ${demonAIModel || demonAIProvider?.toUpperCase() || 'Unknown'}`

    const game: GameState = {
      phase: 'loading',
      match: initialMatch,
      subRound: 1,
      matchConfig,
      round: 1,
      shells: [],
      currentShellIndex: 0,
      liveCount: 0,
      blankCount: 0,
      player: createInitialPlayerState(
        'player',
        playerDisplayName,
        isPlayerAI,
        playerAIProvider,
        matchConfig.initialHealth
      ),
      demon: createInitialPlayerState(
        'demon',
        demonDisplayName,
        true,
        demonAIProvider,
        matchConfig.initialHealth
      ),
      currentTurn: 'player',
      winner: null,
      actionLog: [],
      currentTurnItemUses: [],
      shootingTarget: null,
      lastShotResult: null,
      // 分数系统初始化（仅 Human vs AI 模式有效）
      score: 0,
      isEndlessMode: false,
      endlessRound: 0,
    }

    set({ game })
    get().addLog(`=== 第 ${initialMatch} 局开始 ===`)
    get().addLog(`生命值: ${matchConfig.initialHealth} | 每小局道具: ${matchConfig.itemsPerRound}`)
    get().startNewRound()
  },

  startNewRound: () => {
    const { game } = get()
    if (!game) return

    // === 子弹数量计算（递增制） ===
    // 公式：起始子弹数 + (小局数 - 1)，上限为 8
    const baseShells = game.matchConfig.initialShells
    const totalShells = Math.min(baseShells + (game.subRound - 1), MAX_SHELLS)

    // 实弹/空弹比例随机，但至少各1发
    const maxLive = totalShells - 1  // 至少留1发空弹
    const liveCount = Math.max(1, Math.floor(Math.random() * maxLive) + 1)
    const blankCount = totalShells - liveCount
    const shells = generateShells(liveCount, blankCount)

    // === 道具重置规则（每小局完全重置） ===
    // 根据当前局数配置发放新道具，不保留旧道具
    const itemsToGive = game.matchConfig.itemsPerRound
    const playerItems = itemsToGive > 0 ? generateItems(itemsToGive) : []
    const demonItems = itemsToGive > 0 ? generateItems(itemsToGive) : []

    set({
      game: {
        ...game,
        phase: 'round-start',
        subRound: game.subRound,
        shells,
        currentShellIndex: 0,
        liveCount,
        blankCount,
        player: {
          ...clearPlayerTurnState(game.player),
          // 完全重置道具（不保留未使用的）
          items: playerItems,
          isHandcuffed: false,
          sawActive: false,
        },
        demon: {
          ...clearPlayerTurnState(game.demon),
          // 完全重置道具（不保留未使用的）
          items: demonItems,
          isHandcuffed: false,
          sawActive: false,
        },
        currentTurnItemUses: [],
        shootingTarget: null,
        lastShotResult: null,
      },
    })

    get().addLog(`第 ${game.match} 局 - 小局 ${game.subRound}`)
    get().addLog(`装填子弹：${totalShells} 发（${liveCount} 实弹 / ${blankCount} 空弹）`)
    if (itemsToGive > 0) {
      get().addLog(`发放道具：每人 ${itemsToGive} 个`)
    }

    // 延迟后进入玩家回合
    setTimeout(() => {
      const { game: latestGame } = get()
      if (latestGame) {
        get().setPhase(latestGame.currentTurn === 'player' ? 'player-turn' : 'demon-turn')
      }
    }, 1500)
  },

  shoot: (target) => {
    const { game } = get()
    if (!game || game.phase === 'shooting') return

    const currentShell = game.shells[game.currentShellIndex]
    if (!currentShell) {
      get().startNewRound()
      return
    }

    const shooter = game.currentTurn === 'player' ? game.player : game.demon
    const opponent = game.currentTurn === 'player' ? game.demon : game.player
    const targetPlayer = target === 'self' ? shooter : opponent
    const damage = shooter.sawActive ? 2 : 1
    const shellType = currentShell.type // 预先获取子弹类型

    // 设置射击状态和子弹类型（用于动画）
    set({ game: { ...game, phase: 'shooting', shootingTarget: target, lastShotResult: shellType } })

    get().addLog(`${shooter.name} 向 ${target === 'self' ? '自己' : targetPlayer.name} 开枪...`)

    setTimeout(() => {
      const { game: currentGame } = get()
      if (!currentGame) return

      const isLive = shellType === 'live'

      if (isLive) {
        // 实弹命中
        // === 闸刀机制：检查是否触发一击必杀 ===
        const isGuillotineKill = targetPlayer.guillotineActive
        const newHealth = isGuillotineKill ? 0 : Math.max(0, targetPlayer.health - damage)

        const updatedShooter = {
          ...shooter,
          sawActive: false,
          knownCurrentShell: null, // 开枪后清除已知信息
        }
        const updatedTarget = {
          ...targetPlayer,
          health: newHealth,
        }

        if (isGuillotineKill) {
          get().addLog(`🔴 实弹！⚡ 闸刀触发！${targetPlayer.name} 被一击必杀！`)
        } else {
          get().addLog(`🔴 实弹！${targetPlayer.name} 受到 ${damage} 点伤害`)
        }

        if (newHealth <= 0) {
          // 玩家死亡 - 检查是否进入下一大局
          const isLastMatch = currentGame.match === 3 && !currentGame.isEndlessMode
          const isEndlessMatch = currentGame.isEndlessMode
          const winnerRole = targetPlayer.role === 'player' ? 'demon' : 'player'
          const isPlayerWin = winnerRole === 'player'
          const isHumanVsAI = !currentGame.player.isAI

          // 先结算分数（仅 Human vs AI 且真人获胜时）
          if (isHumanVsAI && isPlayerWin) {
            get().settleMatchScore()
          }

          // 获取结算后的游戏状态
          const gameAfterScore = get().game
          if (!gameAfterScore) return

          // 决定下一阶段
          let nextPhase: GamePhase
          if (isEndlessMatch) {
            // 无尽模式
            if (isPlayerWin) {
              // 无尽模式胜利：总分翻倍，显示继续选择
              const newScore = gameAfterScore.score * ENDLESS_MULTIPLIER
              set({
                game: {
                  ...gameAfterScore,
                  currentShellIndex: gameAfterScore.currentShellIndex + 1,
                  [targetPlayer.role]: updatedTarget,
                  [shooter.role]: updatedShooter,
                  phase: 'endless-prompt',
                  score: newScore,
                  endlessRound: gameAfterScore.endlessRound + 1,
                  shootingTarget: null,
                  lastShotResult: null,
                },
              })
              get().addLog(`${targetPlayer.name} 倒下了！`)
              get().addLog(`🎰 无尽模式第 ${gameAfterScore.endlessRound} 轮胜利！分数翻倍：${newScore} 分`)
              return
            } else {
              // 无尽模式失败：清空分数，游戏结束
              set({
                game: {
                  ...gameAfterScore,
                  currentShellIndex: gameAfterScore.currentShellIndex + 1,
                  [targetPlayer.role]: updatedTarget,
                  [shooter.role]: updatedShooter,
                  phase: 'game-over',
                  winner: winnerRole,
                  score: 0,
                  shootingTarget: null,
                  lastShotResult: null,
                },
              })
              get().addLog(`${targetPlayer.name} 倒下了！`)
              get().addLog(`💀 无尽模式失败！所有分数清零！`)
              get().addLog(`🏆 ${shooter.name} 最终获胜！`)
              return
            }
          } else if (isLastMatch) {
            // 第三回合结束
            if (isHumanVsAI && isPlayerWin) {
              // Human vs AI 且真人胜利：进入无尽模式选择
              nextPhase = 'endless-prompt'
            } else {
              // AI vs AI 或恶魔胜利：直接结束
              nextPhase = 'game-over'
            }
          } else {
            // 非最后一局：进入下一局
            nextPhase = 'round-end'
          }

          set({
            game: {
              ...gameAfterScore,
              currentShellIndex: gameAfterScore.currentShellIndex + 1,
              [targetPlayer.role]: updatedTarget,
              [shooter.role]: updatedShooter,
              phase: nextPhase,
              winner: nextPhase === 'game-over' ? winnerRole : null,
              shootingTarget: null,
              lastShotResult: null,
            },
          })

          get().addLog(`${targetPlayer.name} 倒下了！`)

          if (nextPhase === 'game-over') {
            get().addLog(`🏆 ${shooter.name} 最终获胜！`)
          } else if (nextPhase === 'endless-prompt') {
            get().addLog(`🎉 三回合全部获胜！当前分数：${gameAfterScore.score} 分`)
            get().addLog(`是否进入无尽模式挑战更高分数？`)
          } else {
            get().addLog(`本局结束，${shooter.name} 获胜！`)
            // 延迟后进入下一大局
            setTimeout(() => {
              get().advanceMatch()
            }, 2000)
          }
        } else {
          set({
            game: {
              ...currentGame,
              currentShellIndex: currentGame.currentShellIndex + 1,
              [targetPlayer.role]: updatedTarget,
              [shooter.role]: updatedShooter,
              shootingTarget: null,
              lastShotResult: null,
            },
          })
          // 检查并更新闸刀状态
          get().checkGuillotine()

          // 检查是否弹药用尽，如果是则不调用 nextTurn，等待 startNewRound
          const gameAfterShot = get().game
          if (gameAfterShot && gameAfterShot.currentShellIndex < gameAfterShot.shells.length) {
            get().nextTurn()
          }
        }
      } else {
        // 空弹
        get().addLog(`⚫ 空弹！`)

        const updatedShooter = {
          ...shooter,
          sawActive: false,
          knownCurrentShell: null, // 开枪后清除已知信息
        }

        set({
          game: {
            ...currentGame,
            currentShellIndex: currentGame.currentShellIndex + 1,
            [shooter.role]: updatedShooter,
            shootingTarget: null,
            lastShotResult: null,
          },
        })

        // 检查是否弹药用尽，如果是则不调用 nextTurn/setPhase，等待 startNewRound
        const gameAfterShot = get().game
        if (gameAfterShot && gameAfterShot.currentShellIndex < gameAfterShot.shells.length) {
          if (target === 'self') {
            // 射自己空弹，继续当前回合
            get().addLog(`${shooter.name} 继续行动`)
            get().setPhase(currentGame.currentTurn === 'player' ? 'player-turn' : 'demon-turn')
          } else {
            get().nextTurn()
          }
        } else if (target === 'self') {
          // 弹药用尽但射的是自己，记录日志
          get().addLog(`${shooter.name} 继续行动`)
        }
      }

      // 检查是否需要重新上弹（小局结束）
      const { game: latestGame } = get()
      if (latestGame && latestGame.currentShellIndex >= latestGame.shells.length && latestGame.phase !== 'game-over' && latestGame.phase !== 'round-end') {
        get().addLog('弹药用尽，重新装填...')
        setTimeout(() => {
          set((state) => ({
            game: state.game ? {
              ...state.game,
              round: state.game.round + 1,
              subRound: state.game.subRound + 1, // 增加小局计数
            } : null,
          }))
          get().startNewRound()
        }, 1000)
      }
    }, 1000)
  },

  useItem: (itemId, targetItem) => {
    const { game } = get()
    if (!game) return null

    // 只能在自己回合使用道具
    const currentPlayer = game.currentTurn === 'player' ? game.player : game.demon
    const opponent = game.currentTurn === 'player' ? game.demon : game.player

    if (currentPlayer.role !== game.currentTurn) {
      return null // 不是自己的回合
    }

    const item = currentPlayer.items.find((i) => i.id === itemId)
    if (!item || item.used) return null

    // 标记道具已使用
    const updatedItems = currentPlayer.items.map((i) =>
      i.id === itemId ? { ...i, used: true } : i
    )

    let updatedPlayer: PlayerState = { ...currentPlayer, items: updatedItems }
    let updatedOpponent: PlayerState = { ...opponent }
    let logMessage = ''
    let isPrivate = false
    let privateData: unknown = undefined

    switch (item.type) {
      case 'saw':
        updatedPlayer.sawActive = true
        logMessage = `${currentPlayer.name} 使用了锯子，下一发伤害翻倍！`
        break

      case 'handcuffs':
        updatedOpponent.isHandcuffed = true
        logMessage = `${currentPlayer.name} 给 ${opponent.name} 戴上了手铐！`
        break

      case 'cigarettes':
        // 闸刀状态下禁用回血道具
        if (currentPlayer.guillotineActive) {
          logMessage = `${currentPlayer.name} 尝试抽烟，但闸刀已切断除颤仪线路，无法恢复电量！`
        } else {
          updatedPlayer.health = Math.min(updatedPlayer.health + 1, updatedPlayer.maxHealth)
          logMessage = `${currentPlayer.name} 抽了根烟，恢复 1 点电量`
        }
        break

      case 'magnifier': {
        const currentShell = game.shells[game.currentShellIndex]
        if (currentShell) {
          // 考虑之前是否使用过逆转器
          let shellType = currentShell.type
          updatedPlayer.knownCurrentShell = shellType
          isPrivate = true
          privateData = { shellType }
          logMessage = `${currentPlayer.name} 使用放大镜查看了当前子弹`
        }
        break
      }

      case 'drink': {
        const ejectedShell = game.shells[game.currentShellIndex]
        if (ejectedShell) {
          // 饮料退弹，双方都能看到退出的是什么
          logMessage = `${currentPlayer.name} 喝了饮料，退掉了当前子弹（${ejectedShell.type === 'live' ? '实弹' : '空弹'}）`
          // 如果已知当前子弹，需要清除（因为子弹被退掉了）
          updatedPlayer.knownCurrentShell = null

          const newShellIndex = game.currentShellIndex + 1

          // 更新 shells 索引
          set({
            game: {
              ...game,
              currentShellIndex: newShellIndex,
            },
          })

          // 检查是否弹药用尽，需要重新装弹
          if (newShellIndex >= game.shells.length) {
            // 延迟触发重新装弹（在道具使用完成后）
            setTimeout(() => {
              const { game: latestGame } = get()
              if (latestGame && latestGame.phase !== 'game-over' && latestGame.phase !== 'round-end') {
                get().addLog('弹药用尽，重新装填...')
                set((state) => ({
                  game: state.game ? {
                    ...state.game,
                    round: state.game.round + 1,
                    subRound: state.game.subRound + 1,
                  } : null,
                }))
                get().startNewRound()
              }
            }, 500)
          }
        }
        break
      }

      case 'medicine': {
        // 闸刀状态下禁用回血道具（但仍有扣血风险）
        if (currentPlayer.guillotineActive) {
          const success = Math.random() < 0.4
          if (success) {
            logMessage = `${currentPlayer.name} 服用过期药物... 但闸刀已切断除颤仪线路，无法恢复电量！`
          } else {
            updatedPlayer.health = Math.max(0, updatedPlayer.health - 1)
            logMessage = `${currentPlayer.name} 服用过期药物... 不幸！损失 1 点电量`
            // 闸刀状态下扣血可能致死
            if (updatedPlayer.health <= 0) {
              logMessage += ` ⚡ 电量耗尽，${currentPlayer.name} 倒下了！`
            }
          }
        } else {
          const success = Math.random() < 0.4
          if (success) {
            updatedPlayer.health = Math.min(updatedPlayer.health + 2, updatedPlayer.maxHealth)
            logMessage = `${currentPlayer.name} 服用过期药物... 幸运！恢复 2 点电量`
          } else {
            updatedPlayer.health = Math.max(0, updatedPlayer.health - 1)
            logMessage = `${currentPlayer.name} 服用过期药物... 不幸！损失 1 点电量`
            // 扣血可能致死
            if (updatedPlayer.health <= 0) {
              logMessage += ` 电量耗尽，${currentPlayer.name} 倒下了！`
            }
          }
        }
        // 药物扣血后检查闸刀状态（在下方统一处理死亡）
        break
      }

      case 'inverter': {
        const shells = [...game.shells]
        let newLiveCount = 0
        let newBlankCount = 0

        // 转换所有剩余子弹（从 currentShellIndex 到末尾）
        for (let i = game.currentShellIndex; i < shells.length; i++) {
          const shell = shells[i]
          const newType = shell.type === 'live' ? 'blank' : 'live'
          shells[i] = { ...shell, type: newType }

          // 统计新的实弹/空弹数量
          if (newType === 'live') {
            newLiveCount++
          } else {
            newBlankCount++
          }
        }

        // 如果之前知道当前子弹类型，现在需要反转
        if (updatedPlayer.knownCurrentShell) {
          updatedPlayer.knownCurrentShell = updatedPlayer.knownCurrentShell === 'live' ? 'blank' : 'live'
        }

        // 清除电话提示（因为所有子弹类型都变了）
        updatedPlayer.phoneHint = null

        set({
          game: {
            ...game,
            shells,
            liveCount: newLiveCount,
            blankCount: newBlankCount,
          },
        })
        logMessage = `${currentPlayer.name} 使用逆转器，转换了所有剩余子弹！（${newLiveCount} 实弹 / ${newBlankCount} 空弹）`
        break
      }

      case 'phone': {
        const remainingShells = game.shells.slice(game.currentShellIndex)
        if (remainingShells.length > 1) {
          const randomIndex = Math.floor(Math.random() * remainingShells.length)
          const hintShell = remainingShells[randomIndex]
          const hint = `第 ${randomIndex + 1} 发是${hintShell.type === 'live' ? '实弹' : '空弹'}`
          updatedPlayer.phoneHint = hint
          isPrivate = true
          privateData = { hint, index: randomIndex, type: hintShell.type }
          logMessage = `${currentPlayer.name} 接听电话...`
        } else {
          logMessage = `${currentPlayer.name} 接听电话... 没有有用的信息`
        }
        break
      }

      case 'adrenaline': {
        if (!targetItem) {
          logMessage = `${currentPlayer.name} 注射了肾上腺素！（需要选择目标道具）`
        } else {
          // 找到对方的目标道具
          const targetItemObj = opponent.items.find(
            (i) => i.type === targetItem && !i.used
          )
          if (targetItemObj && targetItem !== 'adrenaline') {
            // 从对方道具栏移除该道具
            updatedOpponent = {
              ...opponent,
              items: opponent.items.filter((i) => i.id !== targetItemObj.id),
            }

            // 将道具添加到当前玩家的道具栏（如果未满8个）
            const stolenItemInfo = {
              saw: { name: '锯子', icon: '🪚' },
              handcuffs: { name: '手铐', icon: '⛓️' },
              cigarettes: { name: '香烟', icon: '🚬' },
              magnifier: { name: '放大镜', icon: '🔍' },
              drink: { name: '饮料', icon: '🍺' },
              medicine: { name: '过期药物', icon: '💊' },
              inverter: { name: '逆转器', icon: '🔄' },
              phone: { name: '电话', icon: '📞' },
            }[targetItem as Exclude<typeof targetItem, 'adrenaline'>]

            if (updatedPlayer.items.filter(i => !i.used).length < 8) {
              // 创建一个新的道具实例添加到玩家道具栏
              const stolenItem = {
                ...targetItemObj,
                id: `stolen-${targetItemObj.id}-${Date.now()}`, // 新ID避免冲突
                used: false,
              }
              updatedPlayer = {
                ...updatedPlayer,
                items: [...updatedPlayer.items, stolenItem],
              }
              logMessage = `${currentPlayer.name} 使用肾上腺素偷取了 ${opponent.name} 的${stolenItemInfo?.name}！`
            } else {
              // 道具栏已满，道具被丢弃
              logMessage = `${currentPlayer.name} 使用肾上腺素偷取了 ${opponent.name} 的${stolenItemInfo?.name}，但道具栏已满，道具被丢弃！`
            }
          } else if (targetItem === 'adrenaline') {
            logMessage = `${currentPlayer.name} 无法偷取肾上腺素！`
          } else {
            logMessage = `${currentPlayer.name} 使用肾上腺素失败，目标道具不存在`
          }
        }
        break
      }
    }

    // 创建使用记录
    const useRecord: ItemUseRecord = {
      itemType: item.type,
      result: logMessage,
      isPrivate,
      privateData,
    }

    // 更新状态
    const currentGameState = get().game
    if (currentGameState) {
      set({
        game: {
          ...currentGameState,
          [currentPlayer.role]: updatedPlayer,
          [opponent.role]: updatedOpponent,
          currentTurnItemUses: [...currentGameState.currentTurnItemUses, useRecord],
        },
      })
    }

    if (logMessage) {
      get().addLog(logMessage)
    }

    // 使用道具后检查闸刀状态（药物可能扣血触发）
    get().checkGuillotine()

    // === 药物致死检查 ===
    // 如果药物扣血导致当前玩家死亡，处理游戏结束逻辑
    if (item.type === 'medicine' && updatedPlayer.health <= 0) {
      const { game: latestGame } = get()
      if (latestGame) {
        const isLastMatch = latestGame.match === 3
        const winnerRole = currentPlayer.role === 'player' ? 'demon' : 'player'

        set({
          game: {
            ...latestGame,
            phase: isLastMatch ? 'game-over' : 'round-end',
            winner: isLastMatch ? winnerRole : null,
          },
        })

        if (isLastMatch) {
          get().addLog(`🏆 ${opponent.name} 最终获胜！`)
        } else {
          get().addLog(`本局结束，${opponent.name} 获胜！`)
          // 延迟后进入下一大局
          setTimeout(() => {
            get().advanceMatch()
          }, 2000)
        }
      }
    }

    return useRecord
  },

  nextTurn: () => {
    const { game } = get()
    if (!game || game.phase === 'game-over') return

    const nextPlayer = game.currentTurn === 'player' ? 'demon' : 'player'
    const nextPlayerState = game[nextPlayer]
    const currentPlayerState = game[game.currentTurn]

    // 检查下一个玩家是否被手铐束缚
    if (nextPlayerState.isHandcuffed) {
      get().addLog(`${nextPlayerState.name} 被手铐束缚，跳过回合`)

      // 清除手铐状态，但回合权回到当前玩家（即使用手铐的人继续行动）
      set({
        game: {
          ...game,
          [nextPlayer]: { ...nextPlayerState, isHandcuffed: false },
          // 当前玩家继续行动，不切换回合
          phase: game.currentTurn === 'player' ? 'player-turn' : 'demon-turn',
          currentTurnItemUses: [],
        },
      })
      return
    }

    // 正常切换回合
    // 1. 清除当前玩家的私有信息（下一回合不再有效）
    // 2. 清除本回合道具使用记录
    set({
      game: {
        ...game,
        currentTurn: nextPlayer,
        phase: nextPlayer === 'player' ? 'player-turn' : 'demon-turn',
        [game.currentTurn]: clearPlayerTurnState(currentPlayerState),
        currentTurnItemUses: [],
      },
    })
  },

  addLog: (message) => {
    set((state) => ({
      game: state.game
        ? {
            ...state.game,
            actionLog: [...state.game.actionLog, `[${new Date().toLocaleTimeString()}] ${message}`],
          }
        : null,
    }))
  },

  setPhase: (phase) => {
    set((state) => ({
      game: state.game ? { ...state.game, phase } : null,
    }))
  },

  resetGame: () => {
    set({ game: null })
  },

  advanceMatch: () => {
    const { game } = get()
    if (!game || game.match >= 3) return

    const nextMatch = (game.match + 1) as MatchNumber
    const matchConfig = MATCH_CONFIGS[nextMatch]

    get().addLog(`=== 第 ${nextMatch} 局开始 ===`)
    get().addLog(`生命值: ${matchConfig.initialHealth} | 每小局道具: ${matchConfig.itemsPerRound}`)
    if (matchConfig.hasGuillotine) {
      get().addLog(`⚠️ 闸刀机制已激活：生命值低于 ${GUILLOTINE_THRESHOLD} 时将被一击必杀！`)
    }

    // 重置双方状态，进入新的大局
    set({
      game: {
        ...game,
        phase: 'loading',
        match: nextMatch,
        subRound: 1,
        matchConfig,
        round: game.round + 1,
        shells: [],
        currentShellIndex: 0,
        liveCount: 0,
        blankCount: 0,
        player: createInitialPlayerState(
          'player',
          game.player.name,
          game.player.isAI,
          game.player.aiProvider,
          matchConfig.initialHealth
        ),
        demon: createInitialPlayerState(
          'demon',
          game.demon.name,
          true,
          game.demon.aiProvider,
          matchConfig.initialHealth
        ),
        currentTurn: 'player',
        winner: null,
        currentTurnItemUses: [],
        shootingTarget: null,
        lastShotResult: null,
      },
    })

    // 延迟后开始新回合
    setTimeout(() => {
      get().startNewRound()
    }, 1000)
  },

  checkGuillotine: () => {
    const { game } = get()
    if (!game || !game.matchConfig.hasGuillotine) return

    let updated = false
    let updatedPlayer = { ...game.player }
    let updatedDemon = { ...game.demon }

    // 检查玩家是否触发闸刀
    if (!game.player.guillotineActive && game.player.health < GUILLOTINE_THRESHOLD) {
      updatedPlayer.guillotineActive = true
      updated = true
      get().addLog(`⚡ ${game.player.name} 生命值过低，闸刀切断除颤仪线路！`)
    }

    // 检查恶魔是否触发闸刀
    if (!game.demon.guillotineActive && game.demon.health < GUILLOTINE_THRESHOLD) {
      updatedDemon.guillotineActive = true
      updated = true
      get().addLog(`⚡ ${game.demon.name} 生命值过低，闸刀切断除颤仪线路！`)
    }

    if (updated) {
      set({
        game: {
          ...game,
          player: updatedPlayer,
          demon: updatedDemon,
        },
      })
    }
  },

  getCurrentPlayerPrivateInfo: () => {
    const { game } = get()
    if (!game) return null

    const currentPlayer = game.currentTurn === 'player' ? game.player : game.demon
    return {
      knownShell: currentPlayer.knownCurrentShell,
      phoneHint: currentPlayer.phoneHint,
    }
  },

  // === 分数与无尽模式方法 ===

  calculateMatchScore: () => {
    const { game } = get()
    if (!game) return 0

    // 只有 Human vs AI 模式才计算分数
    if (game.player.isAI) return 0

    // 基础分
    const baseScore = game.isEndlessMode
      ? ENDLESS_BASE_SCORE
      : MATCH_BASE_SCORES[game.match]

    // 血量奖励（玩家剩余血量）
    const hpBonus = game.player.health * HP_BONUS

    // 道具奖励（玩家未使用道具数）
    const unusedItems = game.player.items.filter(item => !item.used).length
    const itemBonus = unusedItems * ITEM_BONUS

    return baseScore + hpBonus + itemBonus
  },

  settleMatchScore: () => {
    const { game } = get()
    if (!game || game.player.isAI) return

    const matchScore = get().calculateMatchScore()
    const newScore = game.score + matchScore

    set({
      game: {
        ...game,
        score: newScore,
      },
    })

    get().addLog(`📊 本回合得分：${matchScore} 分（累计：${newScore} 分）`)
  },

  startEndlessMode: () => {
    const { game } = get()
    if (!game) return

    // 使用第三回合配置
    const matchConfig = MATCH_CONFIGS[3]

    get().addLog(`=== 无尽模式 第 ${game.endlessRound + 1} 轮开始 ===`)
    get().addLog(`当前分数：${game.score} 分（胜利后翻倍！）`)
    get().addLog(`⚠️ 警告：失败将清空所有分数！`)

    // 重置双方状态，进入无尽模式
    set({
      game: {
        ...game,
        phase: 'loading',
        isEndlessMode: true,
        endlessRound: game.endlessRound + 1,
        match: 3, // 无尽模式使用第三回合配置
        subRound: 1,
        matchConfig,
        round: game.round + 1,
        shells: [],
        currentShellIndex: 0,
        liveCount: 0,
        blankCount: 0,
        player: createInitialPlayerState(
          'player',
          game.player.name,
          game.player.isAI,
          game.player.aiProvider,
          matchConfig.initialHealth
        ),
        demon: createInitialPlayerState(
          'demon',
          game.demon.name,
          true,
          game.demon.aiProvider,
          matchConfig.initialHealth
        ),
        currentTurn: 'player',
        winner: null,
        currentTurnItemUses: [],
        shootingTarget: null,
        lastShotResult: null,
      },
    })

    // 延迟后开始新回合
    setTimeout(() => {
      get().startNewRound()
    }, 1000)
  },

  declineEndlessMode: () => {
    const { game } = get()
    if (!game) return

    get().addLog(`🏁 游戏结束！最终分数：${game.score} 分`)

    set({
      game: {
        ...game,
        phase: 'game-over',
        winner: 'player',
      },
    })
  },
}))
