import { cn } from '@/shared/lib/utils'
import { type Item, type ItemType, ITEM_INFO } from '@/entities/items'

interface AdrenalineModalProps {
  opponentItems: Item[]
  opponentName: string
  onSelectItem: (itemType: ItemType) => void
  onCancel: () => void
}

export function AdrenalineModal({
  opponentItems,
  opponentName,
  onSelectItem,
  onCancel,
}: AdrenalineModalProps) {
  // 过滤出可选的道具（未使用且不是肾上腺素）
  const availableItems = opponentItems.filter(
    (item) => !item.used && item.type !== 'adrenaline'
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="text-center">
          <h3 className="text-lg font-bold text-primary">💉 肾上腺素</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            选择要从 {opponentName} 偷取并使用的道具
          </p>
        </div>

        {availableItems.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            对方没有可偷取的道具
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {availableItems.map((item) => {
              const info = ITEM_INFO[item.type]
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(item.type)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border border-border p-4',
                    'bg-card transition-all hover:border-primary hover:bg-primary/10',
                    'focus:outline-none focus:ring-2 focus:ring-primary'
                  )}
                >
                  <span className="text-3xl">{info.icon}</span>
                  <span className="text-sm font-medium">{info.name}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {info.description}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <button
          onClick={onCancel}
          className={cn(
            'mt-2 rounded border border-border px-4 py-2 text-sm',
            'text-muted-foreground transition-colors hover:bg-muted'
          )}
        >
          取消
        </button>
      </div>
    </div>
  )
}
