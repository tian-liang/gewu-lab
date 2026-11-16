import { useEffect, useRef, useState } from 'react'
import { fitText } from './canvas-text'
import { setupCanvas } from './canvas-env'

/** 凸透镜成像：物距、焦距 → 像的位置与虚实 */
export default function LensDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [objDist, setObjDist] = useState(30) // 物距（相对焦距的倍数由 slider 控制）
  const [focal, setFocal] = useState(10)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const env = setupCanvas(canvas, 380)
    if (!env) return
    const { ctx, W, H } = env

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const axisY = H / 2
    const lensX = W * 0.5
    const scale = 4 // px per unit

    // 主光轴
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(40, axisY); ctx.lineTo(W - 40, axisY); ctx.stroke()

    // 透镜（竖椭圆）
    ctx.strokeStyle = '#0f766e'
    ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.ellipse(lensX, axisY, 16, 72, 0, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = 'rgba(15,118,110,0.08)'
    ctx.fill()

    // 焦点 F
    const f1 = lensX + focal * scale
    const f2 = lensX - focal * scale
    for (const [fx, label] of [[f1, 'F'], [f2, 'F']] as const) {
      if (fx > 40 && fx < W - 40) {
        ctx.fillStyle = '#d97706'
        ctx.beginPath(); ctx.arc(fx, axisY, 4, 0, Math.PI * 2); ctx.fill()
        ctx.font = '11px "JetBrains Mono", monospace'
        ctx.fillText(label, fx - 4, axisY + 18)
      }
    }

    // 2F
    for (const fx of [lensX + 2 * focal * scale, lensX - 2 * focal * scale]) {
      if (fx > 40 && fx < W - 40) {
        ctx.fillStyle = '#8b95a5'
        ctx.beginPath(); ctx.arc(fx, axisY, 3, 0, Math.PI * 2); ctx.fill()
        ctx.font = '10px "JetBrains Mono", monospace'
        ctx.fillText('2F', fx - 6, axisY + 18)
      }
    }

    // 物体（箭头，左侧）
    const objX = lensX - objDist * scale
    const objH = 50
    if (objX > 40) {
      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(objX, axisY); ctx.lineTo(objX, axisY - objH)
      ctx.moveTo(objX - 6, axisY - objH + 10); ctx.lineTo(objX, axisY - objH); ctx.lineTo(objX + 6, axisY - objH + 10)
      ctx.stroke()
      ctx.fillStyle = '#2563eb'
      ctx.font = '11px "JetBrains Mono", monospace'
      ctx.fillText('物', objX - 10, axisY + 20)
    }

    // 成像公式 1/u + 1/v = 1/f → v = uf/(u-f)
    const u = objDist
    const f = focal
    const v = (u * f) / (u - f)
    const magnification = -v / u

    if (Math.abs(u - f) < 0.5) {
      // 不成像（平行光）
      ctx.strokeStyle = 'rgba(220,38,38,0.5)'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(objX, axisY - objH); ctx.lineTo(W - 60, axisY - objH); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#dc2626'
      ctx.font = '13px -apple-system, "PingFang SC", sans-serif'
      fitText(
        ctx,
        '物距 = 焦距，折射光平行射出，不成像',
        16,
        H - 18,
        W - 32,
        '13px -apple-system, "PingFang SC", sans-serif'
      )
    } else {
      const imgX = lensX + v * scale
      const imgH = objH * Math.abs(magnification)
      const isReal = v > 0

      // 像（箭头）
      if (imgX > 40 && imgX < W - 40 && imgH < 130) {
        ctx.strokeStyle = isReal ? '#dc2626' : '#7c3aed'
        ctx.lineWidth = 2.5
        ctx.setLineDash(isReal ? [] : [5, 3])
        const dir = magnification < 0 ? -1 : 1 // 实像倒立
        const topY = isReal ? axisY + imgH * (magnification < 0 ? 1 : -1) : axisY - imgH
        ctx.beginPath()
        ctx.moveTo(imgX, axisY)
        ctx.lineTo(imgX, topY)
        ctx.moveTo(imgX - 6, topY + 10 * Math.sign(axisY - topY || 1))
        ctx.lineTo(imgX, topY)
        ctx.lineTo(imgX + 6, topY + 10 * Math.sign(axisY - topY || 1))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = isReal ? '#dc2626' : '#7c3aed'
        ctx.font = '11px "JetBrains Mono", monospace'
        ctx.fillText(isReal ? '实像' : '虚像', imgX - 10, axisY + 20)
      }

      // 光路：两条特殊光线
      ctx.strokeStyle = 'rgba(217,119,6,0.45)'
      ctx.lineWidth = 1
      // 平行光 → 过焦点
      ctx.beginPath()
      ctx.moveTo(objX, axisY - objH)
      ctx.lineTo(lensX, axisY - objH)
      ctx.lineTo(imgX, isReal ? axisY + objH * Math.abs(magnification) * Math.sign(magnification || 1) : axisY - objH)
      ctx.stroke()
      // 过光心
      ctx.beginPath()
      ctx.moveTo(objX, axisY - objH)
      ctx.lineTo(lensX, axisY)
      ctx.lineTo(imgX + 200, axisY + (axisY - (axisY - objH)) * (v / u) * -1)
      ctx.stroke()

      // 信息
      ctx.fillStyle = '#1a2332'
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillText(`像距 v = ${v.toFixed(1)}`, 50, 40)
      ctx.fillText(`放大率 = ${Math.abs(magnification).toFixed(2)}`, 50, 60)
      ctx.fillText(`性质：${isReal ? '实像、倒立' : '虚像、正立'}`, 50, 80)
    }
  }, [objDist, focal])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 380 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="slider-row">
          <label>物距 u</label>
          <input type="range" min={5} max={50} step={1} value={objDist} onChange={(e) => setObjDist(Number(e.target.value))} />
          <span className="slider-val">{objDist}</span>
        </div>
        <div className="slider-row">
          <label>焦距 f</label>
          <input type="range" min={5} max={20} step={1} value={focal} onChange={(e) => setFocal(Number(e.target.value))} />
          <span className="slider-val">{focal}</span>
        </div>
        <div className="lab-note">
          物距大于 2 倍焦距，成倒立缩小的实像（照相机）；物距在 1～2 倍焦距之间，成倒立放大的实像（投影仪）；
          物距小于焦距，成正立放大的虚像（放大镜）。拖动物距逐一体验这三种情况。
        </div>
      </div>
    </div>
  )
}
