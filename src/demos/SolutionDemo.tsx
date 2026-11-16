import { useEffect, useRef, useState } from 'react'
import { setupCanvas } from './canvas-env'

/** 溶液配制与稀释：溶质质量分数可视化 */
export default function SolutionDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [solute, setSolute] = useState(10) // 溶质质量 g
  const [solvent, setSolvent] = useState(90) // 溶剂质量 g
  const [mode, setMode] = useState<'mix' | 'dilute'>('mix')

  const total = solute + solvent
  const percent = total > 0 ? (solute / total) * 100 : 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const env = setupCanvas(canvas, (w) => (w < 560 ? 520 : 360))
    if (!env) return
    const { ctx, W, H, compact } = env

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // 烧杯
    const bx = compact ? (W - 150) / 2 : W * 0.22
    const bw = compact ? 150 : 170
    const bt = 50
    const bb = compact ? H * 0.52 : H - 40
    ctx.strokeStyle = '#1a2332'
    ctx.lineWidth = 2.5
    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.moveTo(bx, bt)
    ctx.lineTo(bx, bb - 12)
    ctx.quadraticCurveTo(bx, bb, bx + 12, bb)
    ctx.lineTo(bx + bw - 12, bb)
    ctx.quadraticCurveTo(bx + bw, bb, bx + bw, bb - 12)
    ctx.lineTo(bx + bw, bt)
    ctx.stroke()

    // 溶液体积（视觉上按总质量映射）
    const fillH = Math.min(bb - bt - 20, (total / 150) * (bb - bt - 20))
    const fillTop = bb - 12 - fillH

    // 溶剂（浅蓝）
    ctx.fillStyle = 'rgba(37,99,235,0.12)'
    ctx.fillRect(bx + 2, fillTop, bw - 4, fillH)

    // 溶质颗粒（绿色小点，数量随浓度）
    const particleCount = Math.round(percent * 1.2)
    ctx.fillStyle = 'rgba(16,185,129,0.65)'
    for (let i = 0; i < particleCount; i++) {
      const seed = i * 97.3
      const px = bx + 12 + ((seed * 13) % (bw - 24))
      const py = fillTop + 10 + ((seed * 7) % Math.max(20, fillH - 16))
      ctx.beginPath()
      ctx.arc(px, py, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // 液面线
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(bx + 2, fillTop)
    ctx.lineTo(bx + bw - 2, fillTop)
    ctx.stroke()

    // 刻度
    ctx.fillStyle = '#8b95a5'
    ctx.font = '10px "JetBrains Mono", monospace'
    for (let i = 0; i <= 5; i++) {
      const y = bb - 12 - (i / 5) * (bb - bt - 20)
      ctx.fillText(`${i * 30}g`, bx + bw + 8, y + 4)
      ctx.beginPath()
      ctx.moveTo(bx + bw - 8, y)
      ctx.lineTo(bx + bw, y)
      ctx.stroke()
    }

    // 右侧数据面板
    const px2 = compact ? 20 : W * 0.58
    const py2 = compact ? H * 0.56 : 0
    ctx.fillStyle = '#1a2332'
    ctx.font = '600 15px -apple-system, "PingFang SC", sans-serif'
    ctx.fillText('溶质质量分数', px2, py2 + 70)

    // 大数字
    ctx.fillStyle = '#0f766e'
    ctx.font = '600 40px "Fraunces", Georgia, serif'
    ctx.fillText(`${percent.toFixed(1)}%`, px2, py2 + 118)

    ctx.fillStyle = '#8b95a5'
    ctx.font = '12px "JetBrains Mono", monospace'
    if (compact) {
      ctx.fillText(`溶质 ${solute} g　溶剂 ${solvent} g　溶液 ${total} g`, px2, py2 + 152)
    } else {
      ctx.fillText(`溶质 = ${solute} g`, px2, py2 + 160)
      ctx.fillText(`溶剂 = ${solvent} g`, px2, py2 + 184)
      ctx.fillText(`溶液 = ${total} g`, px2, py2 + 208)
    }

    // 公式
    ctx.fillStyle = '#1a2332'
    ctx.font = '12px "JetBrains Mono", monospace'
    if (compact) {
      ctx.fillText(`ω = ${solute} / ${total} × 100% = ${percent.toFixed(1)}%`, px2, py2 + 182)
    } else {
      ctx.fillText('ω = 溶质 / 溶液 × 100%', px2, py2 + 248)
      ctx.fillText(`  = ${solute} / ${total} × 100%`, px2, py2 + 272)
      ctx.fillText(`  = ${percent.toFixed(1)}%`, px2, py2 + 296)
    }

    // 饱和提示
    if (percent > 26) {
      ctx.fillStyle = '#d97706'
      ctx.font = '12px -apple-system, "PingFang SC", sans-serif'
      ctx.fillText('⚠ 浓度过高，接近/超过常温溶解度', px2, compact ? py2 + 210 : py2 + 330)
    }
  }, [solute, solvent, percent, total])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 360 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>溶质质量</label>
          <input type="range" min={0} max={60} step={1} value={solute} onChange={(e) => setSolute(Number(e.target.value))} />
          <span className="slider-val">{solute} g</span>
        </div>
        <div className="slider-row">
          <label>溶剂质量</label>
          <input type="range" min={20} max={140} step={5} value={solvent} onChange={(e) => setSolvent(Number(e.target.value))} />
          <span className="slider-val">{solvent} g</span>
        </div>
        <div className="lab-note">
          <strong>溶质质量分数</strong> = 溶质质量 ÷ 溶液质量 × 100%。
          溶液质量 = 溶质 + 溶剂。拖动两个滑杆观察浓度变化——加水稀释，溶质不变但质量分数下降。
        </div>
      </div>
    </div>
  )
}
