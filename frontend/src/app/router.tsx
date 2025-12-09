import { createBrowserRouter, Outlet } from 'react-router-dom'
import { LobbyPage } from '@/features/lobby'
import { GamePage } from '@/features/game'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { AdminRoute } from '@/shared/components/admin-route'

// 根布局组件 - 包含 CRT 效果
const RootLayout = () => {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* CRT 效果层 */}
      <div className="crt-overlay" />
      <div className="noise-overlay" />
      <div className="vignette" />

      {/* 主内容 */}
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <LobbyPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/game',
        element: <GamePage />,
      },
      {
        path: '/dashboard',
        element: (
          <AdminRoute>
            <DashboardPage />
          </AdminRoute>
        ),
      },
    ],
  },
])
