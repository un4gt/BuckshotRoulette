import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import {
  useGameSettingsStore,
  type AIProvider,
  type GameMode,
} from '@/app/stores/game-settings'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'grok', label: 'xAI Grok' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
]

const GAME_MODES: { value: GameMode; label: string }[] = [
  { value: 'human-vs-ai', label: '真人 vs AI' },
  { value: 'ai-vs-ai', label: 'AI vs AI' },
]

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, setGameMode, setPlayerAI, setDemonAI, setPlayerName } =
    useGameSettingsStore()
  const [activeTab, setActiveTab] = useState<'general' | 'demon' | 'player'>('general')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="crt-glow text-xl text-primary">
            系统设置
          </DialogTitle>
          <DialogDescription>配置游戏模式和 AI 参数</DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === 'general'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            常规
          </button>
          <button
            onClick={() => setActiveTab('demon')}
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === 'demon'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            恶魔 AI
          </button>
          {settings.gameMode === 'ai-vs-ai' && (
            <button
              onClick={() => setActiveTab('player')}
              className={`px-4 py-2 text-sm transition-colors ${
                activeTab === 'player'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              玩家 AI
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px] py-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <Select
                id="gameMode"
                label="游戏模式"
                value={settings.gameMode}
                onChange={(e) => setGameMode(e.target.value as GameMode)}
                options={GAME_MODES}
              />
              {settings.gameMode === 'human-vs-ai' && (
                <Input
                  id="playerName"
                  label="玩家名称"
                  placeholder="输入你的名字..."
                  value={settings.playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              )}
            </div>
          )}

          {activeTab === 'demon' && (
            <AIConfigForm
              title="恶魔 AI 配置"
              config={settings.demonAI}
              onChange={setDemonAI}
            />
          )}

          {activeTab === 'player' && settings.gameMode === 'ai-vs-ai' && (
            <AIConfigForm
              title="玩家 AI 配置"
              config={settings.playerAI}
              onChange={setPlayerAI}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface AIConfigFormProps {
  title: string
  config: {
    provider: AIProvider
    apiKey: string
    baseUrl?: string
    model: string
  }
  onChange: (config: Partial<AIConfigFormProps['config']>) => void
}

function AIConfigForm({ title, config, onChange }: AIConfigFormProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const defaultModel = getDefaultModel(config.provider)

  // 当切换服务商时，自动设置默认模型
  const handleProviderChange = (provider: AIProvider) => {
    onChange({
      provider,
      model: getDefaultModel(provider),
      // 清空 baseUrl（除非是 openai-compatible）
      baseUrl: provider === 'openai-compatible' ? config.baseUrl : '',
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>

      <Select
        id="provider"
        label="AI 服务商"
        value={config.provider}
        onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
        options={AI_PROVIDERS}
      />

      <div className="relative">
        <Input
          id="apiKey"
          label="API Key"
          type={showApiKey ? 'text' : 'password'}
          placeholder="输入 API Key..."
          value={config.apiKey}
          onChange={(e) => onChange({ apiKey: e.target.value })}
        />
        <button
          type="button"
          onClick={() => setShowApiKey(!showApiKey)}
          className="absolute right-3 top-8 text-xs text-muted-foreground hover:text-foreground"
        >
          {showApiKey ? '隐藏' : '显示'}
        </button>
      </div>

      {config.provider === 'openai-compatible' && (
        <Input
          id="baseUrl"
          label="API 端点 (Base URL)"
          placeholder="https://api.example.com/v1"
          value={config.baseUrl || ''}
          onChange={(e) => onChange({ baseUrl: e.target.value })}
        />
      )}

      <Input
        id="model"
        label="模型名称"
        placeholder={defaultModel}
        value={config.model}
        onChange={(e) => onChange({ model: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        推荐模型: {defaultModel}
      </p>

      {/* 配置状态提示 */}
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              config.apiKey ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-muted-foreground">
            {config.apiKey ? 'API Key 已配置' : 'API Key 未配置'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              config.model ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-muted-foreground">
            {config.model ? `模型: ${config.model}` : '模型未配置'}
          </span>
        </div>
        {config.provider === 'openai-compatible' && (
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                config.baseUrl ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            <span className="text-muted-foreground">
              {config.baseUrl ? `端点: ${config.baseUrl}` : 'API 端点未配置'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case 'gemini':
      return 'gemini-2.0-flash'
    case 'deepseek':
      return 'deepseek-chat'
    case 'grok':
      return 'grok-3-latest'
    case 'openai':
      return 'gpt-4o'
    case 'openrouter':
      return 'openai/gpt-4o'
    case 'openai-compatible':
      return ''
  }
}
