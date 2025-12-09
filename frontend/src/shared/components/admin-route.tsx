import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/app/stores/auth-store'

interface AdminRouteProps {
  children: React.ReactNode
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  // 加载中显示空白或 loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  // 未登录重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 非管理员显示 403
  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="text-4xl font-bold text-destructive">403</div>
        <div className="text-muted-foreground">无权访问此页面</div>
        <a href="/" className="text-primary underline">
          返回首页
        </a>
      </div>
    )
  }

  return <>{children}</>
}
