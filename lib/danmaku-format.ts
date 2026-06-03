/** 将长句拆成 2～3 行，尽量在标点处断行 */
export function splitDanmakuLines(text: string, maxLines = 3): string[] {
  if (text.length <= 22) return [text]

  const lineCount = text.length > 52 ? 3 : 2
  const idealLen = Math.ceil(text.length / lineCount)
  const lines: string[] = []
  let pos = 0

  while (pos < text.length && lines.length < lineCount) {
    const isLast = lines.length === lineCount - 1
    if (isLast) {
      lines.push(text.slice(pos).trim())
      break
    }

    let end = Math.min(pos + idealLen, text.length)
    if (end < text.length) {
      const minBreak = pos + Math.floor(idealLen * 0.5)
      for (let j = end; j > minBreak; j--) {
        if (/[，。；！？、：—…]/.test(text[j]!)) {
          end = j + 1
          break
        }
      }
    }

    const chunk = text.slice(pos, end).trim()
    if (chunk) lines.push(chunk)
    pos = end
  }

  return lines.length > 0 ? lines : [text]
}

/** 长句占用的轨道数（避免与上下弹幕重叠） */
export function danmakuLaneSpan(isLong: boolean, lineCount: number): number {
  if (!isLong) return 1
  return lineCount >= 3 ? 3 : 2
}
