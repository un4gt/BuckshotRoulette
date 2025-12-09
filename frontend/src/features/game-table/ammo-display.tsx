import { cn } from '@/shared/lib/utils'
import type { Shell, ShellType } from '@/entities/shell'

interface AmmoDisplayProps {
  shells: Shell[]
  currentIndex: number
  /** 已知的当前子弹类型（通过放大镜查看，只有自己能看到） */
  knownCurrentShellType: ShellType | null
  className?: string
}

export function AmmoDisplay({
  shells,
  currentIndex,
  knownCurrentShellType,
  className,
}: AmmoDisplayProps) {
  const remainingShells = shells.slice(currentIndex)
  const liveCount = remainingShells.filter((s) => s.type === 'live').length
  const blankCount = remainingShells.filter((s) => s.type === 'blank').length

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* 弹药统计 */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-red-600" />
          <span className="text-muted-foreground">实弹: {liveCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-gray-600" />
          <span className="text-muted-foreground">空弹: {blankCount}</span>
        </div>
      </div>

      {/* 弹药可视化 */}
      <div className="flex items-center gap-2">
        {remainingShells.map((shell, index) => {
          const isCurrentShell = index === 0
          // 只有当前子弹可以被揭示（通过放大镜）
          const isRevealed = isCurrentShell && knownCurrentShellType !== null

          return (
            <div
              key={shell.id}
              className={cn(
                'relative h-8 w-4 rounded-sm transition-all duration-300',
                'border border-border',
                // 默认未知状态
                !isRevealed && 'bg-zinc-700',
                // 已揭示的子弹（使用已知类型，而非实际类型）
                isRevealed && knownCurrentShellType === 'live' && 'bg-red-600',
                isRevealed && knownCurrentShellType === 'blank' && 'bg-gray-500',
                // 当前子弹高亮
                isCurrentShell && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
              )}
            >
              {/* 子弹头部 */}
              <div
                className={cn(
                  'absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full',
                  !isRevealed && 'bg-zinc-500',
                  isRevealed && knownCurrentShellType === 'live' && 'bg-red-400',
                  isRevealed && knownCurrentShellType === 'blank' && 'bg-gray-400'
                )}
              />
              {/* 揭示标记 */}
              {isRevealed && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs">
                  {knownCurrentShellType === 'live' ? '🔴' : '⚫'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 当前子弹提示 */}
      {knownCurrentShellType && (
        <div
          className={cn(
            'mt-2 rounded px-3 py-1 text-sm',
            knownCurrentShellType === 'live'
              ? 'bg-red-900/50 text-red-300'
              : 'bg-gray-800 text-gray-300'
          )}
        >
          当前子弹: {knownCurrentShellType === 'live' ? '实弹 🔴' : '空弹 ⚫'}
        </div>
      )}
    </div>
  )
}
