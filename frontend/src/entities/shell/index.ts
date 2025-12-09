export type ShellType = 'live' | 'blank'

export interface Shell {
  id: string
  type: ShellType
  isRevealed: boolean // 是否已被放大镜查看
}

export function createShell(type: ShellType): Shell {
  return {
    id: crypto.randomUUID(),
    type,
    isRevealed: false,
  }
}

export function generateShells(liveCount: number, blankCount: number): Shell[] {
  const shells: Shell[] = [
    ...Array.from({ length: liveCount }, () => createShell('live')),
    ...Array.from({ length: blankCount }, () => createShell('blank')),
  ]
  // 洗牌
  return shuffleArray(shells)
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
