/** 浏览器端随机整数，分布比 Math.random 更均匀 */
function randomInt(max: number): number {
  if (max <= 1) return 0
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

function shuffleInPlace(indices: number[]): void {
  for (let i = indices.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const tmp = indices[i]
    indices[i] = indices[j]
    indices[j] = tmp
  }
}

/**
 * 洗牌袋：一轮内每条文案各出现一次，用完重新洗牌；
 * 尽量避免与上一条重复，并尽量避开当前屏幕上的文案。
 */
export function createDanmakuTextPicker(texts: readonly string[]) {
  let bag: number[] = []
  let lastPickedIndex: number | null = null

  const refillBag = () => {
    bag = texts.map((_, i) => i)
    shuffleInPlace(bag)
    if (
      lastPickedIndex !== null &&
      bag.length > 1 &&
      bag[0] === lastPickedIndex
    ) {
      ;[bag[0], bag[1]] = [bag[1], bag[0]]
    }
  }

  const pickFromBag = (skipIndices: Set<number>): number | null => {
    const deferred: number[] = []
    while (bag.length > 0) {
      const index = bag.pop()!
      if (skipIndices.has(index)) {
        deferred.push(index)
        continue
      }
      bag.push(...deferred)
      return index
    }
    bag.push(...deferred)
    return null
  }

  refillBag()

  return {
    pick(activeOnScreen: readonly string[] = []): string {
      if (texts.length === 0) return ""
      if (texts.length === 1) return texts[0]

      const activeIndices = new Set<number>()
      for (const line of activeOnScreen) {
        const idx = texts.indexOf(line)
        if (idx !== -1) activeIndices.add(idx)
      }

      let index = pickFromBag(activeIndices)

      if (index === null) {
        refillBag()
        index = pickFromBag(activeIndices)
      }

      if (index === null) {
        const candidates = texts
          .map((_, i) => i)
          .filter((i) => i !== lastPickedIndex && !activeIndices.has(i))
        const pool =
          candidates.length > 0
            ? candidates
            : texts.map((_, i) => i).filter((i) => i !== lastPickedIndex)
        index =
          pool.length > 0 ? pool[randomInt(pool.length)] : randomInt(texts.length)
      }

      lastPickedIndex = index
      return texts[index]
    },
  }
}

export type DanmakuTextPicker = ReturnType<typeof createDanmakuTextPicker>
