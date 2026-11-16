import { useEffect, useRef, useState } from 'react'
import { setupCanvas } from './canvas-env'

/** 光的反射与折射：入射角滑杆，界面两侧介质 */
export default function OpticsDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [incAngle, setIncAngle] = useState(40)
  const [n1, setN1] = useState(1)
  const [n2, setN2] = useState(1.5)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const env = setupCanvas(canvas, 380)
    if (!env) return
    const { ctx, W, H } = env

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const ix = W * 0.5
    const iy = H * 0.5

    // 介质分区
    ctx.fillStyle = 'rgba(37,99,235,0.05)'
    ctx.fillRect(0, 0, W, iy)
    ctx.fillStyle = 'rgba(15,118,110,0.07)'
    ctx.fillRect(0, iy, W, H - iy)

    // 界面
    ctx.strokeStyle = '#1a2332'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(0, iy); ctx.lineTo(W, iy); ctx.stroke()

    // 法线
    ctx.strokeStyle = '#8b95a5'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 4])
    ctx.beginPath(); ctx.moveTo(ix, 20); ctx.lineTo(ix, H - 20); ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#8b95a5'
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('法线', ix + 8, 32)
    ctx.fillText('介质 1', 40, 40)
    ctx.fillText('介质 2', 40, H - 24)
    ctx.fillText(`n₁=${n1.toFixed(2)}`, 40, 58)
    ctx.fillText(`n₂=${n2.toFixed(2)}`, 40, H - 6)

    const rad = (incAngle * Math.PI) / 180

    // 入射光
    const inLen = 180
    const inX = ix - inLen * Math.sin(rad)
    const inY = iy - inLen * Math.cos(rad)
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(inX, inY); ctx.lineTo(ix, iy); ctx.stroke()
    // 箭头
    ctx.save()
    ctx.translate(ix, iy)
    ctx.rotate(Math.atan2(iy - inY, ix - inX))
    ctx.fillStyle = '#2563eb'
    ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(0, 0); ctx.lineTo(-12, 5); ctx.fill()
    ctx.restore()

    // 反射光
    const refX = ix + inLen * Math.sin(rad)
    const refY = iy - inLen * Math.cos(rad)
    ctx.strokeStyle = '#d97706'
    ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(refX, refY); ctx.stroke()
    ctx.save()
    ctx.translate(refX, refY)
    ctx.rotate(Math.atan2(refY - iy, refX - ix))
    ctx.fillStyle = '#d97706'
    ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(0, 0); ctx.lineTo(-12, 5); ctx.fill()
    ctx.restore()

    // 折射光：n1 sin θ1 = n2 sin θ2
    const sin2 = (n1 / n2) * Math.sin(rad)
    if (Math.abs(sin2) <= 1) {
      const rad2 = Math.asin(sin2)
      const reX = ix + inLen * Math.sin(rad2)
      const reY = iy + inLen * Math.cos(rad2)
      ctx.strokeStyle = '#059669'
      ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(reX, reY); ctx.stroke()
      ctx.save()
      ctx.translate(reX, reY)
      ctx.rotate(Math.atan2(reY - iy, reX - ix))
      ctx.fillStyle = '#059669'
      ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(0, 0); ctx.lineTo(-12, 5); ctx.fill()
      ctx.restore()

      // 角度标注
      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(ix, iy, 36, -Math.PI / 2 - rad, -Math.PI / 2); ctx.stroke()
      ctx.fillStyle = '#2563eb'
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillText(`θ₁=${incAngle}°`, ix - 88, iy - 56)

      ctx.strokeStyle = '#059669'
      ctx.beginPath(); ctx.arc(ix, iy, 36, Math.PI / 2 - rad2, Math.PI / 2); ctx.stroke()
      ctx.fillStyle = '#059669'
      const deg2 = ((rad2 * 180) / Math.PI).toFixed(1)
      ctx.fillText(`θ₂=${deg2}°`, ix + 44, iy + 56)

      ctx.fillStyle = '#8b95a5'
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillText(`n₁sinθ₁=${(n1 * Math.sin(rad)).toFixed(3)} = n₂sinθ₂`, ix - 110, H - 16)
    } else {
      // 全反射
      ctx.fillStyle = '#dc2626'
      ctx.font = '14px -apple-system, "PingFang SC", sans-serif'
      ctx.fillText('发生全反射——折射光消失！', ix - 110, iy + 60)
    }
  }, [incAngle, n1, n2])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 380 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>入射角</label>
          <input type="range" min={5} max={85} step={1} value={incAngle} onChange={(e) => setIncAngle(Number(e.target.value))} />
          <span className="slider-val">{incAngle}°</span>
        </div>
        <div className="slider-row">
          <label>n₁</label>
          <input type="range" min={1} max={2.4} step={0.05} value={n1} onChange={(e) => setN1(Number(e.target.value))} />
          <span className="slider-val">{n1.toFixed(2)}</span>
        </div>
        <div className="slider-row">
          <label>n₂</label>
          <input type="range" min={1} max={2.4} step={0.05} value={n2} onChange={(e) => setN2(Number(e.target.value))} />
          <span className="slider-val">{n2.toFixed(2)}</span>
        </div>
        <div className="lab-note">
          反射角始终等于入射角；折射角由 n₁sinθ₁ = n₂sinθ₂ 决定。
          当光从光密介质射向光疏介质（n₁ &gt; n₂）且入射角足够大时，会发生<strong>全反射</strong>。
        </div>
      </div>
    </div>
  )
}
