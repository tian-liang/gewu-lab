import { useEffect, useRef, useState } from 'react'
import { fitText } from './canvas-text'
import { setupCanvas, startLoop } from './canvas-env'

/** 电磁感应：磁铁穿过线圈，观察感应电流 */
export default function InductionDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [magnetX, setMagnetX] = useState(120)
  const [speed, setSpeed] = useState(2)
  const [mode, setMode] = useState<'manual' | 'auto'>('auto')
  const magnetRef = useRef({ x: 120, dir: 1 })
  const modeRef = useRef(mode)
  const speedRef = useRef(speed)
  modeRef.current = mode
  speedRef.current = speed

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const env = setupCanvas(canvas, 380)
    if (!env) return
    const { ctx, W, H } = env

    const draw = () => {
      if (modeRef.current === 'auto') {
        magnetRef.current.x += speedRef.current * magnetRef.current.dir
        if (magnetRef.current.x > W - 120) magnetRef.current.dir = -1
        if (magnetRef.current.x < 120) magnetRef.current.dir = 1
      } else {
        magnetRef.current.x = magnetX
      }
      const mx = magnetRef.current.x
      const coilX = W / 2
      const coilW = 110
      const cy = H / 2

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)

      // 线圈（多个圆环）
      ctx.strokeStyle = '#b45309'
      ctx.lineWidth = 2
      for (let i = 0; i < 6; i++) {
        const x = coilX - coilW / 2 + (i * coilW) / 5
        ctx.beginPath()
        ctx.ellipse(x, cy, 14, 62, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // 磁铁
      const magW = 72
      const magH = 36
      // N 极（红）S 极（蓝）
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(mx - magW, cy - magH / 2, magW, magH)
      ctx.fillStyle = '#2563eb'
      ctx.fillRect(mx, cy - magH / 2, magW, magH)
      ctx.fillStyle = '#ffffff'
      ctx.font = '600 16px "Fraunces", Georgia, serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('N', mx - magW / 2, cy)
      ctx.fillText('S', mx + magW / 2, cy)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'

      // 感应电流判断：磁铁相对线圈的位置变化
      const dist = mx - coilX
      const relSpeed = modeRef.current === 'auto' ? speedRef.current * magnetRef.current.dir : 0
      // 简化：按位置和运动方向给电流方向
      let currentDir = 0
      if (modeRef.current === 'auto') {
        if (Math.abs(dist) < 130) {
          currentDir = magnetRef.current.dir * (dist > 0 ? 1 : -1)
        }
      } else {
        // 手动：依据位置梯度近似
        currentDir = dist > 0 ? -1 : 1
        if (Math.abs(dist) < 20) currentDir = 0
      }

      // 灵敏电流计
      const gx = coilX
      const gy = cy + 118
      ctx.strokeStyle = '#1a2332'
      ctx.lineWidth = 1.5
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.arc(gx, gy, 30, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // 指针偏转
      const deflection = currentDir * 0.55
      ctx.strokeStyle = currentDir !== 0 ? '#dc2626' : '#94a3b8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(gx, gy)
      ctx.lineTo(gx + 22 * Math.sin(deflection), gy - 22 * Math.cos(deflection))
      ctx.stroke()
      ctx.fillStyle = '#8b95a5'
      ctx.font = '11px -apple-system, "PingFang SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('灵敏电流计', gx, gy + 48)
      ctx.textAlign = 'start'

      // 电流箭头（线圈旁）
      if (currentDir !== 0) {
        ctx.fillStyle = '#dc2626'
        ctx.font = '12px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText(currentDir > 0 ? '感应电流 ↻' : '感应电流 ↺', coilX, cy - 90)
        ctx.textAlign = 'start'
      } else {
        ctx.fillStyle = '#8b95a5'
        ctx.font = '12px -apple-system, "PingFang SC", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(mode === 'auto' ? '磁铁静止或远离线圈 → 无电流' : '磁铁静止 → 无电流', coilX, cy - 90)
        ctx.textAlign = 'start'
      }

      // 状态说明
      ctx.fillStyle = '#1a2332'
      ctx.font = '600 14px -apple-system, "PingFang SC", sans-serif'
      fitText(
        ctx,
        modeRef.current === 'auto' ? '磁铁自动往复运动' : `磁铁位置：${(mx - coilX).toFixed(0)}（相对线圈）`,
        20,
        34,
        W - 40,
        '600 14px -apple-system, "PingFang SC", sans-serif'
      )
      ctx.fillStyle = '#8b95a5'
      ctx.font = '12px -apple-system, "PingFang SC", sans-serif'
      fitText(
        ctx,
        '闭合电路的一部分导体在磁场中做切割磁感线运动 → 产生感应电流',
        20,
        56,
        W - 40,
        '12px -apple-system, "PingFang SC", sans-serif'
      )
    }

    return startLoop(canvas, draw)
  }, [magnetX])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 380 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="filter-row" style={{ marginBottom: 8 }}>
          <button className={`filter-chip ${mode === 'auto' ? 'active' : ''}`} onClick={() => setMode('auto')}>
            自动往复
          </button>
          <button className={`filter-chip ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
            手动拖动
          </button>
        </div>
        {mode === 'manual' ? (
          <div className="slider-row">
            <label>磁铁位置</label>
            <input type="range" min={60} max={560} step={2} value={magnetX} onChange={(e) => setMagnetX(Number(e.target.value))} />
            <span className="slider-val">{magnetX}</span>
          </div>
        ) : (
          <div className="slider-row">
            <label>运动速度</label>
            <input type="range" min={0.5} max={6} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            <span className="slider-val">{speed}</span>
          </div>
        )}
        <div className="lab-note">
          <strong>电磁感应</strong>：磁铁运动时线圈中产生电流，磁铁停止电流就消失。
          这就是发电机的原理——机械能转化为电能。速度越快，感应电流越大。
        </div>
      </div>
    </div>
  )
}
