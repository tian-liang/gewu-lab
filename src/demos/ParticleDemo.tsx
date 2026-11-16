import { useEffect, useRef, useState } from 'react'
import { fitText } from './canvas-text'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  homeX: number
  homeY: number
}

/** 微观粒子运动：温度 → 分子平均动能 */
export default function ParticleDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [temp, setTemp] = useState(30)
  const particlesRef = useRef<Particle[]>([])
  const sizeRef = useRef({ w: 640, h: 400 })
  const tempRef = useRef(temp)
  tempRef.current = temp

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = W < 560 ? 360 : 400
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.height = `${H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // 粒子按当前画布尺寸生成/重排（修复硬编码坐标导致的移动端越界）
    const cols = W < 560 ? 8 : 12
    const rows = W < 560 ? 5 : 7
    const padX = W * 0.14
    const padY = 56
    const arrange = (list: Particle[]) => {
      const total = cols * rows
      for (let i = 0; i < total; i++) {
        const r = Math.floor(i / cols)
        const c = i % cols
        const x = padX + c * ((W - padX * 2) / (cols - 1))
        const y = padY + r * ((H - padY * 2) / (rows - 1))
        if (!list[i]) {
          list[i] = {
            x,
            y,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: 7,
            homeX: x,
            homeY: y,
          }
        } else {
          // 重排锚点（保持当前速度）
          list[i].homeX = x
          list[i].homeY = y
          list[i].x = x
          list[i].y = y
        }
      }
      list.length = total
    }
    arrange(particlesRef.current)
    sizeRef.current = { w: W, h: H }

    let raf = 0

    const draw = () => {
      const T = tempRef.current
      const speed = 0.3 + (T / 100) * 4.2
      const cohesion = Math.max(0, 1 - T / 45)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)

      // 容器
      ctx.strokeStyle = '#e4dfd7'
      ctx.lineWidth = 2
      ctx.roundRect(24, 36, W - 48, H - 68, 12)
      ctx.stroke()

      // 物态标签
      let phase = '气态'
      let phaseColor = '#dc2626'
      if (T < 25) {
        phase = '固态'
        phaseColor = '#2563eb'
      } else if (T < 60) {
        phase = '液态'
        phaseColor = '#0f766e'
      }
      ctx.fillStyle = phaseColor
      fitText(ctx, `当前物态：${phase}`, 16, 22, W * 0.42, '600 15px -apple-system, "PingFang SC", sans-serif')
      ctx.fillStyle = '#8b95a5'
      fitText(
        ctx,
        `T = ${T} · 动能 ${T}%`,
        W * 0.44,
        22,
        W * 0.54,
        '12px "JetBrains Mono", monospace'
      )

      const parts = particlesRef.current
      const pad = 48

      for (const p of parts) {
        if (cohesion > 0) {
          p.vx += (p.homeX - p.x) * 0.008 * cohesion
          p.vy += (p.homeY - p.y) * 0.008 * cohesion
        }

        p.vx += (Math.random() - 0.5) * 0.25 * speed * 0.25
        p.vy += (Math.random() - 0.5) * 0.25 * speed * 0.25

        p.vx *= 0.96
        p.vy *= 0.96

        const maxV = speed
        const v = Math.hypot(p.vx, p.vy)
        if (v > maxV) {
          p.vx = (p.vx / v) * maxV
          p.vy = (p.vy / v) * maxV
        }

        p.x += p.vx
        p.y += p.vy

        if (p.x < pad) {
          p.x = pad
          p.vx *= -0.9
        }
        if (p.x > W - pad) {
          p.x = W - pad
          p.vx *= -0.9
        }
        if (p.y < pad) {
          p.y = pad
          p.vy *= -0.9
        }
        if (p.y > H - pad) {
          p.y = H - pad
          p.vy *= -0.9
        }

        const glow = Math.min(1, v / maxV)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(15, 118, 110, ${0.25 + glow * 0.55})`
        ctx.fill()
        ctx.strokeStyle = '#0f766e'
        ctx.lineWidth = 1
        ctx.stroke()

        if (v > 1) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4)
          ctx.strokeStyle = `rgba(15, 118, 110, ${Math.min(0.5, (v / maxV) * 0.5)})`
          ctx.stroke()
        }
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>温度 T</label>
          <input type="range" min={0} max={100} step={1} value={temp} onChange={(e) => setTemp(Number(e.target.value))} />
          <span className="slider-val">{temp}</span>
        </div>
        <div className="lab-note">
          你在调什么：<strong>温度</strong>是分子平均动能的标志。温度低，分子只在平衡位置附近振动（固态）；
          温度升高，分子挣脱束缚开始流动（液态）；温度很高，分子自由飞奔充满容器（气态）。
          观察粒子的轨迹短线——温度越高，跑得越快。
        </div>
        <div className="tag-list" style={{ marginTop: 14 }}>
          <span className="chip chip-math">T &lt; 25　固态 · 振动</span>
          <span className="chip chip-chemistry">25 ≤ T &lt; 60　液态 · 流动</span>
          <span className="chip chip-bad">T ≥ 60　气态 · 自由</span>
        </div>
      </div>
    </div>
  )
}
