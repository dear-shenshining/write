const HARD_BREAK = new Set("。！？；\n")
const SOFT_BREAK = new Set("，、：—…）】」』》")

/** 按总字数决定行数 */
function targetLineCount(length: number): number {
  if (length <= 24) return 1
  if (length <= 44) return 2
  return 3
}

/** 每行目标字数（移动端可读宽度） */
function targetCharsPerLine(length: number, lineCount: number): number {
  const avg = Math.ceil(length / lineCount)
  if (lineCount === 3) return Math.min(30, Math.max(18, avg))
  return Math.min(36, Math.max(20, avg))
}

function breakScore(char: string, distance: number): number {
  if (HARD_BREAK.has(char)) return 100 - distance * 2
  if (SOFT_BREAK.has(char)) return 60 - distance * 2
  return 0
}

function findBreakIndex(text: string, start: number, targetEnd: number): number {
  const len = text.length
  const minPos = start + Math.max(8, Math.floor((targetEnd - start) * 0.42))
  const maxPos = Math.min(len, targetEnd + 6)

  let best = Math.min(targetEnd, len)
  let bestScore = -1

  for (let i = maxPos; i >= minPos; i--) {
    const ch = text[i - 1]
    if (!ch) continue
    const score = breakScore(ch, Math.abs(i - targetEnd))
    if (score > bestScore) {
      bestScore = score
      best = i
    }
  }

  if (bestScore < 0) return best
  return best
}

/** 将长句拆成 2～3 行，按字数均衡并在标点处断行 */
export function splitDanmakuLines(text: string): string[] {
  const normalized = text.trim().replace(/\s+/g, "")
  if (!normalized) return [text]

  const lineCount = targetLineCount(normalized.length)
  if (lineCount === 1) return [normalized]

  const perLine = targetCharsPerLine(normalized.length, lineCount)
  const lines: string[] = []
  let pos = 0

  for (let i = 0; i < lineCount; i++) {
    const remaining = normalized.length - pos
    const linesLeft = lineCount - i

    if (linesLeft === 1) {
      lines.push(normalized.slice(pos).trim())
      break
    }

    const idealEnd = pos + Math.min(perLine, Math.ceil(remaining / linesLeft) + 2)
    let breakAt = findBreakIndex(normalized, pos, idealEnd)
    if (breakAt <= pos) breakAt = Math.min(pos + perLine, normalized.length)

    const chunk = normalized.slice(pos, breakAt).trim()
    if (chunk) lines.push(chunk)
    pos = breakAt
  }

  if (pos < normalized.length) {
    const tail = normalized.slice(pos).trim()
    if (tail) {
      if (lines.length > 0) lines[lines.length - 1] += tail
      else lines.push(tail)
    }
  }

  return lines.length > 0 ? lines : [normalized]
}

/** 长句占用的轨道数（避免与上下弹幕重叠） */
export function danmakuLaneSpan(isLong: boolean, lineCount: number): number {
  if (!isLong) return 1
  if (lineCount >= 3) return 3
  if (lineCount === 2) return 2
  return 2
}
