import { useEffect, useRef, useState } from 'react'
import { fitText } from './canvas-text'

/**
 * 勾股定理：直角三角形三边平方可视化
 * 布局：自动计算三个正方形的包围盒，整体缩放居中进画布（移动端不溢出）
 */
export default function PythagorasDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [a, setA] = useState(3)
  const [b, setB] = useState(4)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const compact = W < 560
    const H = compact ? 460 : 420
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.height = `${H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const c = Math.hypot(a, b)

    // ── 在"单位"坐标系里摆几何：直角在原点，A(0,0) B(a,0) C(0,b)
    // 三角形三边的正方形都向外（背离第三个顶点）
    const A = [0, 0] as const
    const B = [a, 0] as const
    const C = [0, b] as const

    const outwardSquare = (
      p1: readonly [number, number],
      p2: readonly [number, number],
      third: readonly [number, number]
    ) => {
      const dx = p2[0] - p1[0]
      const dy = p2[1] - p1[1]
      const len = Math.hypot(dx, dy)
      // 两个单位法向
      let nx = -dy / len
      let ny = dx / len
      // 选背离 third 顶点的那个
      const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2] as const
      const toThird = [third[0] - mid[0], third[1] - mid[1]] as const
      if (nx * toThird[0] + ny * toThird[1] > 0) {
        nx = -nx
        ny = -ny
      }
      return [
        p1,
        p2,
        [p2[0] + nx * len, p2[1] + ny * len] as const,
        [p1[0] + nx * len, p1[1] + ny * len] as const,
      ]
    }

    const sqA = outwardSquare(A, B, C) // a 边（下方）
    const sqB = outwardSquare(A, C, B) // b 边（左方）
    const sqC = outwardSquare(B, C, A) // c 边（斜向外）

    // ── 包围盒（含边长标注的余量）
    const marginUnits = 0.8
    const allPts = [A, B, C, ...sqA, ...sqB, ...sqC]
    let minX = Math.min(...allPts.map((p) => p[0])) - marginUnits
    let maxX = Math.max(...allPts.map((p) => p[0])) + marginUnits
    let minY = Math.min(...allPts.map((p) => p[1])) - marginUnits
    let maxY = Math.max(...allPts.map((p) => p[1])) + marginUnits
    // 上方留出等式空间
    const topPad = 56
    const botPad = 16
    const padX = 12

    const drawW = W - padX * 2
    const drawH = H - topPad - botPad
    const scale = Math.min(drawW / (maxX - minX), drawH / (maxY - minY))
    const ox = padX + (drawW - (maxX - minX) * scale) / 2 - minX * scale
    const oy = topPad + (drawH - (maxY - minY) * scale) / 2 - minY * scale

    const T = (p: readonly [number, number]) => [ox + p[0] * scale, oy + p[1] * scale] as const

    // ── 绘制
    const drawPoly = (pts: readonly (readonly [number, number])[], fill: string) => {
      ctx.fillStyle = fill
      ctx.strokeStyle = 'rgba(26,35,50,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      const s0 = T(pts[0])
      ctx.moveTo(s0[0], s0[1])
      for (let i = 1; i < pts.length; i++) {
        const s = T(pts[i])
        ctx.lineTo(s[0], s[1])
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    drawPoly(sqA, 'rgba(37,99,235,0.18)')
    drawPoly(sqB, 'rgba(124,58,237,0.18)')
    drawPoly(sqC, 'rgba(217,119,6,0.18)')

    // 三角形
    const tA = T(A), tB = T(B), tC = T(C)
    ctx.fillStyle = 'rgba(15,118,110,0.12)'
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(tA[0], tA[1]); ctx.lineTo(tB[0], tB[1]); ctx.lineTo(tC[0], tC[1]); ctx.closePath()
    ctx.fill(); ctx.stroke()

    // 直角标记
    const sq = 12
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(tA[0] + sq, tA[1])
    ctx.lineTo(tA[0] + sq, tA[1] - sq)
    ctx.lineTo(tA[0], tA[1] - sq)
    ctx.stroke()

    // 面积标签（画在正方形中心）
    const labelAt = (pts: readonly (readonly [number, number])[], text: string, color = '#1a2332') => {
      const cx = pts.reduce((s, p) => s + T(p)[0], 0) / pts.length
      const cy = pts.reduce((s, p) => s + T(p)[1], 0) / pts.length
      ctx.fillStyle = color
      fitText(ctx, text, cx - 24, cy + 4, 48, '600 13px "Fraunces", Georgia, serif')
    }
    labelAt(sqA, `a²=${(a * a).toFixed(0)}`)
    labelAt(sqB, `b²=${(b * b).toFixed(0)}`)
    labelAt(sqC, `c²=${(c * c).toFixed(0)}`)

    // 边长标注
    ctx.fillStyle = '#2563eb'
    ctx.font = '11px "JetBrains Mono", monospace'
    const midAB = T([(A[0] + B[0]) / 2, (A[1] + B[1]) / 2])
    fitText(ctx, `a=${a.toFixed(1)}`, midAB[0] - 22, midAB[1] + 22, 60, '11px "JetBrains Mono", monospace')
    ctx.fillStyle = '#7c3aed'
    const midAC = T([(A[0] + C[0]) / 2, (A[1] + C[1]) / 2])
    fitText(ctx, `b=${b.toFixed(1)}`, midAC[0] - 44, midAC[1] + 4, 60, '11px "JetBrains Mono", monospace')
    ctx.fillStyle = '#d97706'
    const midBC = T([(B[0] + C[0]) / 2, (B[1] + C[1]) / 2])
    fitText(ctx, `c=${c.toFixed(2)}`, midBC[0] + 8, midBC[1], 72, '11px "JetBrains Mono", monospace')

    // 等式
    ctx.fillStyle = '#1a2332'
    fitText(
      ctx,
      `${a * a} + ${b * b} = ${(a * a + b * b).toFixed(0)}　　c² = ${(c * c).toFixed(1)}`,
      16,
      32,
      W - 32,
      '600 16px "Fraunces", Georgia, serif'
    )
  }, [a, b])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>边 a</label>
          <input type="range" min={1} max={8} step={0.5} value={a} onChange={(e) => setA(Number(e.target.value))} />
          <span className="slider-val">{a.toFixed(1)}</span>
        </div>
        <div className="slider-row">
          <label>边 b</label>
          <input type="range" min={1} max={8} step={0.5} value={b} onChange={(e) => setB(Number(e.target.value))} />
          <span className="slider-val">{b.toFixed(1)}</span>
        </div>
        <div className="lab-note">
          拖动两条直角边的长度，观察三个正方形的面积变化。蓝方面积 a² 加紫方面积 b²，永远等于橙色斜边上的 c²——这就是勾股定理。
        </div>
      </div>
    </div>
  )
}
