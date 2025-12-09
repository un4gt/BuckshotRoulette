/**
 * LLM 信息流面板
 * 显示与 AI 的交互日志
 */

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { useLLMLogStore, type LLMLogType } from '@/app/stores/llm-log-store'

const typeConfig: Record<LLMLogType, { icon: string; color: string; label: string }> = {
  request: { icon: '📤', color: 'text-blue-400', label: '请求' },
  response: { icon: '📥', color: 'text-green-400', label: '响应' },
  thought: { icon: '💭', color: 'text-purple-400', label: '思考' },
  dialogue: { icon: '💬', color: 'text-yellow-400', label: '对话' },
  action: { icon: '🎯', color: 'text-orange-400', label: '决策' },
  error: { icon: '❌', color: 'text-red-400', label: '错误' },
  system: { icon: '⚙️', color: 'text-gray-400', label: '系统' },
}

interface ExpandedState {
  [key: string]: boolean
}

export function LLMLogPanel() {
  const { logs, clearLogs } = useLLMLogStore()
  const logRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // 自动滚动到底部
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-border bg-card/80 backdrop-blur">
      {/* 标题栏 */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          🤖 LLM 信息流
        </span>
        <button
          onClick={clearLogs}
          className="text-xs text-muted-foreground hover:text-foreground"
          title="清空日志"
        >
          清空
        </button>
      </div>

      {/* 日志内容 - 独立滚动区域 */}
      <div
        ref={logRef}
        className="min-h-0 flex-1 overflow-y-auto p-2 text-xs"
      >
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            等待 AI 回合...
          </div>
        ) : (
          logs.map((log) => {
            const config = typeConfig[log.type]
            const isExpanded = expanded[log.id]
            const hasDetails = !!log.details

            return (
              <div
                key={log.id}
                className={cn(
                  'mb-2 rounded border border-border/50 bg-background/50 p-2',
                  log.type === 'error' && 'border-red-500/30 bg-red-500/5'
                )}
              >
                {/* 日志头部 */}
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    {/* 标题行 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('font-medium', config.color)}>
                        {config.label}
                      </span>
                      <span className="text-muted-foreground">
                        [{log.role === 'demon' ? '恶魔' : '玩家'}]
                      </span>
                      <span className="text-muted-foreground/60 text-[10px]">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>

                    {/* 标题 */}
                    <div className="mt-1 text-foreground/90">
                      {log.title}
                    </div>

                    {/* 内容 */}
                    {log.content && (
                      <div className="mt-1 whitespace-pre-wrap text-muted-foreground leading-relaxed">
                        {log.content.length > 200 && !isExpanded
                          ? `${log.content.slice(0, 200)}...`
                          : log.content}
                      </div>
                    )}

                    {/* 展开/收起详情 */}
                    {(hasDetails || log.content.length > 200) && (
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="mt-1 text-primary/70 hover:text-primary"
                      >
                        {isExpanded ? '收起 ▲' : '展开详情 ▼'}
                      </button>
                    )}

                    {/* 详细内容 */}
                    {isExpanded && hasDetails && (
                      <div className="mt-2 rounded bg-black/30 p-2 font-mono text-[10px] text-muted-foreground overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-all">
                          {log.details}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="flex-shrink-0 border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground/60">
        共 {logs.length} 条记录
      </div>
    </div>
  )
}
