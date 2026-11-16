/**
 * canvas 运行环境工具：移动端防崩溃
 * - DPR 钳制 + 像素预算（防高分屏内存爆炸）
 * - 智能 RAF 循环（离屏 / 切后台自动暂停）
 * - roundRect 兼容兜底（旧浏览器每帧抛错会拖垮页面）
 * - 卸载释放显存
 */

// roundRect 兼容：旧版 Safari/Android WebView 缺失该方法
if (
  typeof CanvasRenderingContext2D !== 'undefined' &&
  typeof CanvasRenderingContext2D.prototype.roundRect !== 'function'
) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    this: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number | number[] = 0
  ) {
    const radii = Array.isArray(r) ? r : [r, r, r, r]
    const [tl, tr, br, bl] = radii.length === 1 ? [radii[0], radii[0], radii[0], radii[0]]
      : radii.length === 2 ? [radii[0], radii[1], radii[0], radii[1]]
      : radii.length === 3 ? [radii[0], radii[1], radii[2], radii[1]]
      : [radii[0], radii[1], radii[2], radii[3]]
    this.moveTo(x + tl, y)
    this.lineTo(x + w - tr, y)
    this.arcTo(x + w, y, x + w, y + tr, tr)
    this.lineTo(x + w, y + h - br)
    this.arcTo(x + w, y + h, x + w - br, y + h, br)
    this.lineTo(x + bl, y + h)
    this.arcTo(x, y + h, x, y + h - bl, bl)
    this.lineTo(x, y + tl)
    this.arcTo(x, y, x + tl, y, tl)
    this.closePath()
    return this
  } as CanvasRenderingContext2D['roundRect']
}

/** 画布像素预算：单画布解码后内存不超过约 4MB（2M 像素） */
const MAX_PIXELS = 2_000_000
/** DPR 上限：3x 屏按 2x 渲染，肉眼几乎无差、内存省 55% */
const MAX_DPR = 2

export interface CanvasEnv {
  ctx: CanvasRenderingContext2D
  W: number
  H: number
  dpr: number
  compact: boolean
}

/**
 * 建立画布绘图环境（替换散落各处的 DPR 设置代码）。
 * baseHeight 传函数可按宽度自适应高度：(W, compact) => number
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  baseHeight: number | ((w: number, compact: boolean) => number)
): CanvasEnv | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const W = canvas.clientWidth
  const compact = W < 560
  const H = typeof baseHeight === 'function' ? baseHeight(W, compact) : baseHeight

  // DPR 钳制 + 总像素预算钳制
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  let scale = dpr
  if (W * H * scale * scale > MAX_PIXELS) {
    scale = Math.sqrt(MAX_PIXELS / (W * H))
  }

  canvas.width = Math.max(1, Math.round(W * scale))
  canvas.height = Math.max(1, Math.round(H * scale))
  canvas.style.height = `${H}px`
  ctx.setTransform(scale, 0, 0, scale, 0, 0)

  return { ctx, W, H, dpr: scale, compact }
}

/** 释放画布显存（卸载时调用，移动端 GPU 内存紧张时很关键） */
export function releaseCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return
  canvas.width = 1
  canvas.height = 1
}

/**
 * 智能动画循环：
 * - 页面隐藏（切后台）自动暂停
 * - 画布离屏自动暂停
 * - 返回清理函数（停止循环 + 释放显存）
 */
export function startLoop(canvas: HTMLCanvasElement, draw: () => void): () => void {
  let raf = 0
  let stopped = false
  let inView = true

  const tick = () => {
    if (stopped) return
    if (!document.hidden && inView) draw()
    raf = requestAnimationFrame(tick)
  }

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf)
      raf = 0
    } else if (!raf && !stopped) {
      raf = requestAnimationFrame(tick)
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  const io =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting
        })
      : null
  io?.observe(canvas)

  raf = requestAnimationFrame(tick)

  return () => {
    stopped = true
    cancelAnimationFrame(raf)
    document.removeEventListener('visibilitychange', onVisibility)
    io?.disconnect()
    releaseCanvas(canvas)
  }
}
