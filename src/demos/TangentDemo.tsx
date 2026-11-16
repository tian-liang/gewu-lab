import { useEffect, useRef, useState } from 'react'
import { setupCanvas } from './canvas-env'

/** 圆的切线性质：拖动圆外一点，观察切线与切线长 */
export default function TangentDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [px, setPx] = useState(320) // 点 P 的 x
  const [py, setPy] = useState(90) // 点 P 的 y
  const [r] = useState(100)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const env = setupCanvas(canvas, (w) => (w < 560 ? 500 : 400))
    if (!env) return
    const { ctx, W, H, compact } = env

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const cx = compact ? W * 0.5 : W * 0.38
    const cy = compact ? H * 0.42 : H * 0.58

    // 圆
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 2
    ctx.fillStyle = 'rgba(15,118,110,0.05)'
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 圆心
    ctx.fillStyle = '#0f766e'
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.fillText('O', cx - 16, cy - 8)

    // 点 P
    const dist = Math.hypot(px - cx, py - cy)
    const inside = dist <= r
    ctx.fillStyle = inside ? '#dc2626' : '#2563eb'
    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillText('P', px + 10, py - 8)

    if (!inside && dist > 0) {
      // 切线长 = √(d² - r²)
      const tangentLen = Math.sqrt(dist * dist - r * r)
      // 切点：OP 与圆的交点旋转 ±θ，其中 cos θ = r/d
      const angle = Math.atan2(py - cy, px - cx)
      const theta = Math.acos(Math.min(1, r / dist))

      for (const sign of [1, -1] as const) {
        const tangentAngle = angle + sign * theta
        const tx = cx + r * Math.cos(tangentAngle)
        const ty = cy + r * Math.sin(tangentAngle)

        // 切线段
        ctx.strokeStyle = '#d97706'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(tx, ty)
        ctx.stroke()

        // 切点
        ctx.fillStyle = '#d97706'
        ctx.beginPath()
        ctx.arc(tx, ty, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = '11px "JetBrains Mono", monospace'
        ctx.fillText(sign === 1 ? 'A' : 'B', tx + 8, ty + (sign === 1 ? -6 : 14))

        // 半径（虚线）
        ctx.strokeStyle = 'rgba(15,118,110,0.5)'
        ctx.setLineDash([4, 3])
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(tx, ty)
        ctx.stroke()
        ctx.setLineDash([])

        // 直角标记：半径 ⊥ 切线
        const rmAngle = Math.atan2(ty - cy, tx - cx)
        const tgAngle = Math.atan2(py - ty, px - tx)
        const sq = 10
        const sx = tx + sq * Math.cos(rmAngle)
        const sy = ty + sq * Math.sin(rmAngle)
        const ex = tx + sq * Math.cos(tgAngle)
        const ey = ty + sq * Math.sin(tgAngle)
        ctx.strokeStyle = '#d97706'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(tx + sq * Math.cos(rmAngle) + sq * Math.cos(tgAngle), ty + sq * Math.sin(rmAngle) + sq * Math.sin(tgAngle))
        ctx.lineTo(ex, ey)
        ctx.stroke()
      }

      // 连接 OP
      ctx.strokeStyle = 'rgba(37,99,235,0.4)'
      ctx.setLineDash([3, 3])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(px, py)
      ctx.stroke()
      ctx.setLineDash([])

      // 数值面板
      const panelX = compact ? 20 : W * 0.68
      const panelY = compact ? H * 0.68 : 60
      ctx.fillStyle = '#1a2332'
      ctx.font = '600 13px -apple-system, "PingFang SC", sans-serif'
      ctx.fillText('切线性质', panelX, panelY)
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillStyle = '#d97706'
      ctx.fillText(`切线长 PA = PB = ${tangentLen.toFixed(1)}`, panelX, panelY + 32)
      ctx.fillStyle = '#0f766e'
      ctx.fillText(`半径 r = ${r}`, panelX, panelY + 58)
      ctx.fillStyle = '#2563eb'
      ctx.fillText(`OP = ${dist.toFixed(1)}`, panelX, panelY + 84)
      ctx.fillStyle = '#8b95a5'
      ctx.fillText(`PA² + r² = OP²`, panelX, panelY + 116)
      ctx.fillText(`${(tangentLen * tangentLen).toFixed(0)} + ${r * r} = ${(dist * dist).toFixed(0)}`, panelX, panelY + 138)
    } else if (inside) {
      ctx.fillStyle = '#dc2626'
      ctx.font = '13px -apple-system, "PingFang SC", sans-serif'
      ctx.fillText('点 P 在圆内，无法作切线', compact ? 20 : W * 0.62, compact ? H * 0.7 : 100)
    }

    // 说明
    ctx.fillStyle = '#8b95a5'
    ctx.font = '11px -apple-system, "PingFang SC", sans-serif'
    ctx.fillText('拖动点 P 观察：切线长 PA = PB，且半径 ⊥ 切线', 20, H - 16)
  }, [px, py, r])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 400 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>P 横坐标</label>
          <input type="range" min={40} max={560} step={2} value={px} onChange={(e) => setPx(Number(e.target.value))} />
          <span className="slider-val">{px}</span>
        </div>
        <div className="slider-row">
          <label>P 纵坐标</label>
          <input type="range" min={20} max={380} step={2} value={py} onChange={(e) => setPy(Number(e.target.value))} />
          <span className="slider-val">{py}</span>
        </div>
        <div className="lab-note">
          圆外一点 P 可引两条切线，<strong>切线长相等</strong>（PA = PB）；切点处<strong>半径与切线垂直</strong>。
          直角三角形 OAP 中满足勾股定理：PA² + r² = OP²。
        </div>
      </div>
    </div>
  )
}
