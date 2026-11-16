import { useEffect, useRef, useState } from 'react'

/** 锐角三角函数：角度滑杆 → sin / cos / tan（含移动端紧凑布局） */
export default function TrigDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [angle, setAngle] = useState(40)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const compact = W < 560
    const H = compact ? 520 : 400
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.height = `${H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const rad = (angle * Math.PI) / 180
    const cx = compact ? W * 0.32 : W * 0.3
    const cy = compact ? H * 0.38 : H * 0.78
    const R = compact ? Math.min(W * 0.26, 120) : Math.min(W * 0.28, H * 0.52)

    const bx = cx + R * Math.cos(rad)
    const by = cy
    const ax = cx
    const ay = cy - R * Math.sin(rad)

    // 单位圆
    ctx.strokeStyle = 'rgba(15,118,110,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()

    // 三角形
    ctx.fillStyle = 'rgba(15,118,110,0.12)'
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.lineTo(ax, ay); ctx.closePath()
    ctx.fill(); ctx.stroke()

    // 直角
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 1.3
    const sq = 12
    ctx.beginPath()
    ctx.moveTo(bx - sq, by); ctx.lineTo(bx - sq, by - sq); ctx.lineTo(bx, by - sq)
    ctx.stroke()

    // 角弧
    ctx.strokeStyle = '#d97706'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(cx, cy, Math.min(32, R * 0.35), -rad, 0); ctx.stroke()
    ctx.fillStyle = '#d97706'
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.fillText(`${angle}°`, cx + 40, cy - 12)

    // 边标注（紧凑模式收短）
    ctx.font = compact ? '10px "JetBrains Mono", monospace' : '12px "JetBrains Mono", monospace'
    ctx.fillStyle = '#2563eb'
    ctx.fillText(compact ? `对=${Math.sin(rad).toFixed(2)}` : `对边 = ${Math.sin(rad).toFixed(3)}`, ax + 10, (ay + cy) / 2)
    ctx.fillStyle = '#7c3aed'
    ctx.fillText(compact ? `邻=${Math.cos(rad).toFixed(2)}` : `邻边 = ${Math.cos(rad).toFixed(3)}`, (cx + bx) / 2 - 26, by + 22)
    ctx.fillStyle = '#0f766e'
    ctx.fillText(compact ? '斜=1' : '斜边 = 1', (ax + bx) / 2 - 8, (ay + by) / 2 - 12)

    // 数值面板
    const px = compact ? 20 : W * 0.62
    const py = compact ? H * 0.56 : 60
    ctx.fillStyle = '#1a2332'
    ctx.font = '600 14px -apple-system, "PingFang SC", sans-serif'
    ctx.fillText('三角函数值', px, py - 14)

    const rows: [string, string, string][] = [
      [`sin ${angle}°`, Math.sin(rad).toFixed(4), '#2563eb'],
      [`cos ${angle}°`, Math.cos(rad).toFixed(4), '#7c3aed'],
      [`tan ${angle}°`, Math.tan(rad).toFixed(4), '#d97706'],
    ]
    if (compact) {
      // 紧凑：三行横排
      const colW = (W - 40) / 3
      rows.forEach(([label, val, color], i) => {
        const x = px + i * colW
        ctx.fillStyle = '#8b95a5'
        ctx.font = '11px "JetBrains Mono", monospace'
        ctx.fillText(label, x, py + 16)
        ctx.fillStyle = color
        ctx.font = '600 20px "Fraunces", Georgia, serif'
        ctx.fillText(val, x, py + 42)
      })
      ctx.fillStyle = '#8b95a5'
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillText(`sin²+cos² = ${(Math.sin(rad) ** 2 + Math.cos(rad) ** 2).toFixed(3)}`, px, py + 78)
    } else {
      rows.forEach(([label, val, color], i) => {
        const y = py + 30 + i * 52
        ctx.fillStyle = '#8b95a5'
        ctx.font = '12px "JetBrains Mono", monospace'
        ctx.fillText(label, px, y)
        ctx.fillStyle = color
        ctx.font = '600 26px "Fraunces", Georgia, serif'
        ctx.fillText(val, px, y + 30)
      })
      ctx.fillStyle = '#8b95a5'
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillText(`sin²+cos² = ${(Math.sin(rad) ** 2 + Math.cos(rad) ** 2).toFixed(4)}`, px, py + 210)
      ctx.fillText(`sin/cos = ${Math.tan(rad).toFixed(4)}`, px, py + 232)
    }
  }, [angle])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>角度 θ</label>
          <input type="range" min={5} max={85} step={1} value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
          <span className="slider-val">{angle}°</span>
        </div>
        <div className="lab-note">
          在直角三角形中，sin 是对比斜边、cos 是邻比斜边、tan 是对比邻边。拖动角度观察：
          角度越大，对边越长、邻边越短，sin 增大而 cos 减小。
        </div>
      </div>
    </div>
  )
}
