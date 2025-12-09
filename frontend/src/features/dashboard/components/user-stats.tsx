import { useEffect, useState } from 'react'
import { Card } from '@/shared/ui/card'
import { api } from '@/shared/api/client'

interface Stats {
  totalUsers: number
  onlineUsers: number
}

export const UserStats = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<Stats>('/admin/stats')
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取统计失败')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6 animate-pulse bg-muted/50">
          <div className="h-4 w-20 bg-muted rounded mb-2" />
          <div className="h-8 w-16 bg-muted rounded" />
        </Card>
        <Card className="p-6 animate-pulse bg-muted/50">
          <div className="h-4 w-20 bg-muted rounded mb-2" />
          <div className="h-8 w-16 bg-muted rounded" />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-destructive text-sm">{error}</div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 max-w-md">
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">总用户数</div>
        <div className="text-3xl font-bold">{stats?.totalUsers ?? 0}</div>
      </Card>
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">在线用户</div>
        <div className="text-3xl font-bold text-green-500">{stats?.onlineUsers ?? 0}</div>
      </Card>
    </div>
  )
}
