/**
 * LLM 日志存储
 * 记录与 AI 的交互信息流
 */

import { create } from 'zustand'

export type LLMLogType =
  | 'request'     // 发送请求
  | 'response'    // 收到响应
  | 'thought'     // AI 思考
  | 'dialogue'    // AI 对话
  | 'action'      // AI 决策
  | 'error'       // 错误
  | 'system'      // 系统信息

export interface LLMLogEntry {
  id: string
  timestamp: Date
  type: LLMLogType
  role: 'player' | 'demon'
  title: string
  content: string
  /** 可展开的详细内容（如完整 prompt） */
  details?: string
}

interface LLMLogStore {
  logs: LLMLogEntry[]

  // Actions
  addLog: (entry: Omit<LLMLogEntry, 'id' | 'timestamp'>) => void
  clearLogs: () => void
}

let logIdCounter = 0

export const useLLMLogStore = create<LLMLogStore>((set) => ({
  logs: [],

  addLog: (entry) => {
    const newEntry: LLMLogEntry = {
      ...entry,
      id: `llm-log-${++logIdCounter}`,
      timestamp: new Date(),
    }

    set((state) => ({
      logs: [...state.logs, newEntry],
    }))
  },

  clearLogs: () => {
    set({ logs: [] })
  },
}))
