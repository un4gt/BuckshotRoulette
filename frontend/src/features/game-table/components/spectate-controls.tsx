/**
 * 观战控制栏组件
 * 用于 AI vs AI 模式下控制观战速度和暂停
 */

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { useGameSettingsStore, type SpectateSpeed } from '@/app/stores/game-settings'

const SPEED_OPTIONS: { value: SpectateSpeed; label: string }[] = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
]

export function SpectateControls() {
  const {
    settings,
    setSpectatePaused,
    setSpectateSpeed,
    setStepMode,
    nextStep,
  } = useGameSettingsStore()

  const { isPaused, speed, stepMode } = settings.spectate

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/80 px-4 py-2 backdrop-blur">
      {/* 暂停/继续按钮 */}
      <Button
        variant={isPaused ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSpectatePaused(!isPaused)}
        className="w-20"
      >
        {isPaused ? '▶ 继续' : '⏸ 暂停'}
      </Button>

      {/* 速度控制 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">速度:</span>
        <div className="flex gap-1">
          {SPEED_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={speed === option.value ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSpectateSpeed(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 分隔线 */}
      <div className="h-6 w-px bg-border" />

      {/* 单步模式 */}
      <div className="flex items-center gap-2">
        <Button
          variant={stepMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStepMode(!stepMode)}
          className={cn(
            'text-xs',
            stepMode && 'bg-amber-600 hover:bg-amber-700'
          )}
        >
          {stepMode ? '⏯ 单步模式' : '⏯ 单步'}
        </Button>

        {stepMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={nextStep}
            disabled={!isPaused}
            className="text-xs"
          >
            ⏭ 下一步
          </Button>
        )}
      </div>
    </div>
  )
}
