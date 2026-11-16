import { useEffect, useRef, useState } from 'react'
import { setupCanvas } from './canvas-env'

function readParams() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''))
  const k = Number(params.get('k'))
  const b = Number(params.get('b'))
  return {
    k: Number.isFinite(k) ? k : 1.5,
    b: Number.isFinite(b) ? b : 1,
  }
}

function writeParams(k: number, b: number) {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''))
  params.set('demo', 'demo-linear')
  params.set('k', k.toFixed(1))
  params.set('b', b.toFixed(1))
  history.replaceState(null, '', `#${params.toString()}`)
}

/** 一次函数 y = kx + b 参数实验 */
export default function LinearDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const init = useRef(readParams()).current
  const [k, setK] = useState(init.k)
  const [b, setB] = useState(init.b)

  useEffect(() => {
    writeParams(k, b)
  }, [k, b])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const env = setupCanvas(canvas, 420)
    if (!env) return
    const { ctx, W, H } = env

    // 视口：数学坐标范围 x∈[-8,8], y∈[-6,6]
    const xMin = -8, xMax = 8, yMin = -6, yMax = 6
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * W
    const sy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H

    // 背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // 网格
    ctx.strokeStyle = '#f0ede8'
    ctx.lineWidth = 1
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      ctx.beginPath()
      ctx.moveTo(sx(x), 0)
      ctx.lineTo(sx(x), H)
      ctx.stroke()
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      ctx.beginPath()
      ctx.moveTo(0, sy(y))
      ctx.lineTo(W, sy(y))
      ctx.stroke()
    }

    // 坐标轴
    ctx.strokeStyle = '#1a2332'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(0, sy(0))
    ctx.lineTo(W, sy(0))
    ctx.moveTo(sx(0), 0)
    ctx.lineTo(sx(0), H)
    ctx.stroke()

    // 轴标
    ctx.fillStyle = '#8b95a5'
    ctx.font = '11px "JetBrains Mono", monospace'
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      if (x === 0) continue
      ctx.fillText(String(x), sx(x) - 4, sy(0) + 16)
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      if (y === 0) continue
      ctx.fillText(String(y), sx(0) + 8, sy(y) + 4)
    }
    ctx.fillText('x', W - 18, sy(0) - 10)
    ctx.fillText('y', sx(0) + 10, 18)

    // 直线 y = kx + b
    const yAt = (x: number) => k * x + b
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    let first = true
    for (let px = 0; px <= W; px += 2) {
      const x = xMin + (px / W) * (xMax - xMin)
      const y = yAt(x)
      if (y < yMin - 1 || y > yMax + 1) {
        first = true
        continue
      }
      if (first) {
        ctx.moveTo(px, sy(y))
        first = false
      } else {
        ctx.lineTo(px, sy(y))
      }
    }
    ctx.stroke()

    // y 轴截距点 (0, b)
    if (b >= yMin && b <= yMax) {
      ctx.fillStyle = '#0f766e'
      ctx.beginPath()
      ctx.arc(sx(0), sy(b), 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0f766e'
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillText(`(0, ${b.toFixed(1)})`, sx(0) + 10, sy(b) - 10)
    }

    // x 轴交点 (-b/k, 0)
    if (k !== 0) {
      const x0 = -b / k
      if (x0 >= xMin && x0 <= xMax) {
        ctx.fillStyle = '#d97706'
        ctx.beginPath()
        ctx.arc(sx(x0), sy(0), 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = '12px "JetBrains Mono", monospace'
        ctx.fillText(`(${x0.toFixed(1)}, 0)`, sx(x0) + 10, sy(0) + 22)
      }
    }

    // 斜率三角形
    if (Math.abs(k) > 0.2 && Math.abs(k) < 5) {
      const x1 = -2, x2 = 1
      const y1 = yAt(x1), y2 = yAt(x2)
      if (y1 > yMin && y1 < yMax && y2 > yMin && y2 < yMax) {
        ctx.strokeStyle = 'rgba(217,119,6,0.55)'
        ctx.lineWidth = 1.2
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(sx(x1), sy(y1))
        ctx.lineTo(sx(x2), sy(y1))
        ctx.lineTo(sx(x2), sy(y2))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#d97706'
        ctx.font = '11px "JetBrains Mono", monospace'
        ctx.fillText('Δx=3', (sx(x1) + sx(x2)) / 2 - 18, sy(y1) + 16)
        ctx.fillText(`Δy=${(3 * k).toFixed(1)}`, sx(x2) + 6, (sy(y1) + sy(y2)) / 2)
      }
    }
  }, [k, b])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 420 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>k 斜率</label>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.1}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
          />
          <span className="slider-val">{k.toFixed(1)}</span>
        </div>
        <div className="slider-row">
          <label>b 截距</label>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.1}
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
          />
          <span className="slider-val">{b.toFixed(1)}</span>
        </div>
        <div className="lab-note">
          你在调什么：<strong>k</strong> 控制直线的倾斜方向与陡峭程度——k &gt; 0 上坡，k &lt; 0 下坡；
          <strong>b</strong> 控制直线与 y 轴的交点位置。注意绿点（y 轴截距）和橙点（x 轴交点）怎么随参数移动。
        </div>
        <div style={{ marginTop: 14 }} className="formula-block">
          y = {k.toFixed(1)}x {b >= 0 ? '+' : '−'} {Math.abs(b).toFixed(1)}
        </div>
      </div>
    </div>
  )
}
