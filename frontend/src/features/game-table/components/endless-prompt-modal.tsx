import { useGameStore } from '@/app/stores/game-store'
import { Button } from '@/shared/ui/button'

export function EndlessPromptModal() {
  const { game, startEndlessMode, declineEndlessMode } = useGameStore()

  if (!game) return null

  const isFirstEndlessPrompt = !game.isEndlessMode
  const nextRound = game.endlessRound + 1

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="flex max-w-md flex-col items-center gap-6 rounded-lg border border-yellow-600/50 bg-card p-8 shadow-2xl">
        {/* 标题 */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">🎰</span>
          <h2 className="text-2xl font-bold text-yellow-400">
            {isFirstEndlessPrompt ? '进入无尽模式？' : `无尽模式 第 ${game.endlessRound} 轮胜利！`}
          </h2>
        </div>

        {/* 分数显示 */}
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-background/50 px-6 py-4">
          <div className="text-sm text-muted-foreground">当前累计分数</div>
          <div className="text-4xl font-bold text-primary">{game.score.toLocaleString()}</div>
          {game.isEndlessMode && (
            <div className="text-sm text-yellow-400">
              (本轮已翻倍)
            </div>
          )}
        </div>

        {/* 说明文字 */}
        <div className="flex flex-col gap-2 text-center text-sm">
          {isFirstEndlessPrompt ? (
            <>
              <p className="text-muted-foreground">
                你已经击败了三回合的恶魔！
              </p>
              <p className="text-muted-foreground">
                是否要挑战<span className="text-yellow-400">无尽模式</span>？
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              是否继续挑战第 <span className="text-yellow-400">{nextRound}</span> 轮？
            </p>
          )}
          <div className="mt-2 rounded border border-yellow-600/30 bg-yellow-900/20 px-4 py-2">
            <p className="text-yellow-300">
              🎲 继续：胜利后分数 <span className="font-bold">×2</span> 翻倍！
            </p>
            <p className="text-red-400">
              💀 失败：所有分数<span className="font-bold">清零</span>！
            </p>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={declineEndlessMode}
            className="min-w-[120px]"
          >
            见好就收
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={startEndlessMode}
            className="min-w-[120px] bg-yellow-600 hover:bg-yellow-500"
          >
            继续挑战
          </Button>
        </div>

        {/* 潜在收益提示 */}
        <div className="text-xs text-muted-foreground">
          下一轮胜利可获得：<span className="text-green-400 font-medium">{(game.score * 2).toLocaleString()}</span> 分
        </div>
      </div>
    </div>
  )
}
