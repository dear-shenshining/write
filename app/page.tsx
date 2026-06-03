"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useCallback, useRef, useEffect, memo, startTransition } from "react"
import { throttle } from "@/lib/utils"
import { DANMAKU_TEXTS, isLongDanmakuText } from "@/lib/danmaku-texts"
import { createDanmakuTextPicker } from "@/lib/danmaku-picker"
import { danmakuLaneSpan, splitDanmakuLines } from "@/lib/danmaku-format"

// 鲜明颜色
const vibrantColors = [
  "oklch(0.65 0.20 350)", // 鲜粉
  "oklch(0.60 0.18 280)", // 鲜紫
  "oklch(0.68 0.16 230)", // 鲜蓝
  "oklch(0.58 0.20 320)", // 鲜玫瑰
  "oklch(0.65 0.15 200)", // 鲜青
  "oklch(0.62 0.17 300)", // 鲜薰衣草
  "oklch(0.60 0.18 260)", // 鲜靛蓝
]

// 弹幕配置
const MAX_DANMAKU = 10
const TRIGGER_THROTTLE_MS = 600
const LANE_COUNT = 8
const LANE_MIN = 15
const LANE_MAX = 75

// 弹幕组件
interface DanmakuItem {
  id: number
  text: string
  lines: string[]
  isLong: boolean
  color: string
  top: number
  lane: number
  laneSpan: number
  duration: number
}

function laneToTop(lane: number) {
  return LANE_MIN + (lane / (LANE_COUNT - 1)) * (LANE_MAX - LANE_MIN)
}

function laneBlockToTop(startLane: number, span: number) {
  if (span <= 1) return laneToTop(startLane)
  const endLane = Math.min(startLane + span - 1, LANE_COUNT - 1)
  return (laneToTop(startLane) + laneToTop(endLane)) / 2
}

function getOccupiedLanes(items: DanmakuItem[]): Set<number> {
  const occupied = new Set<number>()
  for (const item of items) {
    for (let k = 0; k < item.laneSpan; k++) {
      const lane = item.lane + k
      if (lane < LANE_COUNT) occupied.add(lane)
    }
  }
  return occupied
}

function findLaneBlock(occupied: Set<number>, span: number): number | null {
  for (let start = 0; start <= LANE_COUNT - span; start++) {
    let ok = true
    for (let k = 0; k < span; k++) {
      if (occupied.has(start + k)) {
        ok = false
        break
      }
    }
    if (ok) return start
  }
  return null
}

const DanmakuLine = memo(function DanmakuLine({
  item,
  onComplete,
}: {
  item: DanmakuItem
  onComplete: (id: number) => void
}) {
  const completedRef = useRef(false)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete(item.id)
  }, [item.id, onComplete])

  useEffect(() => {
    const fallbackMs = (item.duration + 1.5) * 1000
    const timeoutId = setTimeout(handleComplete, fallbackMs)
    return () => clearTimeout(timeoutId)
  }, [item.duration, handleComplete])

  return (
    <motion.div
      initial={{ x: "100vw", opacity: 0 }}
      animate={{ x: "-100%", opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: item.duration, ease: "linear" }}
      onAnimationComplete={(definition) => {
        if (definition === "exit") return
        handleComplete()
      }}
      style={{
        top: `${item.top}%`,
        color: item.color,
      }}
      className={
        item.isLong
          ? "danmaku-line danmaku-line--long absolute text-sm font-medium drop-shadow-sm sm:text-base md:text-lg"
          : "danmaku-line absolute whitespace-nowrap text-base font-medium drop-shadow-sm sm:text-lg md:text-xl"
      }
    >
      {item.isLong ? (
        <div className="danmaku-long-box rounded-lg px-3 py-2 sm:rounded-xl sm:px-4 sm:py-2.5">
          {item.lines.map((line, index) => (
            <p
              key={index}
              className={
                index > 0
                  ? "mt-0.5 leading-relaxed sm:mt-1"
                  : "leading-relaxed"
              }
            >
              {line}
            </p>
          ))}
        </div>
      ) : (
        item.text
      )}
    </motion.div>
  )
})

