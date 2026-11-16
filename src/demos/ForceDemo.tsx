import { useEffect, useRef, useState } from 'react'

/** 受力分析实验室：水平面上受斜向拉力的小车 */
export default function ForceDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [F, setF] = useState(50)
  const [theta, setTheta] = useState(30)
  const [mass, setMass] = useState(5)
  const [mu, setMu] = useState(0.2)

  // 计算受力
  const g = 9.8
  const rad = (theta * Math.PI) / 180
  const Fx = F * Math.cos(rad)
  const Fy = F * Math.sin(rad)
  const G = mass * g
  const N = Math.max(0, G - Fy)
  const fMax = mu * N
  const moving = Fx > fMax
  const f = moving ? fMax : Math.min(Fx, fMax)
  const netX = Fx - f
  const a = netX / mass

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

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const cx = W * 0.42
    const groundY = H * 0.72
    const boxW = 110
    const boxH = 64

    // 地面
    ctx.strokeStyle = '#1a2332'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(40, groundY)
    ctx.lineTo(W - 40, groundY)
    ctx.stroke()

    // 地面斜线纹理
    ctx.strokeStyle = '#c5c0b8'
    ctx.lineWidth = 1
    for (let x = 40; x < W - 40; x += 14) {
      ctx.beginPath()
      ctx.moveTo(x, groundY)
      ctx.lineTo(x - 10, groundY + 12)
      ctx.stroke()
    }

    // 小车
    const bx = cx - boxW / 2
    const by = groundY - boxH
    ctx.fillStyle = '#eef2f7'
    ctx.strokeStyle = '#1a2332'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(bx, by, boxW, boxH, 6)
    ctx.fill()
    ctx.stroke()

    // 车轮
    ctx.fillStyle = '#1a2332'
    ctx.beginPath()
    ctx.arc(bx + 26, groundY, 10, 0, Math.PI * 2)
    ctx.arc(bx + boxW - 26, groundY, 10, 0, Math.PI * 2)
    ctx.fill()

    // 质量标签
    ctx.fillStyle = '#1a2332'
    ctx.font = '600 15px "Fraunces", Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText(`m = ${mass} kg`, cx, by + boxH / 2 + 5)
    ctx.textAlign = 'start'

    const arrow = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      label: string,
      labelDx = 0,
      labelDy = 0
    ) => {
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const headLen = 10
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 2.2
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - headLen * Math.cos(angle - 0.42), y2 - headLen * Math.sin(angle - 0.42))
      ctx.lineTo(x2 - headLen * Math.cos(angle + 0.42), y2 - headLen * Math.sin(angle + 0.42))
      ctx.closePath()
      ctx.fill()
      if (label) {
        ctx.font = '11px "JetBrains Mono", monospace'
        // 钳制在画布内，避免窄屏出界
        const lx = Math.max(8, Math.min(W - 80, x2 + labelDx))
        const ly = Math.max(16, Math.min(H - 12, y2 + labelDy))
        ctx.fillText(label, lx, ly)
      }
    }

    const scale = 1.5 // px per Newton
    const ax = bx + 8
    const ay = by + 10

    // 重力 G（向下）
    arrow(cx, by + boxH, cx, by + boxH + G * scale * 0.5, '#dc2626', `G=${G.toFixed(0)}N`, 8, 0)

    // 支持力 N（向上）
    arrow(cx - 40, groundY - 4, cx - 40, groundY - 4 - N * scale * 0.5, '#2563eb', `N=${N.toFixed(0)}N`, -60, 0)

    // 拉力 F（斜向右上）
    const fLen = F * scale * 0.7
    arrow(ax, ay, ax + fLen * Math.cos(rad), ay - fLen * Math.sin(rad), '#0f766e', `F=${F.toFixed(0)}N`, 4, -6)

    // 摩擦力 f（向左）
    if (f > 0.5) {
      arrow(cx + boxW / 2, groundY - 18, cx + boxW / 2 - f * scale * 0.7, groundY - 18, '#d97706', `f=${f.toFixed(0)}N`, -80, -6)
    }

    // 合力 F合（x 方向）
    if (Math.abs(netX) > 1) {
      const ny = groundY + 46
      arrow(cx, ny, cx + netX * scale * 0.8, ny, '#7c3aed', `F合=${netX.toFixed(1)}N`, 6, -8)
    }

    // 角度弧
    if (F > 5) {
      ctx.strokeStyle = '#0f766e'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(ax, ay, 30, -rad, 0)
      ctx.stroke()
      ctx.fillStyle = '#0f766e'
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillText(`${theta}°`, ax + 36, ay - 8)
    }

    // 运动提示
    ctx.fillStyle = moving ? '#16a34a' : '#8b95a5'
    ctx.font = '13px -apple-system, "PingFang SC", sans-serif'
    ctx.fillText(
      moving ? `▶ 小车加速中，a = ${a.toFixed(2)} m/s²` : '■ 小车静止（拉力不足以克服最大静摩擦）',
      40,
      36
    )
  }, [F, theta, mass, mu, Fx, f, G, N, netX, a, moving, rad])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 420 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>拉力 F</label>
          <input type="range" min={0} max={120} step={1} value={F} onChange={(e) => setF(Number(e.target.value))} />
          <span className="slider-val">{F} N</span>
        </div>
        <div className="slider-row">
          <label>角度 θ</label>
          <input type="range" min={0} max={80} step={1} value={theta} onChange={(e) => setTheta(Number(e.target.value))} />
          <span className="slider-val">{theta}°</span>
        </div>
        <div className="slider-row">
          <label>质量 m</label>
          <input type="range" min={1} max={20} step={1} value={mass} onChange={(e) => setMass(Number(e.target.value))} />
          <span className="slider-val">{mass} kg</span>
        </div>
        <div className="slider-row">
          <label>摩擦 μ</label>
          <input type="range" min={0} max={0.6} step={0.01} value={mu} onChange={(e) => setMu(Number(e.target.value))} />
          <span className="slider-val">{mu.toFixed(2)}</span>
        </div>
        <div className="lab-note">
          你在调什么：<strong>F</strong> 是拉力大小，<strong>θ</strong> 是拉力与水平方向夹角。
          拉力斜向上时会"分走"一部分重力（支持力 N 变小），摩擦力也跟着变小——这就是力的分解。
          看紫色的合力箭头：它决定小车是动还是不动。
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginTop: 14 }}>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div className="eyebrow">支持力 N</div>
            <div className="num" style={{ fontSize: 20 }}>{N.toFixed(1)} N</div>
          </div>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div className="eyebrow">摩擦力 f</div>
            <div className="num" style={{ fontSize: 20 }}>{f.toFixed(1)} N</div>
          </div>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div className="eyebrow">加速度 a</div>
            <div className="num" style={{ fontSize: 20 }}>{a.toFixed(2)} m/s²</div>
          </div>
        </div>
      </div>
    </div>
  )
}
