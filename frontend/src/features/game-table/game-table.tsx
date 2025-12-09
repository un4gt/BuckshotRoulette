import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { useGameStore } from '@/app/stores/game-store'
import { useLLMLogStore } from '@/app/stores/llm-log-store'
import { PlayerAvatar } from '@/features/player-view/player-avatar'
import { AmmoDisplay } from './ammo-display'
import { ItemInventory } from './item-inventory'
import { Shotgun } from './shotgun'
import { Button } from '@/shared/ui/button'
import { AdrenalineModal } from './components/adrenaline-modal'
import { LLMLogPanel } from './components/llm-log-panel'
import { EndlessPromptModal } from './components/endless-prompt-modal'
import { useAITurn } from './hooks/use-ai-turn'
import type { ItemType } from '@/entities/items'

interface GameTableProps {
  onExit: () => void
}

export function GameTable({ onExit }: GameTableProps) {
  const { game, shoot, useItem, resetGame, calculateMatchScore } = useGameStore()
  const { clearLogs } = useLLMLogStore()
  const logRef = useRef<HTMLDivElement>(null)

  // AI 回合处理 - 获取双方 AI 状态
  const { playerAiState, demonAiState, isAIvsAI } = useAITurn()

  // 肾上腺素选择状态：存储待使用的肾上腺素道具ID
  const [pendingAdrenalineId, setPendingAdrenalineId] = useState<string | null>(null)

  // 自动滚动日志
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [game?.actionLog])

  if (!game) return null

  const isPlayerTurn = game.currentTurn === 'player' && game.phase === 'player-turn'
  const isDemonTurn = game.currentTurn === 'demon' && game.phase === 'demon-turn'
  const isGameOver = game.phase === 'game-over'
  const isShooting = game.phase === 'shooting'
  const isEndlessPrompt = game.phase === 'endless-prompt'

  // 分数相关（仅 Human vs AI 模式）
  const showScore = !game.player.isAI
  const currentMatchScore = showScore ? calculateMatchScore() : 0

  // 计算枪口指向：根据当前回合和射击目标
  const getAimTarget = (): 'demon' | 'player' | null => {
    if (!game.shootingTarget) return null
    // 从玩家视角：opponent = demon(上方), self = player(下方)
    // 从恶魔视角：opponent = player(下方), self = demon(上方)
    if (game.currentTurn === 'player') {
      return game.shootingTarget === 'opponent' ? 'demon' : 'player'
    } else {
      return game.shootingTarget === 'opponent' ? 'player' : 'demon'
    }
  }

  const handleExit = () => {
    resetGame()
    clearLogs()
    onExit()
  }

  // 处理道具使用
  const handleUseItem = (itemId: string) => {
    const item = game.player.items.find((i) => i.id === itemId)
    if (!item) return

    // 如果是肾上腺素，先检查对方是否有可偷的道具
    if (item.type === 'adrenaline') {
      const stealableItems = game.demon.items.filter(
        (i) => !i.used && i.type !== 'adrenaline'
      )
      if (stealableItems.length === 0) {
        // 对方没有可偷的道具，直接提示
        useItem(itemId)
        return
      }
      // 显示选择弹窗
      setPendingAdrenalineId(itemId)
      return
    }

    // 其他道具正常使用
    useItem(itemId)
  }

  // 肾上腺素选择目标后
  const handleAdrenalineSelect = (targetItemType: ItemType) => {
    if (pendingAdrenalineId) {
      useItem(pendingAdrenalineId, targetItemType)
      setPendingAdrenalineId(null)
    }
  }

  // 取消肾上腺素选择
  const handleAdrenalineCancel = () => {
    setPendingAdrenalineId(null)
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 px-4 py-2">
        <div className="flex items-center gap-4">
          {/* 局数显示 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {game.isEndlessMode ? `无尽模式 第 ${game.endlessRound} 轮` : `第 ${game.match} 局`}
            </span>
            <span className="text-xs text-muted-foreground">
              (小局 {game.subRound})
            </span>
            {game.matchConfig.hasGuillotine && (
              <span className="rounded bg-red-900/50 px-1.5 py-0.5 text-xs text-red-400">
                ⚡ 闸刀
              </span>
            )}
          </div>
          <span
            className={cn(
              'rounded px-2 py-0.5 text-xs',
              isPlayerTurn && 'bg-primary/20 text-primary',
              isDemonTurn && 'bg-destructive/20 text-destructive'
            )}
          >
            {isGameOver
              ? '游戏结束'
              : isEndlessPrompt
              ? '选择中...'
              : isShooting
              ? '开枪中...'
              : isPlayerTurn
              ? (isAIvsAI ? '玩家回合' : '你的回合')
              : '恶魔回合'}
          </span>
        </div>

        {/* 分数显示（仅 Human vs AI 模式） */}
        {showScore && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded bg-background/50 px-3 py-1">
              <span className="text-xs text-muted-foreground">累计</span>
              <span className="font-mono text-sm font-medium text-primary">
                {game.score.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded bg-background/50 px-3 py-1">
              <span className="text-xs text-muted-foreground">本轮</span>
              <span className="font-mono text-sm text-muted-foreground">
                +{currentMatchScore.toLocaleString()}
              </span>
            </div>
            {game.isEndlessMode && (
              <div className="rounded bg-yellow-900/50 px-2 py-0.5 text-xs text-yellow-400">
                ×2 翻倍
              </div>
            )}
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={handleExit}>
          退出
        </Button>
      </div>

      {/* 主游戏区域 - 三栏布局，高度固定 */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* 左侧 LLM 信息流面板 - 固定宽度，独立滚动 */}
        <div className="flex h-full w-80 flex-shrink-0 flex-col overflow-hidden border-r border-border">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
            <LLMLogPanel />
          </div>
        </div>

        {/* 中央游戏区域 - 禁止滚动 */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* 恶魔区域（顶部） */}
          <div className="flex items-start justify-center pt-6">
            <div className="relative flex flex-col items-center gap-3">
              <PlayerAvatar
                name={game.demon.name}
                isAI={game.demon.isAI}
                aiProvider={game.demon.aiProvider}
                isActive={isDemonTurn}
                health={game.demon.health}
                maxHealth={game.demon.maxHealth}
                position="left"
                isHandcuffed={game.demon.isHandcuffed}
                guillotineActive={game.demon.guillotineActive}
              />
              {/* 恶魔道具 */}
              <ItemInventory
                items={game.demon.items}
                disabled={true}
                position="bottom"
              />
              {/* 恶魔 AI 思考气泡 - 显示在道具栏下方 */}
              {game.demon.isAI && (demonAiState.isThinking || demonAiState.dialogue || demonAiState.error) && (
                <div className="mt-1 flex flex-col items-center">
                  {demonAiState.isThinking && (
                    <div className="max-w-xs rounded-lg border border-border bg-card/90 px-4 py-2 text-xs shadow-lg backdrop-blur">
                      {demonAiState.thought || '思考中...'}
                    </div>
                  )}
                  {demonAiState.dialogue && !demonAiState.isThinking && (
                    <div className="max-w-xs rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-xs text-destructive shadow-lg">
                      💬 {demonAiState.dialogue}
                    </div>
                  )}
                  {demonAiState.error && (
                    <div className="max-w-xs rounded-lg border border-destructive bg-destructive/10 px-4 py-2 text-xs text-destructive shadow-lg">
                      ⚠️ {demonAiState.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 中央桌面区域 - 霰弹枪 */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
            {/* 电话提示 - 只显示当前视角玩家的私有信息 */}
            {game.player.phoneHint && (
              <div className="rounded border border-yellow-600 bg-yellow-900/30 px-3 py-1.5 text-sm text-yellow-300">
                📞 {game.player.phoneHint}
              </div>
            )}

            {/* 霰弹枪 */}
            <Shotgun
              isSawedOff={game.player.sawActive || game.demon.sawActive}
              aimTarget={getAimTarget()}
              isShooting={isShooting}
              shotResult={game.lastShotResult}
              onShoot={shoot}
              disabled={!isPlayerTurn || game.player.isAI}
              compact={isAIvsAI}
            />
          </div>

          {/* 玩家区域（底部） */}
          <div className="flex items-end justify-center pb-6">
            <div className="relative flex flex-col items-center gap-3">
              {/* 玩家道具 */}
              <ItemInventory
                items={game.player.items}
                onUseItem={handleUseItem}
                disabled={!isPlayerTurn || game.player.isAI}
                position="bottom"
              />
              <PlayerAvatar
                name={game.player.name}
                isAI={game.player.isAI}
                aiProvider={game.player.aiProvider}
                isActive={isPlayerTurn}
                health={game.player.health}
                maxHealth={game.player.maxHealth}
                position="bottom"
                isHandcuffed={game.player.isHandcuffed}
                guillotineActive={game.player.guillotineActive}
              />

              {/* 玩家 AI 思考气泡（AI vs AI 模式） */}
              {game.player.isAI && (playerAiState.isThinking || playerAiState.dialogue || playerAiState.error) && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full">
                  {playerAiState.isThinking && (
                    <div className="mt-2 max-w-xs rounded-lg border border-border bg-card/90 px-4 py-2 text-xs shadow-lg backdrop-blur">
                      {playerAiState.thought || '思考中...'}
                    </div>
                  )}
                  {playerAiState.dialogue && !playerAiState.isThinking && (
                    <div className="mt-2 max-w-xs rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-xs text-primary shadow-lg">
                      💬 {playerAiState.dialogue}
                    </div>
                  )}
                  {playerAiState.error && (
                    <div className="mt-2 max-w-xs rounded-lg border border-destructive bg-destructive/10 px-4 py-2 text-xs text-destructive shadow-lg">
                      ⚠️ {playerAiState.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧面板 - 弹药和日志，固定宽度，独立滚动 */}
        <div className="flex h-full w-72 flex-shrink-0 flex-col overflow-hidden border-l border-border">
          {/* 弹药显示 */}
          <div className="flex-shrink-0 border-b border-border p-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">弹药</div>
            <AmmoDisplay
              shells={game.shells}
              currentIndex={game.currentShellIndex}
              knownCurrentShellType={game.player.knownCurrentShell}
              className="items-start"
            />
          </div>

          {/* 行动日志 - 独立滚动区域 */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-shrink-0 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
              行动日志
            </div>
            <div
              ref={logRef}
              className="min-h-0 flex-1 overflow-y-auto p-3 text-xs leading-relaxed"
            >
              {game.actionLog.map((log, index) => (
                <div
                  key={index}
                  className={cn(
                    'mb-1 text-muted-foreground',
                    log.includes('实弹') && 'text-red-400',
                    log.includes('空弹') && 'text-gray-400',
                    log.includes('获胜') && 'text-yellow-400 font-medium'
                  )}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 游戏结束弹窗 */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-6 rounded-lg border border-border bg-card p-8">
            <h2 className="crt-glow text-3xl font-bold text-primary">
              {game.winner === 'player' ? '你赢了！' : '你输了...'}
            </h2>
            <p className="text-muted-foreground">
              {game.winner === 'player'
                ? '恶魔倒下了。'
                : '除颤仪无法再救你了。'}
            </p>

            {/* 分数显示（仅 Human vs AI 模式） */}
            {showScore && (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background/50 px-6 py-4">
                <span className="text-sm text-muted-foreground">最终分数</span>
                <span className="text-3xl font-bold text-primary">
                  {game.score.toLocaleString()}
                </span>
                {game.isEndlessMode && game.winner !== 'player' && (
                  <span className="text-xs text-red-400">
                    (无尽模式失败，分数已清零)
                  </span>
                )}
                {game.endlessRound > 0 && game.winner === 'player' && (
                  <span className="text-xs text-muted-foreground">
                    无尽模式完成 {game.endlessRound} 轮
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="default" onClick={handleExit}>
                返回主菜单
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 无尽模式选择弹窗 */}
      {isEndlessPrompt && <EndlessPromptModal />}

      {/* 肾上腺素选择弹窗 */}
      {pendingAdrenalineId && (
        <AdrenalineModal
          opponentItems={game.demon.items}
          opponentName={game.demon.name}
          onSelectItem={handleAdrenalineSelect}
          onCancel={handleAdrenalineCancel}
        />
      )}
    </div>
  )
}
