import { useEffect, useRef, useState } from 'react'

const STROKES = ['吸气冲程', '压缩冲程', '做功冲程', '排气冲程']

/** 热机四冲程动画 */
export default function HeatEngineDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(true)
  const [stroke, setStroke] = useState(0) // 0-3
  const phaseRef = useRef(0) // 连续相位 0..4
  const playingRef = useRef(playing)
  playingRef.current = playing
  const setStrokeRef = useRef(setStroke)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const compact = W < 560
    const H = compact ? 480 : 380
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.height = `${H}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let raf = 0
    let lastStroke = -1

    const draw = () => {
      if (playingRef.current) {
        phaseRef.current = (phaseRef.current + 0.006) % 4
      }
      const t = phaseRef.current
      const s = Math.floor(t) // 0..3
      const local = t - s // 0..1 冲程内进度
      if (s !== lastStroke) {
        lastStroke = s
        setStrokeRef.current(s)
      }

      const cylW = compact ? 100 : 120
      const cylX = compact ? (W - cylW) / 2 : W * 0.32
      const textX = compact ? 20 : cylX + cylW + 30
      const textY = compact ? H - 78 : 70

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, W, H)

      // 气缸
      const cylTop = 60
      const cylBot = compact ? H - 170 : H - 90
      ctx.strokeStyle = '#1a2332'
      ctx.lineWidth = 2.5
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.roundRect(cylX, cylTop, cylW, cylBot - cylTop, 6)
      ctx.fill()
      ctx.stroke()

      // 活塞位置（0=上止点，1=下止点）
      let pistonPos = 0
      if (s === 0) pistonPos = 1 - local        // 吸气：上→下
      else if (s === 1) pistonPos = local        // 压缩：下→上? 实际压缩是下→上
      else if (s === 2) pistonPos = 1 - local    // 做功：上→下（膨胀）
      else pistonPos = local                     // 排气：下→上
      // 修正：压缩应是下→上
      if (s === 1) pistonPos = 1 - (1 - local) * 1 // 下→上
      if (s === 1) pistonPos = 1 - local * 0 + local // 简化重写
      // 重新定义：pistonPos 0=顶，1=底
      if (s === 0) pistonPos = local             // 吸气：顶→底
      else if (s === 1) pistonPos = 1 - local    // 压缩：底→顶
      else if (s === 2) pistonPos = local        // 做功：顶→底
      else pistonPos = 1 - local                 // 排气：底→顶

      const pistonY = cylTop + 30 + pistonPos * (cylBot - cylTop - 120)
      const pistonH = 36

      // 气体
      const gasTop = cylTop + 8
      const gasBot = pistonY
      let gasColor = 'rgba(37,99,235,0.10)' // 蓝：混合气
      if (s === 1) gasColor = `rgba(217,119,6,${0.12 + local * 0.25})` // 压缩升温
      if (s === 2) gasColor = `rgba(220,38,38,${0.28 - local * 0.18})` // 燃烧膨胀
      if (s === 3) gasColor = 'rgba(148,163,184,0.15)' // 废气
      ctx.fillStyle = gasColor
      ctx.fillRect(cylX + 4, gasTop, cylW - 8, Math.max(4, gasBot - gasTop))

      // 活塞
      ctx.fillStyle = '#64748b'
      ctx.strokeStyle = '#1a2332'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(cylX + 6, pistonY, cylW - 12, pistonH, 4)
      ctx.fill()
      ctx.stroke()
      // 连杆
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.moveTo(cylX + cylW / 2, pistonY + pistonH)
      ctx.lineTo(cylX + cylW / 2, cylBot + 28)
      ctx.stroke()
      // 曲轴
      const crankX = cylX + cylW / 2
      const crankY = cylBot + 28
      const crankAngle = t * Math.PI * 0.5
      ctx.strokeStyle = '#1a2332'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(crankX, crankY, 26, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(crankX, crankY)
      ctx.lineTo(crankX + 26 * Math.cos(crankAngle), crankY + 26 * Math.sin(crankAngle))
      ctx.stroke()

      // 气门
      const intakeOpen = s === 0
      const exhaustOpen = s === 3
      const drawValve = (vx: number, open: boolean, color: string, label: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = open ? 3 : 1.5
        ctx.beginPath()
        ctx.moveTo(vx, cylTop)
        ctx.lineTo(vx, cylTop + (open ? 22 : 8))
        ctx.stroke()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(vx, cylTop + (open ? 26 : 10), 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = '10px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillText(label, vx, cylTop - 10)
        ctx.textAlign = 'start'
      }
      drawValve(cylX + 30, intakeOpen, '#2563eb', '进气门')
      drawValve(cylX + cylW - 30, exhaustOpen, '#dc2626', '排气门')

      // 火花塞（做功冲程点火）
      if (s === 2 && local < 0.15) {
        ctx.fillStyle = '#f59e0b'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('✦ 点火', cylX + cylW / 2, cylTop - 10)
        ctx.textAlign = 'start'
      }

      // 冲程标注
      ctx.fillStyle = '#1a2332'
      ctx.font = '600 15px -apple-system, "PingFang SC", sans-serif'
      ctx.fillText(STROKES[s], textX, textY)
      ctx.fillStyle = '#8b95a5'
      ctx.font = '12px -apple-system, "PingFang SC", sans-serif'
      const desc = [
        '进气门开，混合气进入气缸',
        '两气门关闭，活塞上行压缩气体',
        '火花塞点火，燃气推动活塞做功',
        '排气门开，活塞上行排出废气',
      ][s]
      ctx.fillText(desc, textX, textY + 24)

      // 能量转换提示
      ctx.fillStyle = s === 2 ? '#16a34a' : '#8b95a5'
      ctx.font = '12px -apple-system, "PingFang SC", sans-serif'
      ctx.fillText(s === 2 ? '内能 → 机械能' : s === 1 ? '机械能 → 内能' : '惯性运转', textX, textY + 48)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div>
      <div className="lab-canvas-wrap">
        <canvas ref={canvasRef} style={{ height: 380 }} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn btn-primary" onClick={() => setPlaying((p) => !p)}>
            {playing ? '暂停' : '播放'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              phaseRef.current = Math.floor(phaseRef.current) + 1
              if (phaseRef.current >= 4) phaseRef.current = 0
            }}
          >
            下一冲程 →
          </button>
        </div>
        <div className="filter-row" style={{ marginBottom: 0 }}>
          {STROKES.map((s, i) => (
            <span key={s} className={`chip ${i === stroke ? 'chip-bad' : 'chip-ok'}`}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <div className="lab-note" style={{ marginTop: 12 }}>
          四个冲程循环一次，只有<strong>做功冲程</strong>对外做功，其余三个冲程靠飞轮惯性完成。
          一个工作循环曲轴转两圈、活塞往复两次。
        </div>
      </div>
    </div>
  )
}
