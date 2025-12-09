import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { UserStats } from './components/user-stats'
import { ModelConfig } from './components/model-config'

export const DashboardPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen p-8">
      {/* 顶部导航 */}
      <div className="mb-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-muted-foreground"
        >
          ← 返回游戏
        </Button>
        <h1 className="text-2xl font-bold">管理员仪表盘</h1>
        <div className="w-24" /> {/* 占位保持居中 */}
      </div>

      {/* 统计卡片 */}
      <div className="mb-8">
        <UserStats />
      </div>

      {/* 模型配置 */}
      <div>
        <ModelConfig />
      </div>
    </div>
  )
}