function Danmaku({ items, onComplete }: { items: DanmakuItem[]; onComplete: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <DanmakuLine key={item.id} item={item} onComplete={onComplete} />
        ))}
      </AnimatePresence>
    </div>
  )
}

/** 弹幕逻辑完全在浏览器端运行，与服务器无交互 */
const danmakuTriggerRef: { current: () => void } = { current: () => {} }

function DanmakuOverlay() {
  const [danmakuItems, setDanmakuItems] = useState<DanmakuItem[]>([])
  const nextIdRef = useRef(0)
  const textPickerRef = useRef(createDanmakuTextPicker(DANMAKU_TEXTS))

  const spawnDanmaku = useCallback(() => {
    startTransition(() => {
      setDanmakuItems((prev) => {
        if (prev.length >= MAX_DANMAKU) return prev

        const occupied = getOccupiedLanes(prev)
        const text = textPickerRef.current.pick(prev.map((item) => item.text))
        const isLong = isLongDanmakuText(text)
        const lines = isLong ? splitDanmakuLines(text) : [text]
        const laneSpan = danmakuLaneSpan(isLong, lines.length)

        const lane = findLaneBlock(occupied, laneSpan)
        if (lane === null) return prev

        const duration = isLong
          ? 14 + Math.random() * 8 + lines.length * 1.5
          : 10 + Math.random() * 5

        return [
          ...prev,
          {
            id: nextIdRef.current++,
            text,
            lines,
            isLong,
            color: vibrantColors[Math.floor(Math.random() * vibrantColors.length)],
            top: laneBlockToTop(lane, laneSpan),
            lane,
            laneSpan,
            duration,
          },
        ]
      })
    })
  }, [])

  const triggerDanmaku = useRef(
    throttle(() => {
      spawnDanmaku()
    }, TRIGGER_THROTTLE_MS)
  ).current

  const removeDanmaku = useCallback((id: number) => {
    startTransition(() => {
      setDanmakuItems((prev) => prev.filter((item) => item.id !== id))
    })
  }, [])

  useEffect(() => {
    danmakuTriggerRef.current = triggerDanmaku
    return () => {
      danmakuTriggerRef.current = () => {}
    }
  }, [triggerDanmaku])

  return <Danmaku items={danmakuItems} onComplete={removeDanmaku} />
}

// 珍珠装饰组件
function Pearl({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay, ease: "easeOut" }}
      className={className}
    >
      <div className="relative h-full w-full">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[oklch(0.96_0.02_80)] via-[oklch(0.92_0.05_350)] to-[oklch(0.9_0.04_250)] opacity-80 blur-sm" />
        <div className="relative h-full w-full rounded-full bg-gradient-to-br from-white via-[oklch(0.92_0.05_350/0.5)] to-[oklch(0.9_0.04_250/0.5)] shadow-lg">
          <div className="absolute left-[20%] top-[15%] h-[30%] w-[25%] rounded-full bg-white/80 blur-[1px]" />
        </div>
      </div>
    </motion.div>
  )
}

