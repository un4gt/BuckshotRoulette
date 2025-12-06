import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { SettingsDialog } from '@/features/settings'
import { WaiverDialog } from '@/features/signature'
import { GameTable } from '@/features/game-table'
import { useGameSettingsStore, useGameStore } from '@/app/stores'

type AppScreen = 'menu' | 'game'

const App = () => {
  const [screen, setScreen] = useState<AppScreen>('menu')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [waiverOpen, setWaiverOpen] = useState(false)
  const { settings } = useGameSettingsStore()
  const { game, initGame } = useGameStore()

  const handleStartGame = () => {
    // 真人 vs AI 模式需要先签署免责声明
    if (settings.gameMode === 'human-vs-ai') {
      setWaiverOpen(true)
    } else {
      // AI vs AI 模式直接开始
      startGame()
    }
  }

  const startGame = () => {
    initGame({
      playerName: settings.playerName,
      isPlayerAI: settings.gameMode === 'ai-vs-ai',
      playerAIProvider: settings.gameMode === 'ai-vs-ai' ? settings.playerAI.provider : undefined,
      playerAIModel: settings.gameMode === 'ai-vs-ai' ? settings.playerAI.model : undefined,
      demonAIProvider: settings.demonAI.provider,
      demonAIModel: settings.demonAI.model,
    })
    setScreen('game')
  }

  const handleExitGame = () => {
    setScreen('menu')
  }

  // 游戏界面
  if (screen === 'game' && game) {
    return (
      <div className="dark min-h-screen bg-background text-foreground">
        <div className="crt-overlay" />
        <div className="noise-overlay" />
        <div className="vignette" />
        <div className="relative z-10">
          <GameTable onExit={handleExitGame} />
        </div>
      </div>
    )
  }

  // 主菜单
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* CRT 效果层 */}
      <div className="crt-overlay" />
      <div className="noise-overlay" />
      <div className="vignette" />

      {/* 主内容 */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <h1 className="crt-glow text-4xl font-bold tracking-wider text-primary">
          BUCKSHOT ROULETTE
        </h1>

        <p className="text-muted-foreground">签下免责声明。</p>

        {/* 游戏模式显示 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">当前模式：</span>
          <span className="text-foreground">
            {settings.gameMode === 'human-vs-ai' ? '真人 vs AI' : 'AI vs AI'}
          </span>
          {settings.gameMode === 'human-vs-ai' && settings.playerName && (
            <span className="text-muted-foreground">
              | 玩家: {settings.playerName}
            </span>
          )}
        </div>

        {/* API 配置状态 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`h-2 w-2 rounded-full ${
              settings.demonAI.apiKey ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span>
            恶魔 AI:{' '}
            {settings.demonAI.apiKey
              ? (settings.demonAI.model || settings.demonAI.provider.toUpperCase())
              : '未配置'}
          </span>
          {settings.gameMode === 'ai-vs-ai' && (
            <>
              <span className="mx-2">|</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  settings.playerAI.apiKey ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span>
                玩家 AI:{' '}
                {settings.playerAI.apiKey
                  ? (settings.playerAI.model || settings.playerAI.provider.toUpperCase())
                  : '未配置'}
              </span>
            </>
          )}
        </div>

        {/* 按钮区 */}
        <div className="flex gap-4">
          <Button
            variant="default"
            onClick={handleStartGame}
            disabled={!settings.demonAI.apiKey}
          >
            开始游戏
          </Button>
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            设置
          </Button>
        </div>

        {!settings.demonAI.apiKey && (
          <p className="text-xs text-destructive">
            请先在设置中配置恶魔 AI 的 API Key
          </p>
        )}
      </div>

      {/* 设置弹窗 */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* 免责声明弹窗 */}
      <WaiverDialog
        open={waiverOpen}
        onOpenChange={setWaiverOpen}
        onConfirm={startGame}
      />
    </div>
  )
}

export default App
