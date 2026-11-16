import { useEffect, useRef, useState } from 'react'
import { setupCanvas, startLoop } from './canvas-env'

/** s-t 与 v-t 运动图像联动（含移动端紧凑布局） */
export default function MotionGraphDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [v0, setV0] = useState(2)
  const [acc, setAcc] = useState(1)
  const [tMax] = useState(6)
  const paramsRef = useRef({ v0, acc, tMax })
  paramsRef.current = { v0, acc, tMax }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const env = setupCanvas(canvas, (w) => (w < 560 ? 560 : 380))
    if (!env) return
    const { ctx, W, H, compact } = env

    const draw = () => {
      const { v0, acc, tMax } = paramsRef.current
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)

      const trackY = 70
      const plotH = compact ? 170 : 180
      const plotW = compact ? W - 70 : W * 0.42
      const pad = 44

      // ── 运动跑道 ──
      const trackLeft = 40
      const trackRight = W - 40
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(trackLeft, trackY + 30)
      ctx.lineTo(trackRight, trackY + 30)
      ctx.stroke()
      ctx.fillStyle = '#8b95a5'
      ctx.font = '10px "JetBrains Mono", monospace'
      for (let i = 0; i <= 5; i++) {
        const x = trackLeft + (i / 5) * (trackRight - trackLeft)
        ctx.fillText(`${i}s`, x - 6, trackY + 48)
      }

      const tNow = (Date.now() / 1000) % tMax
      const posAt = (t: number) => v0 * t + 0.5 * acc * t * t
      const velAt = (t: number) => v0 + acc * t
      const sMax = Math.max(Math.abs(posAt(tMax)), Math.abs(posAt(0)), 1)
      const objX = trackLeft + (posAt(tNow) / sMax) * (trackRight - trackLeft)

      ctx.fillStyle = '#0f766e'
      ctx.beginPath()
      ctx.arc(Math.max(trackLeft, Math.min(trackRight, objX)), trackY + 22, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('物', Math.max(trackLeft, Math.min(trackRight, objX)), trackY + 26)
      ctx.textAlign = 'start'

      ctx.fillStyle = '#1a2332'
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillText(`t=${tNow.toFixed(1)}s s=${posAt(tNow).toFixed(1)}m v=${velAt(tNow).toFixed(1)}m/s`, 20, 34)

      // ── s-t 图像 ──
      const stX = pad
      const stY = compact ? 150 : H - plotH - 30
      ctx.fillStyle = '#2563eb'
      ctx.font = '12px -apple-system, "PingFang SC", sans-serif'
      ctx.fillText('s-t 图像（位移-时间）', stX, stY - 12)
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(stX, stY); ctx.lineTo(stX, stY + plotH); ctx.lineTo(stX + plotW, stY + plotH)
      ctx.stroke()

      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let px = 0; px <= plotW; px += 3) {
        const t = (px / plotW) * tMax
        const y = stY + plotH - (posAt(t) / sMax) * (plotH - 16)
        if (px === 0) ctx.moveTo(stX + px, y)
        else ctx.lineTo(stX + px, y)
      }
      ctx.stroke()

      const cx1 = stX + (tNow / tMax) * plotW
      const cy1 = stY + plotH - (posAt(tNow) / sMax) * (plotH - 16)
      ctx.fillStyle = '#dc2626'
      ctx.beginPath(); ctx.arc(cx1, cy1, 5, 0, Math.PI * 2); ctx.fill()

      ctx.fillStyle = '#8b95a5'
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillText('t/s', stX + plotW - 20, stY + plotH + 16)
      ctx.fillText('s/m', stX - 30, stY + 20)
      ctx.fillText('s-t 斜率 = v', stX + 60, stY + 20)

      // ── v-t 图像 ──
      const vtX = compact ? pad : W / 2 + 20
      const vtY = compact ? 380 : stY
      const vMax = Math.max(Math.abs(velAt(0)), Math.abs(velAt(tMax)), 1)
      ctx.fillStyle = '#7c3aed'
      ctx.font = '12px -apple-system, "PingFang SC", sans-serif'
      ctx.fillText('v-t 图像（速度-时间）', vtX, vtY - 12)
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(vtX, vtY); ctx.lineTo(vtX, vtY + plotH); ctx.lineTo(vtX + plotW, vtY + plotH)
      ctx.stroke()

      ctx.strokeStyle = '#7c3aed'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let px = 0; px <= plotW; px += 3) {
        const t = (px / plotW) * tMax
        const y = vtY + plotH / 2 - (velAt(t) / vMax) * (plotH / 2 - 10)
        if (px === 0) ctx.moveTo(vtX + px, y)
        else ctx.lineTo(vtX + px, y)
      }
      ctx.stroke()

      const cx2 = vtX + (tNow / tMax) * plotW
      const cy2 = vtY + plotH / 2 - (velAt(tNow) / vMax) * (plotH / 2 - 10)
      ctx.fillStyle = '#dc2626'
      ctx.beginPath(); ctx.arc(cx2, cy2, 5, 0, Math.PI * 2); ctx.fill()

      ctx.fillStyle = '#8b95a5'
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillText('t/s', vtX + plotW - 20, vtY + plotH + 16)
      ctx.fillText('v', vtX - 16, vtY + 20)
      ctx.fillText(`v-t 斜率 = a = ${acc.toFixed(1)} m/s²`, vtX + 30, vtY + 20)
    }

    return startLoop(canvas, draw)
  }, [])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>初速度 v₀</label>
          <input type="range" min={-2} max={6} step={0.2} value={v0} onChange={(e) => setV0(Number(e.target.value))} />
          <span className="slider-val">{v0} m/s</span>
        </div>
        <div className="slider-row">
          <label>加速度 a</label>
          <input type="range" min={-2} max={4} step={0.1} value={acc} onChange={(e) => setAcc(Number(e.target.value))} />
          <span className="slider-val">{acc} m/s²</span>
        </div>
        <div className="lab-note">
          <strong>s-t 图像</strong>的斜率表示速度：直线=匀速，曲线=变速。
          <strong>v-t 图像</strong>的斜率表示加速度，图线与时间轴围成的面积等于位移。
          调 a = 0 看匀速直线运动的图像特征。
        </div>
      </div>
    </div>
  )
}
