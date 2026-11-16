import { useEffect, useRef, useState } from 'react'

/** 二次函数 y = ax² + bx + c 图像实验 */
export default function QuadraticDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [a, setA] = useState(1)
  const [b, setB] = useState(-2)
  const [c, setC] = useState(-3)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = 420
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const xMin = -8, xMax = 8, yMin = -8, yMax = 8
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * W
    const sy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = '#f0ede8'
    ctx.lineWidth = 1
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      ctx.beginPath(); ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), H); ctx.stroke()
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      ctx.beginPath(); ctx.moveTo(0, sy(y)); ctx.lineTo(W, sy(y)); ctx.stroke()
    }

    ctx.strokeStyle = '#1a2332'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(0, sy(0)); ctx.lineTo(W, sy(0))
    ctx.moveTo(sx(0), 0); ctx.lineTo(sx(0), H)
    ctx.stroke()

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

    // 抛物线
    const yAt = (x: number) => a * x * x + b * x + c
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    let first = true
    for (let px = 0; px <= W; px += 2) {
      const x = xMin + (px / W) * (xMax - xMin)
      const y = yAt(x)
      if (y < yMin - 2 || y > yMax + 2) { first = true; continue }
      if (first) { ctx.moveTo(px, sy(y)); first = false } else ctx.lineTo(px, sy(y))
    }
    ctx.stroke()

    // 顶点与对称轴
    const vx = -b / (2 * a)
    const vy = yAt(vx)
    if (vx >= xMin && vx <= xMax && vy >= yMin && vy <= yMax) {
      ctx.strokeStyle = 'rgba(217,119,6,0.5)'
      ctx.setLineDash([5, 4])
      ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.moveTo(sx(vx), 0); ctx.lineTo(sx(vx), H); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#d97706'
      ctx.beginPath(); ctx.arc(sx(vx), sy(vy), 5, 0, Math.PI * 2); ctx.fill()
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillText(`顶点(${vx.toFixed(1)}, ${vy.toFixed(1)})`, sx(vx) + 8, sy(vy) - 8)
    }

    // 与 x 轴交点
    const disc = b * b - 4 * a * c
    if (disc >= 0 && a !== 0) {
      const x1 = (-b + Math.sqrt(disc)) / (2 * a)
      const x2 = (-b - Math.sqrt(disc)) / (2 * a)
      for (const rx of [x1, x2]) {
        if (rx >= xMin && rx <= xMax) {
          ctx.fillStyle = '#2563eb'
          ctx.beginPath(); ctx.arc(sx(rx), sy(0), 5, 0, Math.PI * 2); ctx.fill()
        }
      }
    }

    // y 轴截距
    if (c >= yMin && c <= yMax) {
      ctx.fillStyle = '#7c3aed'
      ctx.beginPath(); ctx.arc(sx(0), sy(c), 4, 0, Math.PI * 2); ctx.fill()
    }
  }, [a, b, c])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 420 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>a</label>
          <input type="range" min={-3} max={3} step={0.1} value={a} onChange={(e) => setA(Number(e.target.value) || 0.1)} />
          <span className="slider-val">{a.toFixed(1)}</span>
        </div>
        <div className="slider-row">
          <label>b</label>
          <input type="range" min={-8} max={8} step={0.1} value={b} onChange={(e) => setB(Number(e.target.value))} />
          <span className="slider-val">{b.toFixed(1)}</span>
        </div>
        <div className="slider-row">
          <label>c</label>
          <input type="range" min={-8} max={8} step={0.1} value={c} onChange={(e) => setC(Number(e.target.value))} />
          <span className="slider-val">{c.toFixed(1)}</span>
        </div>
        <div className="lab-note">
          <strong>a</strong> 控制开口方向与宽窄（a &gt; 0 开口向上）；<strong>b</strong> 影响对称轴位置；
          <strong>c</strong> 是抛物线与 y 轴的交点。观察橙色顶点、蓝色零点怎么随参数移动。
        </div>
        <div className="formula-block">
          y = {a.toFixed(1)}x² {b >= 0 ? '+' : '−'} {Math.abs(b).toFixed(1)}x {c >= 0 ? '+' : '−'} {Math.abs(c).toFixed(1)}
        </div>
      </div>
    </div>
  )
}
