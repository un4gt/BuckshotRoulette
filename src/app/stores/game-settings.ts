import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type GameMode = 'human-vs-ai' | 'ai-vs-ai'

export type AIProvider =
  | 'gemini'
  | 'deepseek'
  | 'grok'
  | 'openai'
  | 'openrouter'
  | 'openai-compatible'

// 观战速度倍率
export type SpectateSpeed = 0.5 | 1 | 2 | 3

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string // 用于 OpenAI Compatible 的自定义端点
  model: string    // 必选
}

// 观战控制设置
export interface SpectateSettings {
  isPaused: boolean       // 是否暂停
  speed: SpectateSpeed    // 速度倍率
  stepMode: boolean       // 单步模式
}

export interface GameSettings {
  gameMode: GameMode
  playerAI: AIConfig      // AI vs AI 模式下的玩家 AI
  demonAI: AIConfig       // 恶魔 AI 配置
  playerName: string
  signatureDataUrl: string | null  // 玩家签名
  spectate: SpectateSettings       // 观战控制
}

interface GameSettingsStore {
  settings: GameSettings

  // Actions
  setGameMode: (mode: GameMode) => void
  setPlayerAI: (config: Partial<AIConfig>) => void
  setDemonAI: (config: Partial<AIConfig>) => void
  setPlayerName: (name: string) => void
  setSignature: (dataUrl: string | null) => void
  // 观战控制
  setSpectatePaused: (paused: boolean) => void
  setSpectateSpeed: (speed: SpectateSpeed) => void
  setStepMode: (enabled: boolean) => void
  nextStep: () => void  // 单步模式下触发下一步
  resetSettings: () => void
}

const defaultAIConfig: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  baseUrl: '',
  model: 'gemini-2.0-flash',
}

const defaultSpectateSettings: SpectateSettings = {
  isPaused: false,
  speed: 1,
  stepMode: false,
}

const defaultSettings: GameSettings = {
  gameMode: 'human-vs-ai',
  playerAI: { ...defaultAIConfig },
  demonAI: { ...defaultAIConfig },
  playerName: '',
  signatureDataUrl: null,
  spectate: { ...defaultSpectateSettings },
}

export const useGameSettingsStore = create<GameSettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      setGameMode: (mode) =>
        set((state) => ({
          settings: { ...state.settings, gameMode: mode },
        })),

      setPlayerAI: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            playerAI: { ...state.settings.playerAI, ...config },
          },
        })),

      setDemonAI: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            demonAI: { ...state.settings.demonAI, ...config },
          },
        })),

      setPlayerName: (name) =>
        set((state) => ({
          settings: { ...state.settings, playerName: name },
        })),

      setSignature: (dataUrl) =>
        set((state) => ({
          settings: { ...state.settings, signatureDataUrl: dataUrl },
        })),

      // 观战控制
      setSpectatePaused: (paused) =>
        set((state) => ({
          settings: {
            ...state.settings,
            spectate: { ...state.settings.spectate, isPaused: paused },
          },
        })),

      setSpectateSpeed: (speed) =>
        set((state) => ({
          settings: {
            ...state.settings,
            spectate: { ...state.settings.spectate, speed },
          },
        })),

      setStepMode: (enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            spectate: {
              ...state.settings.spectate,
              stepMode: enabled,
              isPaused: enabled, // 开启单步模式时自动暂停
            },
          },
        })),

      nextStep: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            spectate: { ...state.settings.spectate, isPaused: false },
          },
        })),

      resetSettings: () =>
        set({ settings: defaultSettings }),
    }),
    {
      name: 'buckshot-roulette-settings',
      partialize: (state) => ({
        settings: {
          ...state.settings,
          // 不持久化签名和观战状态，每次游戏需要重新设置
          signatureDataUrl: null,
          spectate: defaultSpectateSettings,
        },
      }),
      // 合并持久化数据与默认值，防止旧版本数据缺少字段导致 undefined 错误
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { settings?: Partial<GameSettings> }
        return {
          ...currentState,
          settings: {
            ...defaultSettings,
            ...persisted?.settings,
            // 确保嵌套对象也正确合并
            playerAI: { ...defaultAIConfig, ...persisted?.settings?.playerAI },
            demonAI: { ...defaultAIConfig, ...persisted?.settings?.demonAI },
            spectate: { ...defaultSpectateSettings, ...persisted?.settings?.spectate },
          },
        }
      },
    }
  )
)
