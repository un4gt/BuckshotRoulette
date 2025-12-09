import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { useAuthStore } from '@/app/stores/auth-store'
import { useGameSettingsStore } from '@/app/stores'
import { api } from '@/shared/api/client'
import type { PresetModel } from '@/app/stores/game-settings'

const App = () => {
  const { fetchCurrentUser } = useAuthStore()
  const { setAvailablePresetModels } = useGameSettingsStore()

  // 应用启动时获取用户信息和预配置模型
  useEffect(() => {
    // 获取当前用户
    fetchCurrentUser()

    // 获取可用的预配置模型
    const fetchPresetModels = async () => {
      try {
        const models = await api.get<PresetModel[]>('/game/models')
        setAvailablePresetModels(models)
      } catch {
        // 忽略错误，可能是后端未实现或用户未登录
        setAvailablePresetModels([])
      }
    }
    fetchPresetModels()
  }, [fetchCurrentUser, setAvailablePresetModels])

  return <RouterProvider router={router} />
}

export default App
