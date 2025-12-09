import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameTable } from '@/features/game-table'
import { useGameStore } from '@/app/stores'

export const GamePage = () => {
  const navigate = useNavigate()
  const { game } = useGameStore()

  // 如果没有游戏实例，返回大厅
  useEffect(() => {
    if (!game) {
      navigate('/', { replace: true })
    }
  }, [game, navigate])

  const handleExit = () => {
    navigate('/')
  }

  if (!game) {
    return null
  }

  return <GameTable onExit={handleExit} />
}
