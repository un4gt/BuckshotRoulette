import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { SettingsDialog } from '@/features/settings'
import { WaiverDialog } from '@/features/signature'
import { useGameSettingsStore, useGameStore } from '@/app/stores'
import { useAuthStore } from '@/app/stores/auth-store'

export const LobbyPage = () => {
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [waiverOpen, setWaiverOpen] = useState(false)
  const { settings } = useGameSettingsStore()
  const { initGame } = useGameStore()
  const { user, isAuthenticated } = useAuthStore()

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
    navigate('/game')
  }

  // 检查是否可以开始游戏
  // 如果使用预配置模型，需要登录；如果使用自定义 key，需要有 apiKey
  const canStartGame = () => {
    const demonReady = settings.demonAISource === 'preset'
      ? (isAuthenticated && settings.demonPresetModelId)
      : settings.demonAI.apiKey

    if (settings.gameMode === 'ai-vs-ai') {
      const playerReady = settings.playerAISource === 'preset'
        ? (isAuthenticated && settings.playerPresetModelId)
        : settings.playerAI.apiKey
      return demonReady && playerReady
    }

    return demonReady
  }

  const getConfigStatus = (source: 'custom' | 'preset', apiKey: string, presetModelId: string | null, model: string, provider: string) => {
    if (source === 'preset') {
      if (!isAuthenticated) return { ready: false, text: '需要登录' }
      if (!presetModelId) return { ready: false, text: '未选择模型' }
      // 从可用模型中查找名称
      const presetModel = settings.availablePresetModels.find(m => m.id === presetModelId)
      return { ready: true, text: presetModel?.name || presetModelId }
    } else {
      if (!apiKey) return { ready: false, text: '未配置' }
      return { ready: true, text: model || provider.toUpperCase() }
    }
  }

  const demonStatus = getConfigStatus(
    settings.demonAISource,
    settings.demonAI.apiKey,
    settings.demonPresetModelId,
    settings.demonAI.model,
    settings.demonAI.provider
  )

  const playerStatus = getConfigStatus(
    settings.playerAISource,
    settings.playerAI.apiKey,
    settings.playerPresetModelId,
    settings.playerAI.model,
    settings.playerAI.provider
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="crt-glow text-4xl font-bold tracking-wider text-primary">
        BUCKSHOT ROULETTE
      </h1>

      <p className="text-muted-foreground">签下免责声明。</p>

      {/* 用户状态 */}
      <div className="flex items-center gap-2 text-sm">
        {isAuthenticated ? (
          <>
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-foreground">
              已登录: {user?.name}
            </span>
            {user?.role === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="ml-2 h-6 px-2 text-xs"
              >
                管理后台
              </Button>
            )}
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">访客模式</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/login')}
              className="h-6 px-2 text-xs"
            >
              登录解锁更多模型
            </Button>
          </>
        )}
      </div>

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
            demonStatus.ready ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span>恶魔 AI: {demonStatus.text}</span>
        {settings.gameMode === 'ai-vs-ai' && (
          <>
            <span className="mx-2">|</span>
            <span
              className={`h-2 w-2 rounded-full ${
                playerStatus.ready ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span>玩家 AI: {playerStatus.text}</span>
          </>
        )}
      </div>

      {/* 按钮区 */}
      <div className="flex gap-4">
        <Button
          variant="default"
          onClick={handleStartGame}
          disabled={!canStartGame()}
        >
          开始游戏
        </Button>
        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
          设置
        </Button>
      </div>

      {!canStartGame() && (
        <p className="text-xs text-destructive">
          {settings.demonAISource === 'preset' && !isAuthenticated
            ? '使用预配置模型需要先登录'
            : '请先在设置中配置 AI'}
        </p>
      )}

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
