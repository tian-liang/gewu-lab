import { useEffect, useRef, useState } from 'react'

/** 简单电路：电源电压 + 电阻 → 电流（欧姆定律） */
export default function CircuitDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [voltage, setVoltage] = useState(6)
  const [resistance, setResistance] = useState(10)
  const [mode, setMode] = useState<'series' | 'parallel'>('series')

  const current = voltage / (mode === 'series' ? resistance * 2 : resistance / 2)
  const rTotal = mode === 'series' ? resistance * 2 : resistance / 2

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = 380
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const mx = 70, my = 60
    const cw = W - 140, ch = H - 140

    // 电路导线（矩形）
    ctx.strokeStyle = '#1a2332'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(mx, my, cw, ch, 10)
    ctx.stroke()

    // 电池（左边中点）
    const bx = mx, by = my + ch / 2
    ctx.strokeStyle = '#dc2626'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(bx, by - 16); ctx.lineTo(bx, by + 16); ctx.stroke()
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(bx - 10, by - 8); ctx.lineTo(bx + 10, by - 8); ctx.stroke()
    ctx.fillStyle = '#dc2626'
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.fillText(`+ ${voltage}V`, bx - 56, by - 24)

    // 电阻（两个）
    const drawResistor = (x: number, y: number, label: string) => {
      ctx.fillStyle = '#eef2f7'
      ctx.strokeStyle = '#1a2332'
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.roundRect(x - 32, y - 12, 64, 24, 4); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#1a2332'
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(label, x, y + 4)
      ctx.textAlign = 'start'
    }

    if (mode === 'series') {
      drawResistor(mx + cw * 0.32, my, `R=${resistance}Ω`)
      drawResistor(mx + cw * 0.68, my, `R=${resistance}Ω`)
    } else {
      // 并联：中上一个，中下一个（简化为上下两路）
      drawResistor(mx + cw * 0.5, my, `R=${resistance}Ω`)
      drawResistor(mx + cw * 0.5, my + ch, `R=${resistance}Ω`)
      // 中间竖线
      ctx.strokeStyle = '#1a2332'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(mx + cw * 0.25, my); ctx.lineTo(mx + cw * 0.25, my + ch)
      ctx.moveTo(mx + cw * 0.75, my); ctx.lineTo(mx + cw * 0.75, my + ch)
      ctx.stroke()
    }

    // 电流流动示意（虚线小点）
    const brightness = Math.min(1, current / 1.5)
    ctx.fillStyle = `rgba(217,119,6,${0.25 + brightness * 0.75})`
    for (let i = 0; i < 8; i++) {
      const t = (i / 8 + (Date.now() / 2000) % 1) % 1
      const px = mx + t * cw
      ctx.beginPath(); ctx.arc(px, my - 4, 3, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(mx + (1 - t) * cw, my + ch + 4, 3, 0, Math.PI * 2); ctx.fill()
    }

    // 灯泡亮度提示（右侧）
    const lx = W - 50, ly = H / 2
    const glow = brightness
    ctx.beginPath(); ctx.arc(lx, ly, 18, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(217,119,6,${0.12 + glow * 0.6})`
    ctx.fill()
    ctx.strokeStyle = '#d97706'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = '#8b95a5'
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('亮度', lx, ly + 34)
    ctx.textAlign = 'start'
  }, [voltage, resistance, mode, current])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 380 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="filter-row" style={{ marginBottom: 8 }}>
          <button className={`filter-chip ${mode === 'series' ? 'active' : ''}`} onClick={() => setMode('series')}>串联</button>
          <button className={`filter-chip ${mode === 'parallel' ? 'active' : ''}`} onClick={() => setMode('parallel')}>并联</button>
        </div>
        <div className="slider-row">
          <label>电压 U</label>
          <input type="range" min={1} max={24} step={0.5} value={voltage} onChange={(e) => setVoltage(Number(e.target.value))} />
          <span className="slider-val">{voltage} V</span>
        </div>
        <div className="slider-row">
          <label>电阻 R</label>
          <input type="range" min={2} max={40} step={1} value={resistance} onChange={(e) => setResistance(Number(e.target.value))} />
          <span className="slider-val">{resistance} Ω</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginTop: 12 }}>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div className="eyebrow">总电阻</div>
            <div className="num" style={{ fontSize: 20 }}>{rTotal.toFixed(1)} Ω</div>
          </div>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div className="eyebrow">总电流</div>
            <div className="num" style={{ fontSize: 20, color: 'var(--warn)' }}>{current.toFixed(2)} A</div>
          </div>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div className="eyebrow">I = U/R</div>
            <div className="num" style={{ fontSize: 20 }}>{voltage}÷{rTotal.toFixed(1)}</div>
          </div>
        </div>
        <div className="lab-note" style={{ marginTop: 12 }}>
          串联：总电阻 = R + R；并联：总电阻 = R ÷ 2。电压不变时，电阻越大电流越小——这就是欧姆定律。
        </div>
      </div>
    </div>
  )
}
