import { useEffect, useRef, useState } from 'react'
import { fitText } from './canvas-text'
import { setupCanvas } from './canvas-env'

/** 概率实验：大量重复，频率趋近概率 */
export default function ProbabilityDemo() {
  const [trials, setTrials] = useState(0)
  const [heads, setHeads] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const flip = (n: number) => {
    let h = 0
    for (let i = 0; i < n; i++) h += Math.random() < 0.5 ? 1 : 0
    setHeads((prev) => prev + h)
    setTrials((t) => t + n)
  }

  // 初始绘制 + 数据变化时重绘
  useEffect(() => {
    drawChart(trials, heads)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trials, heads])

  const drawChart = (n: number, h: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const env = setupCanvas(canvas, (w) => (w < 560 ? 320 : 300))
    if (!env) return
    const { ctx, W, H, compact } = env

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const pad = 36
    const plotW = W - pad * 2
    const plotH = H - pad * 2

    // 理论线 50%
    const y50 = pad + plotH / 2
    ctx.strokeStyle = '#d97706'
    ctx.setLineDash([5, 4])
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(pad, y50); ctx.lineTo(W - pad, y50); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#d97706'
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('理论概率 50%', W - pad - 110, y50 - 6)

    if (n === 0) {
      ctx.fillStyle = '#8b95a5'
      ctx.font = '13px -apple-system, "PingFang SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('点击下方按钮开始抛硬币', W / 2, H / 2 - 20)
      ctx.textAlign = 'start'
      return
    }

    // 模拟频率曲线：从 1 次开始累计（近似画）
    const freq = h / n
    const barW = Math.min(60, plotW * 0.4)
    const barH = plotH * (1 - Math.abs(freq - 0.5) * 2) * 0.5 + plotH * 0.25

    // 频率柱
    const bx = pad + plotW / 2 - barW / 2
    const by = pad + plotH - barH
    ctx.fillStyle = 'rgba(15,118,110,0.2)'
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 6); ctx.fill(); ctx.stroke()

    // 50% 参考柱
    const refH = plotH * 0.5
    ctx.fillStyle = 'rgba(217,119,6,0.1)'
    ctx.strokeStyle = 'rgba(217,119,6,0.5)'
    ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.roundRect(pad + plotW * 0.12, pad + plotH - refH, barW, refH, 6); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#d97706'
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('50%', pad + plotW * 0.12 + barW / 2 - 12, pad + plotH + 18)

    ctx.fillStyle = '#0f766e'
    fitText(
      ctx,
      `${(freq * 100).toFixed(1)}%`,
      Math.max(8, bx + barW / 2 - 22),
      by - 10,
      W - 16,
      '600 13px "JetBrains Mono", monospace'
    )
    fitText(
      ctx,
      `正面 ${h} / ${n}`,
      Math.max(8, bx + barW / 2 - 36),
      pad + plotH + 18,
      W - 16,
      '600 13px "JetBrains Mono", monospace'
    )
  }

  const reset = () => {
    setTrials(0)
    setHeads(0)
  }

  const freq = trials > 0 ? ((heads / trials) * 100).toFixed(1) : '—'

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn btn-primary" onClick={() => flip(1)}>抛 1 次</button>
          <button className="btn btn-ghost" onClick={() => flip(10)}>抛 10 次</button>
          <button className="btn btn-ghost" onClick={() => flip(100)}>抛 100 次</button>
          <button className="btn btn-ghost" onClick={() => flip(1000)}>抛 1000 次</button>
          <button className="btn btn-ghost" onClick={reset}>重置</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div className="eyebrow">次数</div>
            <div className="num" style={{ fontSize: 20 }}>{trials}</div>
          </div>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div className="eyebrow">正面</div>
            <div className="num" style={{ fontSize: 20 }}>{heads}</div>
          </div>
          <div className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div className="eyebrow">频率</div>
            <div className="num" style={{ fontSize: 20, color: 'var(--accent)' }}>{freq}%</div>
          </div>
        </div>
        <div className="lab-note" style={{ marginTop: 12 }}>
          抛的次数越多，正面出现的频率越接近 50%——这就是用频率估计概率。概率是理论值，频率是实验值。
        </div>
      </div>
    </div>
  )
}
