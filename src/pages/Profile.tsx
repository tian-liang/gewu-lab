import { useEffect, useRef, useState } from 'react'
import { knowledgePoints, getChapterGroups } from '../data/knowledge'
import { getMastery, getPracticeRecords, exportData, importData } from '../db/indexeddb'
import { subjectLabel, subjectClass } from '../utils'
import type { MasteryEntry } from '../db/types'

export default function Profile() {
  const [mastery, setMastery] = useState<MasteryEntry[]>([])
  const [totalPracticed, setTotalPracticed] = useState(0)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ;(async () => {
      setMastery(await getMastery())
      const records = await getPracticeRecords()
      setTotalPracticed(records.length)
    })()
  }, [])

  const masteryMap: Record<string, number> = {}
  mastery.forEach((e) => (masteryMap[e.knowledgePointId] = e.score))
  const learnedCount = mastery.filter((e) => e.score > 0).length

  const chapterStats = getChapterGroups().map((g) => {
    const scores = g.items.map((k) => masteryMap[k.id] ?? 0)
    const practiced = scores.filter((s) => s > 0).length
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    return { ...g, avg, practiced, total: g.items.length }
  })

  const handleExport = async () => {
    const data = await exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gewu-lab-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('✓ 备份已下载')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importData(data)
      setMastery(await getMastery())
      setMessage('✓ 数据已恢复')
    } catch {
      setMessage('✗ 文件格式不正确')
    }
    e.target.value = ''
  }

  return (
    <div>
      <div className="page-head">
        <p className="eyebrow">我的</p>
        <h1 className="page-title">学习档案</h1>
        <p className="page-sub">数据保存在本机浏览器，不上传。换设备请先导出备份。</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="eyebrow">累计练习</p>
          <div className="big-num">{totalPracticed}</div>
          <p className="small muted" style={{ margin: '8px 0 0' }}>
            题
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="eyebrow">已练知识点</p>
          <div className="big-num">{learnedCount}</div>
          <p className="small muted" style={{ margin: '8px 0 0' }}>
            个
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="eyebrow">知识点总数</p>
          <div className="big-num">{knowledgePoints.length}</div>
          <p className="small muted" style={{ margin: '8px 0 0' }}>
            覆盖初中三年
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow">章节掌握度</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
          {chapterStats.map((c) => (
            <div key={`${c.grade}|${c.chapter}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`chip ${subjectClass(c.subject)}`}>{subjectLabel(c.subject)}</span>
                  <span className="small">{c.chapter}</span>
                  <span className="small muted">
                    {c.practiced}/{c.total} 已练
                  </span>
                </div>
                <span className="num small">{c.avg}</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${c.avg}%`,
                    background: c.avg < 30 ? 'var(--bad)' : c.avg < 55 ? 'var(--warn)' : 'var(--accent)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">数据备份</p>
        <p className="small" style={{ color: 'var(--ink-2)', margin: '0 0 14px' }}>
          导出为 JSON 文件可保存练习记录、错题本与掌握度；导入可在新设备恢复。
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleExport}>
            导出备份
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            导入恢复
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
        {message && (
          <p className="small" style={{ marginTop: 12, color: 'var(--accent)' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
