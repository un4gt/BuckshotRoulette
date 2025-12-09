import { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/shared/lib/utils'

interface SignaturePadProps {
  onSignatureChange?: (dataUrl: string | null) => void
  width?: number
  height?: number
  className?: string
}

export function SignaturePad({
  onSignatureChange,
  width = 400,
  height = 150,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  // 初始化 canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置高 DPI
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // 初始化样式
    ctx.strokeStyle = '#c41e1e' // 血红色签名
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // 绘制底部线条
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.moveTo(20, height - 30)
    ctx.lineTo(width - 20, height - 30)
    ctx.stroke()

    // 恢复签名样式
    ctx.strokeStyle = '#c41e1e'
    ctx.lineWidth = 2
  }, [width, height])

  const getCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()

      if ('touches' in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        }
      }

      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    },
    []
  )

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx) return

      setIsDrawing(true)
      const { x, y } = getCoordinates(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
    },
    [getCoordinates]
  )

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx) return

      const { x, y } = getCoordinates(e)
      ctx.lineTo(x, y)
      ctx.stroke()
      setHasSignature(true)
    },
    [isDrawing, getCoordinates]
  )

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return

    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png')
      onSignatureChange?.(dataUrl)
    }
  }, [isDrawing, hasSignature, onSignatureChange])

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

    // 重新绘制底部线条
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.moveTo(20, height - 30)
    ctx.lineTo(width - 20, height - 30)
    ctx.stroke()

    // 恢复签名样式
    ctx.strokeStyle = '#c41e1e'
    ctx.lineWidth = 2

    setHasSignature(false)
    onSignatureChange?.(null)
  }, [width, height, onSignatureChange])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="relative overflow-hidden rounded border border-border bg-black/50">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground/50">
              在此处签名...
            </span>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground">
          {hasSignature ? '已签名' : '请签名以确认'}
        </span>
        {hasSignature && (
          <button
            onClick={clearSignature}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            清除签名
          </button>
        )}
      </div>
    </div>
  )
}