// 贝壳装饰组件
function Shell({ className, variant = 1 }: { className?: string; variant?: 1 | 2 | 3 }) {
  const shells = {
    1: (
      <svg viewBox="0 0 100 80" className="h-full w-full">
        <defs>
          <linearGradient id="shellGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5f0e8" />
            <stop offset="50%" stopColor="#f0e4eb" />
            <stop offset="100%" stopColor="#e8e0f0" />
          </linearGradient>
        </defs>
        <path
          d="M50 75 Q10 60 5 30 Q10 10 50 5 Q90 10 95 30 Q90 60 50 75"
          fill="url(#shellGrad1)"
          opacity="0.9"
        />
        {[...Array(7)].map((_, i) => (
          <path
            key={i}
            d={`M50 75 Q${20 + i * 10} ${50 - i * 3} ${15 + i * 10} ${20 + i * 2}`}
            fill="none"
            stroke="#d8d0e0"
            strokeWidth="1.2"
            opacity="0.6"
          />
        ))}
      </svg>
    ),
    2: (
      <svg viewBox="0 0 80 100" className="h-full w-full">
        <defs>
          <linearGradient id="shellGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e8e4f0" />
            <stop offset="50%" stopColor="#f5f0e8" />
            <stop offset="100%" stopColor="#f0e4eb" />
          </linearGradient>
        </defs>
        <ellipse cx="40" cy="50" rx="35" ry="45" fill="url(#shellGrad2)" opacity="0.85" />
        <ellipse cx="40" cy="50" rx="25" ry="35" fill="none" stroke="#d8d0e0" strokeWidth="1.2" opacity="0.5" />
        <ellipse cx="40" cy="50" rx="15" ry="22" fill="none" stroke="#d8d0e0" strokeWidth="1" opacity="0.4" />
        <ellipse cx="40" cy="50" rx="6" ry="10" fill="none" stroke="#d8d0e0" strokeWidth="0.8" opacity="0.3" />
      </svg>
    ),
    3: (
      <svg viewBox="0 0 100 60" className="h-full w-full">
        <defs>
          <linearGradient id="shellGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0e4eb" />
            <stop offset="50%" stopColor="#f5f0e8" />
            <stop offset="100%" stopColor="#e8e4f0" />
          </linearGradient>
        </defs>
        <path
          d="M5 55 Q5 25 50 5 Q95 25 95 55 Z"
          fill="url(#shellGrad3)"
          opacity="0.85"
        />
        {[...Array(9)].map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="5"
            x2={10 + i * 10}
            y2="55"
            stroke="#d8d0e0"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}
      </svg>
    ),
  }

  return <div className={className}>{shells[variant]}</div>
}

