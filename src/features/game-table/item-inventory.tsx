import { cn } from '@/shared/lib/utils'
import { type Item, ITEM_INFO } from '@/entities/items'

interface ItemInventoryProps {
  items: Item[]
  onUseItem?: (itemId: string) => void
  disabled?: boolean
  position: 'left' | 'right' | 'bottom'
  className?: string
}

export function ItemInventory({
  items,
  onUseItem,
  disabled,
  position,
  className,
}: ItemInventoryProps) {
  const availableItems = items.filter((item) => !item.used)

  return (
    <div
      className={cn(
        'flex gap-2',
        position === 'bottom' && 'flex-row flex-wrap justify-center',
        (position === 'left' || position === 'right') && 'flex-col',
        className
      )}
    >
      {availableItems.length === 0 ? (
        <div className="text-xs text-muted-foreground">无道具</div>
      ) : (
        availableItems.map((item) => {
          const info = ITEM_INFO[item.type]
          return (
            <button
              key={item.id}
              onClick={() => onUseItem?.(item.id)}
              disabled={disabled}
              className={cn(
                'group relative flex h-12 w-12 items-center justify-center',
                'rounded border border-border bg-card transition-all',
                'hover:border-primary hover:bg-primary/10',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'focus:outline-none focus:ring-2 focus:ring-primary'
              )}
              title={`${info.name}: ${info.description}`}
            >
              <span className="text-2xl">{info.icon}</span>

              {/* 悬浮提示 */}
              <div
                className={cn(
                  'absolute z-50 hidden w-40 rounded border border-border bg-popover p-2 text-xs shadow-lg',
                  'group-hover:block',
                  position === 'left' && 'left-full ml-2',
                  position === 'right' && 'right-full mr-2',
                  position === 'bottom' && 'bottom-full mb-2 left-1/2 -translate-x-1/2'
                )}
              >
                <div className="font-medium text-foreground">{info.name}</div>
                <div className="text-muted-foreground">{info.description}</div>
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}
