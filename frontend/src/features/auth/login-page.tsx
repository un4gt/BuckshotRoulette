import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { useAuthStore } from '@/app/stores/auth-store'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuthStore()

  // 已登录用户自动跳转
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleLinuxDoLogin = () => {
    // 重定向到后端 OAuth 端点
    window.location.href = '/api/v1/auth/login/linux_do'
  }

  const handleGuestContinue = () => {
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="crt-glow text-4xl font-bold tracking-wider text-primary">
        BUCKSHOT ROULETTE
      </h1>

      <div className="flex flex-col items-center gap-2">
        <p className="text-muted-foreground">登录以使用预配置的 AI 模型</p>
        <p className="text-xs text-muted-foreground">
          或以访客身份继续，使用自己的 API Key
        </p>
      </div>

      <div className="flex flex-col gap-4 w-64">
        <Button
          variant="default"
          onClick={handleLinuxDoLogin}
          className="w-full"
        >
          使用 Linux.do 登录
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">或</span>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={handleGuestContinue}
          className="w-full text-muted-foreground"
        >
          以访客身份继续
        </Button>
      </div>
    </div>
  )
}