// 装饰元素组件
function Decorations() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* 珍珠装饰 - 移动端隐藏部分，减少视觉干扰 */}
      <Pearl className="absolute left-[5%] top-[10%] h-6 w-6 animate-float opacity-50 md:h-8 md:w-8 md:opacity-60" delay={0.2} />
      <Pearl className="absolute right-[8%] top-[15%] hidden h-12 w-12 animate-float-delayed opacity-70 sm:block" delay={0.4} />
      <Pearl className="absolute bottom-[20%] left-[10%] hidden h-10 w-10 animate-float-slow opacity-50 md:block" delay={0.6} />
      <Pearl className="absolute bottom-[15%] right-[5%] h-5 w-5 animate-float opacity-50 md:h-6 md:w-6 md:opacity-60" delay={0.8} />
      <Pearl className="absolute left-[3%] top-[40%] hidden h-5 w-5 animate-float-delayed opacity-40 lg:block" delay={1} />
      <Pearl className="absolute right-[4%] top-[60%] hidden h-7 w-7 animate-float-slow opacity-50 lg:block" delay={1.2} />
      
      {/* 贝壳装饰 - 移动端缩小并调整位置 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.4, y: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="absolute bottom-[3%] left-[3%] h-12 w-14 rotate-[-15deg] animate-float-slow sm:bottom-[5%] sm:left-[8%] sm:h-16 sm:w-20 md:h-20 md:w-24 md:opacity-50"
      >
        <Shell variant={1} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.35, y: 0 }}
        transition={{ duration: 1.5, delay: 0.8 }}
        className="absolute right-[5%] top-[5%] h-10 w-9 rotate-[20deg] animate-float-delayed sm:right-[12%] sm:top-[8%] sm:h-12 sm:w-10 md:h-16 md:w-14 md:opacity-45"
      >
        <Shell variant={2} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.3, y: 0 }}
        transition={{ duration: 1.5, delay: 1.1 }}
        className="absolute bottom-[25%] right-[3%] hidden h-14 w-20 rotate-[10deg] animate-float sm:block md:right-[10%] md:opacity-40"
      >
        <Shell variant={3} />
      </motion.div>
    </div>
  )
}

export default function ThankYouLetter() {
  return (
    <div className="oil-painting-texture relative min-h-screen">
      {/* 弹幕层：独立组件，点击不会触发正文重渲染，也不请求服务器 */}
      <DanmakuOverlay />

      {/* 背景渐变层 */}
      <div className="fixed inset-0 bg-gradient-to-br from-[oklch(0.92_0.05_350/0.2)] via-background to-[oklch(0.9_0.04_250/0.2)]" />
      
      {/* 装饰元素 */}
      <Decorations />

      {/* 主内容 */}
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 md:py-20">
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="pearl-shimmer rounded-xl border border-[oklch(0.96_0.02_80/0.5)] bg-card/80 p-5 shadow-xl backdrop-blur-sm sm:rounded-2xl sm:p-8 md:p-12 lg:p-16"
        >
          {/* 标题 */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-6 text-center sm:mb-10"
          >
            <h1 className="mb-3 text-xl font-semibold tracking-wide text-primary sm:mb-4 sm:text-2xl md:text-3xl">
              致因爱创作的你们
            </h1>
            <div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-primary/50 to-transparent sm:w-24" />
          </motion.header>

          {/* 正文内容 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="space-y-4 text-[15px] leading-relaxed text-foreground/90 sm:space-y-6 sm:text-base sm:leading-relaxed md:text-lg md:leading-loose"
          >
            <p className="text-muted-foreground">
              这份感谢，酝酿了很久。因为不知道怎么表达，才能配得上你们这份沉甸甸的心意。
            </p>

            <p>
              你们为珍珠生的捐款，一笔一笔，汇聚在一起，最终的数字是：
              <span className="mx-1 font-semibold text-primary">959828.15元</span>
              ，我将另捐<span className="font-medium">171.85元</span>，凑足
              <span className="font-semibold text-primary">960000</span>，至此可支持
              <span className="mx-1 inline-block rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary">
                128名
              </span>
              珍珠生整整三年的读书时光。
            </p>

            <p>
              128个孩子，三年的生活费。这意味着他们不用在初中毕业那年，早早地收拾行李出门打工；意味着他们可以在课堂上安心地解一道数学题，在晚自习时读一首诗，在宿舍的灯光下，和同学聊聊未来。
            </p>

            <p>
              你们给了他们最珍贵的东西：时间。一段可以慢慢长大、慢慢思考"我想成为什么样的人"的时间。
            </p>

            <p>
              这128个孩子，会在未来的某一天，走出大山，走进大学，走向更远的地方。他们会成为医生、老师、工程师，或者只是某个城市里一个努力生活的普通人。但无论走到哪里，他们都会记得，在人生最关键的那三年，有一群素未谋面的陌生人，托住了他们的梦。
            </p>

            <p className="font-medium text-foreground">
              你们有个共同的名字，我们记下了。
            </p>

            {/* 致敬语 */}
            <div className="my-6 space-y-1 text-center sm:my-8">
              <button
                type="button"
                onClick={() => danmakuTriggerRef.current()}
                className="text-base font-medium tracking-widest text-primary/80 transition-all duration-300 hover:scale-105 hover:text-primary active:scale-95 sm:text-lg"
              >
                敬自由，敬创作。
              </button>
            </div>

            <p className="text-muted-foreground">
              愿你们永远自由，永远热爱创作，永远相信善意有回响。
            </p>
          </motion.div>

          {/* 落款 */}
          <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-8 space-y-3 text-right sm:mt-12 sm:space-y-4"
          >
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground sm:text-base">此致</p>
              <p className="text-sm text-muted-foreground sm:text-base">敬礼</p>
            </div>
            <div className="mt-4 space-y-1 sm:mt-6">
              <p className="text-sm font-medium text-foreground sm:text-base">一间属于自己的房间</p>
              <p className="text-xs text-muted-foreground sm:text-sm">2026年6月</p>
            </div>
          </motion.footer>
        </motion.article>

        {/* 底部装饰文字 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-8 text-center text-xs tracking-widest text-muted-foreground sm:mt-12 sm:text-sm"
        >
          ✦ 心火不熄，创作不死 ✦
        </motion.p>
      </main>
    </div>
  )
}
