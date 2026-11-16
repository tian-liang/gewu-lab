import { useEffect, useRef, useState } from 'react'
import { setupCanvas } from './canvas-env'

const ELEMENTS = [
  { symbol: 'H', name: '氢', z: 1, shells: [1] },
  { symbol: 'He', name: '氦', z: 2, shells: [2] },
  { symbol: 'Li', name: '锂', z: 3, shells: [2, 1] },
  { symbol: 'C', name: '碳', z: 6, shells: [2, 4] },
  { symbol: 'N', name: '氮', z: 7, shells: [2, 5] },
  { symbol: 'O', name: '氧', z: 8, shells: [2, 6] },
  { symbol: 'Ne', name: '氖', z: 10, shells: [2, 8] },
  { symbol: 'Na', name: '钠', z: 11, shells: [2, 8, 1] },
  { symbol: 'Mg', name: '镁', z: 12, shells: [2, 8, 2] },
  { symbol: 'Cl', name: '氯', z: 17, shells: [2, 8, 7] },
  { symbol: 'Ar', name: '氩', z: 18, shells: [2, 8, 8] },
]

/** 原子结构：电子层排布 */
export default function AtomDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [idx, setIdx] = useState(5) // 默认氧
  const el = ELEMENTS[idx]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const env = setupCanvas(canvas, 400)
    if (!env) return
    const { ctx, W, H } = env

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const cx = W * 0.5
    const cy = H * 0.5

    // 原子核
    const nR = 28
    ctx.fillStyle = 'rgba(220,38,38,0.15)'
    ctx.strokeStyle = '#dc2626'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(cx, cy, nR, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#dc2626'
    ctx.font = '600 13px "Fraunces", Georgia, serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`+${el.z}`, cx, cy - 6)
    ctx.font = '10px -apple-system, "PingFang SC", sans-serif'
    ctx.fillText('原子核', cx, cy + 12)

    // 电子层
    const maxR = Math.min(W, H) * 0.38
    el.shells.forEach((count, shellIdx) => {
      const r = 58 + shellIdx * ((maxR - 58) / Math.max(1, el.shells.length - 1) || 40)
      const rr = el.shells.length === 1 ? 90 : r

      ctx.strokeStyle = 'rgba(37,99,235,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke()

      ctx.fillStyle = '#8b95a5'
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`第 ${shellIdx + 1} 层`, cx + rr - 30, cy - rr - 8)

      // 电子
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2 + shellIdx * 0.4
        const ex = cx + rr * Math.cos(angle)
        const ey = cy + rr * Math.sin(angle)
        ctx.fillStyle = '#2563eb'
        ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = '8px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('−', ex, ey)
      }
    })

    // 元素信息
    ctx.fillStyle = '#1a2332'
    ctx.font = '600 18px "Fraunces", Georgia, serif'
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
    ctx.fillText(`${el.name} ${el.symbol}`, 28, 36)
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.fillStyle = '#8b95a5'
    ctx.fillText(`质子数 = 电子数 = ${el.z}`, 28, 58)
    ctx.fillText(`电子排布：${el.shells.join('、')}`, 28, 78)
  }, [idx, el])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 400 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <p className="eyebrow">选择元素</p>
        <div className="filter-row" style={{ marginBottom: 8 }}>
          {ELEMENTS.map((e, i) => (
            <button
              key={e.symbol}
              className={`filter-chip ${i === idx ? 'active' : ''}`}
              onClick={() => setIdx(i)}
            >
              {e.symbol} {e.name}
            </button>
          ))}
        </div>
        <div className="lab-note">
          原子由原子核（质子带正电）和核外电子（带负电）构成，质子数 = 电子数，所以原子整体不带电。
          电子按能量分层排布，第一层最多 2 个，第二层最多 8 个——观察不同元素的排布规律。
        </div>
      </div>
    </div>
  )
}
