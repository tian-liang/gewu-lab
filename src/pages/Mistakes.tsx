import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { getMistakes, resolveMistake } from '../db/indexeddb'
import type { MistakeEntry } from '../db/types'
import { getQuestionById as findQuestion } from '../data/questions'
import { errorTypeLabel, formatDate, difficultyLabel } from '../utils'

const errorTypes = [
  { id: 'all', label: '全部' },
  { id: 'concept', label: '概念不清' },
  { id: 'calculation', label: '计算失误' },
  { id: 'reading', label: '审题偏差' },
  { id: 'method', label: '方法不会' },
]

export default function Mistakes() {
  const navigate = useApp((s) => s.navigate)
  const [items, setItems] = useState<MistakeEntry[]>([])
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async () => {
    const list = await getMistakes()
    list.sort((a, b) => b.addedAt - a.addedAt)
    setItems(list)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = filter === 'all' ? items : items.filter((m) => m.errorType === filter)

  const handleResolve = async (id: string, stillWrong: boolean) => {
    await resolveMistake(id, stillWrong)
    await load()
  }

  return (
    <div>
      <div className="page-head">
        <p className="eyebrow">错题本</p>
        <h1 className="page-title">错过的，不再错</h1>
        <p className="page-sub">
          共 {items.length} 道待复习 · 按 1 / 3 / 7 / 15 天节奏推送
        </p>
      </div>

      <div className="filter-row">
        {errorTypes.map((e) => (
          <button
            key={e.id}
            className={`filter-chip ${filter === e.id ? 'active' : ''}`}
            onClick={() => setFilter(e.id)}
          >
            {e.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">✧</div>
          <p>还没有错题，去练习几道题吧</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('practice')}>
            去练习
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((m) => {
            const q = findQuestion(m.questionId)
            const open = expanded === m.id
            return (
              <div key={m.id} className={`card mistake-item ${m.stubborn ? 'stubborn' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span className="chip chip-warn">{errorTypeLabel(m.errorType)}</span>
                      {m.stubborn && <span className="chip chip-bad">顽固错题</span>}
                      <span className="small muted">{difficultyLabel(q?.difficulty ?? 'basic')}</span>
                      <span className="small muted">错了 {m.timesWrong} 次</span>
                    </div>
                    <p style={{ margin: 0, fontWeight: 500 }}>{q?.stem ?? '题目已移除'}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span className="small muted">加入 {formatDate(m.addedAt)}</span>
                    <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setExpanded(open ? null : m.id)}>
                      {open ? '收起' : '查看解析'}
                    </button>
                  </div>
                </div>

                {open && q && (
                  <div style={{ marginTop: 14 }}>
                    <div className="option-list" style={{ marginBottom: 12 }}>
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`option ${i === q.answerIndex ? 'correct' : ''}`}
                          style={{ cursor: 'default' }}
                        >
                          <span className="option-key">{String.fromCharCode(65 + i)}</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                    <div className="explain-box">{q.explanation}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => handleResolve(m.id, false)}>
                        这次会了
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => handleResolve(m.id, true)}>
                        还是不会
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
