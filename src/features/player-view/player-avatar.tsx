import { cn } from '@/shared/lib/utils'
import type { AIProvider } from '@/app/stores/game-settings'

interface PlayerAvatarProps {
  name: string
  isAI: boolean
  aiProvider?: AIProvider
  isActive: boolean
  health: number
  maxHealth: number
  position: 'left' | 'right' | 'bottom'
  isHandcuffed?: boolean
  /** 闸刀状态激活（一击必杀） */
  guillotineActive?: boolean
  className?: string
}

const AI_AVATARS: Record<AIProvider, { icon: string; color: string }> = {
  gemini: { icon: '✦', color: 'from-blue-500 to-purple-500' },
  deepseek: { icon: '🔮', color: 'from-blue-600 to-cyan-400' },
  grok: { icon: '𝕏', color: 'from-gray-600 to-gray-400' },
  openai: { icon: '◐', color: 'from-emerald-500 to-teal-400' },
  openrouter: { icon: '⚡', color: 'from-purple-500 to-pink-500' },
  'openai-compatible': { icon: '⚙️', color: 'from-zinc-500 to-zinc-400' },
}

// 恶魔 - 恐怖的骷髅头像
const DemonAvatar = ({ isActive }: { isActive: boolean }) => (
  <div
    className={cn(
      'relative flex h-24 w-24 items-center justify-center rounded-full',
      'bg-gradient-to-br from-gray-900 to-black',
      'border-2 transition-all duration-300',
      isActive ? 'border-primary shadow-lg shadow-primary/50' : 'border-border'
    )}
  >
    {/* 骷髅眼睛 */}
    <div className="relative">
      <div className="flex gap-3">
        <div
          className={cn(
            'h-4 w-3 rounded-full bg-black',
            isActive && 'animate-pulse shadow-inner shadow-red-500'
          )}
        >
          {isActive && (
            <div className="h-2 w-2 rounded-full bg-red-500 opacity-80" />
          )}
        </div>
        <div
          className={cn(
            'h-4 w-3 rounded-full bg-black',
            isActive && 'animate-pulse shadow-inner shadow-red-500'
          )}
        >
          {isActive && (
            <div className="h-2 w-2 rounded-full bg-red-500 opacity-80" />
          )}
        </div>
      </div>
      {/* 鼻子 */}
      <div className="mx-auto mt-1 h-2 w-2 rotate-45 bg-black" />
      {/* 牙齿 */}
      <div className="mt-1 flex justify-center gap-0.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-3 w-1.5 rounded-sm bg-gray-300" />
        ))}
      </div>
    </div>
    {/* 光晕效果 */}
    {isActive && (
      <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20" />
    )}
  </div>
)

// AI 头像
const AIAvatar = ({
  provider,
  isActive,
}: {
  provider: AIProvider
  isActive: boolean
}) => {
  const { icon, color } = AI_AVATARS[provider]
  return (
    <div
      className={cn(
        'relative flex h-24 w-24 items-center justify-center rounded-full',
        `bg-gradient-to-br ${color}`,
        'border-2 transition-all duration-300',
        isActive ? 'border-primary shadow-lg shadow-primary/50' : 'border-border'
      )}
    >
      <span className="text-4xl">{icon}</span>
      {isActive && (
        <div className="absolute inset-0 animate-pulse rounded-full bg-white/20" />
      )}
    </div>
  )
}

// 玩家头像（真人）
const HumanAvatar = ({ isActive }: { isActive: boolean }) => (
  <div
    className={cn(
      'relative flex h-24 w-24 items-center justify-center rounded-full',
      'bg-gradient-to-br from-zinc-700 to-zinc-900',
      'border-2 transition-all duration-300',
      isActive ? 'border-primary shadow-lg shadow-primary/50' : 'border-border'
    )}
  >
    {/* 简单的人形图标 */}
    <svg
      viewBox="0 0 24 24"
      className="h-12 w-12 fill-current text-zinc-400"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M12 14c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
    </svg>
    {isActive && (
      <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20" />
    )}
  </div>
)

export function PlayerAvatar({
  name,
  isAI,
  aiProvider,
  isActive,
  health,
  maxHealth,
  position,
  isHandcuffed,
  guillotineActive,
  className,
}: PlayerAvatarProps) {
  const isDemon = name === '恶魔'

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2',
        position === 'bottom' && 'flex-col-reverse',
        className
      )}
    >
      {/* 头像 */}
      <div className="relative">
        {isDemon ? (
          <DemonAvatar isActive={isActive} />
        ) : isAI && aiProvider ? (
          <AIAvatar provider={aiProvider} isActive={isActive} />
        ) : (
          <HumanAvatar isActive={isActive} />
        )}

        {/* 手铐指示 */}
        {isHandcuffed && (
          <div className="absolute -right-2 -top-2 text-2xl">⛓️</div>
        )}

        {/* 闸刀状态指示 */}
        {guillotineActive && (
          <div className="absolute -left-2 -top-2 animate-pulse text-2xl" title="一击必杀">
            ⚡
          </div>
        )}
      </div>

      {/* 名字和血量 */}
      <div className="flex flex-col items-center gap-1">
        <span
          className={cn(
            'text-sm font-medium',
            isActive ? 'text-primary' : 'text-muted-foreground',
            guillotineActive && 'text-red-500'
          )}
        >
          {name}
          {guillotineActive && <span className="ml-1 text-xs">(危)</span>}
        </span>

        {/* 血量条 */}
        <div className="flex gap-1">
          {[...Array(maxHealth)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-3 w-3 rounded-sm border transition-colors',
                i < health
                  ? guillotineActive
                    ? 'border-red-600 bg-red-500'
                    : 'border-border bg-primary'
                  : 'border-border bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
