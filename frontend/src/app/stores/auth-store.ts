import { create } from 'zustand'
import { api } from '@/shared/api/client'

export interface User {
  id: string
  name: string
  email?: string
  avatar?: string
  role: 'user' | 'admin'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  fetchCurrentUser: () => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  fetchCurrentUser: async () => {
    try {
      set({ isLoading: true })
      const user = await api.get<User>('/auth/me')
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      // 未登录或 token 无效
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // 忽略登出错误
    } finally {
      set({ user: null, isAuthenticated: false })
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
  },
}))
