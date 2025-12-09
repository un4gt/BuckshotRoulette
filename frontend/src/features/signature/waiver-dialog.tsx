import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { SignaturePad } from './signature-pad'
import { useGameSettingsStore } from '@/app/stores/game-settings'

interface WaiverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function WaiverDialog({ open, onOpenChange, onConfirm }: WaiverDialogProps) {
  const { settings, setSignature } = useGameSettingsStore()
  const [localSignature, setLocalSignature] = useState<string | null>(null)

  const handleConfirm = () => {
    if (localSignature) {
      setSignature(localSignature)
      onConfirm()
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setLocalSignature(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="crt-glow text-xl text-primary">
            免责声明
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            阅读并签署以下声明以开始游戏
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 免责声明文本 */}
          <div className="max-h-40 overflow-y-auto rounded border border-border bg-black/30 p-4 text-sm text-muted-foreground">
            <p className="mb-2">本人，{settings.playerName || '参与者'}，特此声明：</p>
            <ol className="list-inside list-decimal space-y-1 text-xs">
              <li>本人自愿参与此次霰弹枪轮盘游戏。</li>
              <li>本人已充分了解游戏规则及潜在风险。</li>
              <li>本人同意承担所有由此产生的后果。</li>
              <li>本人保证精神状态良好，具有完全民事行为能力。</li>
              <li>本人放弃对恶魔及游戏组织方的一切索赔权利。</li>
            </ol>
            <p className="mt-3 text-xs italic text-muted-foreground/70">
              "当你凝视深渊时，深渊也在凝视着你。"
            </p>
          </div>

          {/* 签名区域 */}
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              签名确认
            </label>
            <SignaturePad
              onSignatureChange={setLocalSignature}
              width={400}
              height={120}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            取消
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={!localSignature}
          >
            确认签署
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
