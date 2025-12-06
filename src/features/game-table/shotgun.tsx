import { cn } from '@/shared/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ShotgunProps {
  isSawedOff: boolean
  /** 枪口指向: 'demon'=上方对手, 'player'=下方自己, null=水平 */
  aimTarget: 'demon' | 'player' | null
  isShooting: boolean
  /** 射击结果：'live'=实弹（显示火花），'blank'=空弹（不显示火花） */
  shotResult: 'live' | 'blank' | null
  onShoot?: (target: 'self' | 'opponent') => void
  disabled?: boolean
  className?: string
  /** 紧凑模式 - 不显示按钮 */
  compact?: boolean
}

export function Shotgun({
  isSawedOff,
  aimTarget,
  isShooting,
  shotResult,
  onShoot,
  disabled,
  className,
  compact = false,
}: ShotgunProps) {
  // 计算旋转角度：枪口朝左，所以向上旋转是正角度，向下是负角度
  // 指向对手(上方)=+90度，指向自己(下方)=-90度
  const getRotation = () => {
    if (aimTarget === 'demon') return 90  // 枪口朝上（对手在上方）
    if (aimTarget === 'player') return -90 // 枪口朝下（自己在下方）
    return 0
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* 霰弹枪 */}
      <motion.div
        className="relative"
        animate={{
          rotate: getRotation(),
          x: isShooting ? [-3, 3, -2, 2, 0] : 0,
        }}
        transition={{
          rotate: { duration: 0.4, ease: 'easeInOut' },
          x: { duration: 0.15, ease: 'easeOut' },
        }}
        style={{ originX: 0.7, originY: 0.5 }} // 旋转中心在枪托附近
      >
        <svg
          viewBox="0 0 320 100"
          className={cn(
            'drop-shadow-xl transition-all duration-300',
            isSawedOff ? 'h-14 w-56' : 'h-16 w-64'
          )}
        >
          <defs>
            {/* 金属渐变 */}
            <linearGradient id="metalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#525252" />
              <stop offset="30%" stopColor="#3f3f46" />
              <stop offset="70%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#18181b" />
            </linearGradient>

            {/* 枪管渐变 */}
            <linearGradient id="barrelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#52525b" />
              <stop offset="50%" stopColor="#3f3f46" />
              <stop offset="100%" stopColor="#27272a" />
            </linearGradient>

            {/* 木纹渐变 */}
            <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="30%" stopColor="#92400e" />
              <stop offset="70%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>

            {/* 高光 */}
            <linearGradient id="highlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* 主枪身 - 木质枪托 */}
          <path
            d="M 200 35 L 260 35 Q 280 35 285 50 L 290 70 Q 292 85 280 90 L 250 90 Q 240 90 238 80 L 235 55 Q 232 45 240 40 L 200 40 Z"
            fill="url(#woodGradient)"
          />

          {/* 木纹细节 */}
          <path
            d="M 245 40 Q 260 50 255 70 M 250 42 Q 265 52 260 72 M 255 44 Q 270 54 265 74"
            fill="none"
            stroke="#451a03"
            strokeWidth="0.5"
            opacity="0.5"
          />

          {/* 上枪管 */}
          <rect
            x={isSawedOff ? '80' : '10'}
            y="30"
            width={isSawedOff ? '125' : '195'}
            height="14"
            rx="7"
            fill="url(#barrelGradient)"
          />
          <rect
            x={isSawedOff ? '80' : '10'}
            y="30"
            width={isSawedOff ? '125' : '195'}
            height="5"
            rx="2.5"
            fill="url(#highlight)"
          />

          {/* 下枪管 */}
          <rect
            x={isSawedOff ? '80' : '10'}
            y="46"
            width={isSawedOff ? '125' : '195'}
            height="14"
            rx="7"
            fill="url(#barrelGradient)"
          />
          <rect
            x={isSawedOff ? '80' : '10'}
            y="46"
            width={isSawedOff ? '125' : '195'}
            height="5"
            rx="2.5"
            fill="url(#highlight)"
          />

          {/* 枪管连接环 */}
          {!isSawedOff && (
            <>
              <rect x="40" y="28" width="8" height="34" rx="2" fill="#52525b" />
              <rect x="100" y="28" width="8" height="34" rx="2" fill="#52525b" />
              <rect x="160" y="28" width="8" height="34" rx="2" fill="#52525b" />
            </>
          )}
          {isSawedOff && (
            <>
              <rect x="120" y="28" width="8" height="34" rx="2" fill="#52525b" />
              <rect x="170" y="28" width="8" height="34" rx="2" fill="#52525b" />
            </>
          )}

          {/* 弹仓/机匣 */}
          <rect
            x="200"
            y="28"
            width="40"
            height="34"
            rx="4"
            fill="url(#metalGradient)"
          />
          <rect
            x="200"
            y="28"
            width="40"
            height="10"
            rx="4"
            fill="url(#highlight)"
          />

          {/* 扳机护圈 */}
          <path
            d="M 225 62 Q 225 78 240 78 Q 255 78 255 62"
            fill="none"
            stroke="#3f3f46"
            strokeWidth="4"
          />

          {/* 扳机 */}
          <path
            d="M 238 62 L 240 74 L 244 74 L 242 62 Z"
            fill="#27272a"
          />

          {/* 枪口（双管） */}
          <ellipse
            cx={isSawedOff ? '78' : '8'}
            cy="37"
            rx="4"
            ry="6"
            fill="#18181b"
          />
          <ellipse
            cx={isSawedOff ? '78' : '8'}
            cy="53"
            rx="4"
            ry="6"
            fill="#18181b"
          />

          {/* 锯痕效果 */}
          {isSawedOff && (
            <g>
              <path
                d="M 78 26 L 82 64"
                stroke="#71717a"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 76 28 L 80 62"
                stroke="#52525b"
                strokeWidth="1"
                strokeLinecap="round"
              />
              {/* 锯痕细节 */}
              <path
                d="M 77 30 L 79 32 M 78 36 L 80 38 M 77 42 L 79 44 M 78 48 L 80 50 M 77 54 L 79 56"
                stroke="#a1a1aa"
                strokeWidth="0.5"
              />
            </g>
          )}
        </svg>

        {/* 枪口火焰 - 只有实弹才显示 */}
        <AnimatePresence>
          {isShooting && shotResult === 'live' && (
            <motion.div
              className="absolute"
              style={{
                left: isSawedOff ? '10%' : '0%',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.8] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <svg viewBox="0 0 60 60" className="h-12 w-12 -ml-6">
                <defs>
                  <radialGradient id="muzzleFlash" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef9c3" />
                    <stop offset="30%" stopColor="#fde047" />
                    <stop offset="60%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
                <circle cx="30" cy="30" r="25" fill="url(#muzzleFlash)" />
                {/* 火花 */}
                <g stroke="#fef08a" strokeWidth="2" strokeLinecap="round">
                  <line x1="30" y1="30" x2="5" y2="20" />
                  <line x1="30" y1="30" x2="10" y2="35" />
                  <line x1="30" y1="30" x2="8" y2="45" />
                  <line x1="30" y1="30" x2="15" y2="15" />
                  <line x1="30" y1="30" x2="12" y2="50" />
                </g>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 空弹烟雾效果 */}
        <AnimatePresence>
          {isShooting && shotResult === 'blank' && (
            <motion.div
              className="absolute"
              style={{
                left: isSawedOff ? '10%' : '0%',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 0.6, 0.3] }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg viewBox="0 0 40 40" className="h-8 w-8 -ml-4">
                <defs>
                  <radialGradient id="smokeGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#a1a1aa" />
                    <stop offset="50%" stopColor="#71717a" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                </defs>
                <circle cx="20" cy="20" r="15" fill="url(#smokeGradient)" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 锯子标记 */}
        {isSawedOff && (
          <motion.div
            className="absolute -right-1 -top-1 rounded-full bg-destructive/20 p-1 text-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            🪚
          </motion.div>
        )}
      </motion.div>

      {/* 射击按钮 - 仅在非紧凑模式下显示 */}
      {!compact && (
        <div className="flex gap-4">
          <motion.button
            onClick={() => onShoot?.('opponent')}
            disabled={disabled}
            className={cn(
              'group relative flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
              'border-red-600/50 bg-gradient-to-b from-red-950/80 to-red-900/50 text-red-100',
              'hover:border-red-500 hover:from-red-900/90 hover:to-red-800/60 hover:shadow-lg hover:shadow-red-900/30',
              'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none',
              aimTarget === 'demon' && 'ring-2 ring-red-500 ring-offset-2 ring-offset-background'
            )}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
          >
            <span className="text-base transition-transform group-hover:scale-110">🎯</span>
            <span>射击对手</span>
          </motion.button>

          <motion.button
            onClick={() => onShoot?.('self')}
            disabled={disabled}
            className={cn(
              'group relative flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
              'border-zinc-600/50 bg-gradient-to-b from-zinc-800/80 to-zinc-900/50 text-zinc-200',
              'hover:border-zinc-500 hover:from-zinc-700/90 hover:to-zinc-800/60 hover:shadow-lg hover:shadow-zinc-900/30',
              'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none',
              aimTarget === 'player' && 'ring-2 ring-zinc-400 ring-offset-2 ring-offset-background'
            )}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
          >
            <span className="text-base transition-transform group-hover:scale-110">💀</span>
            <span>射击自己</span>
          </motion.button>
        </div>
      )}

      {/* 提示文字 */}
      {!compact && !disabled && (
        <motion.p
          className="text-xs text-muted-foreground/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isSawedOff ? '⚠️ 锯短枪管 - 伤害翻倍' : '选择射击目标'}
        </motion.p>
      )}
    </div>
  )
}
