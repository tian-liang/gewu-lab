import { useMemo, useState } from 'react'
import { useApp } from '../store'
import { knowledgePoints, getChapterGroups, getGradeLevels, matchGradeLevel } from '../data/knowledge'
import { subjectLabel, subjectClass } from '../utils'
import type { Subject } from '../db/types'

const subjects: (Subject | 'all')[] = ['all', 'math', 'physics', 'chemistry']

export default function KnowledgeMap() {
  const navigate = useApp((s) => s.navigate)
  const [filter, setFilter] = useState<Subject | 'all'>('all')
  const [grade, setGrade] = useState<string>('all')
  const [openChapter, setOpenChapter] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const grades = getGradeLevels()
  const groups = useMemo(() => {
    let list = getChapterGroups(filter === 'all' ? undefined : filter)
    if (grade !== 'all') list = list.filter((g) => matchGradeLevel(g.grade, grade))
    const q = query.trim().toLowerCase()
    if (q) {
      list = list
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (kp) =>
              kp.name.toLowerCase().includes(q) ||
              kp.definition.toLowerCase().includes(q) ||
              kp.intuition.toLowerCase().includes(q)
          ),
        }))
        .filter((g) => g.items.length > 0)
    }
    return list
  }, [filter, grade, query])

  // 默认展开第一章
  const activeOpen = openChapter ?? groups[0]?.chapter ?? null

  return (
    <div>
      <div className="page-head">
        <p className="eyebrow">知识地图</p>
        <h1 className="page-title">把碎片知识连成一片</h1>
        <p className="page-sub">
          共 {knowledgePoints.length} 个知识点 · 覆盖初中三年数理化
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="在知识点中搜索…"
        style={{
          width: '100%',
          maxWidth: 420,
          height: 38,
          padding: '0 14px',
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--line)',
          background: 'var(--bg-card)',
          fontSize: 13,
          fontFamily: 'inherit',
          color: 'var(--ink)',
          outline: 'none',
          marginBottom: 14,
        }}
      />

      <div className="filter-row">
        {subjects.map((s) => (
          <button
            key={s}
            className={`filter-chip ${filter === s ? 'active' : ''}`}
            onClick={() => {
              setFilter(s)
              setGrade('all')
              setOpenChapter(null)
            }}
          >
            {s === 'all' ? '全部' : subjectLabel(s)}
          </button>
        ))}
      </div>

      <div className="filter-row" style={{ marginTop: -8 }}>
        <button
          className={`filter-chip ${grade === 'all' ? 'active' : ''}`}
          onClick={() => setGrade('all')}
        >
          全部年级
        </button>
        {grades.map((g) => (
          <button
            key={g}
            className={`filter-chip ${grade === g ? 'active' : ''}`}
            onClick={() => {
              setGrade(g)
              setOpenChapter(null)
            }}
          >
            {g}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map((g) => {
          const key = `${g.grade}|${g.chapter}`
          // 搜索时自动展开所有命中的章节
          const open = query.trim() ? true : activeOpen === g.chapter
          return (
            <div key={key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px 20px',
                  background: open ? 'var(--accent-soft)' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={() => setOpenChapter(open ? null : g.chapter)}
              >
                <span className={`chip ${subjectClass(g.subject)}`}>{subjectLabel(g.subject)}</span>
                <strong style={{ flex: 1, fontSize: 15 }}>{g.chapter}</strong>
                <span className="small muted">{g.grade}</span>
                <span className="small muted">{g.items.length} 个知识点</span>
                <span style={{ color: 'var(--ink-3)' }}>{open ? '▾' : '▸'}</span>
              </button>
              {open && (
                <div className="grid-2" style={{ padding: '10px 20px 22px', gap: 18 }}>
                  {g.items.map((kp) => (
                    <div
                      key={kp.id}
                      className="card card-hover kp-card"
                      style={{ background: 'var(--bg)', cursor: 'pointer' }}
                      onClick={() => navigate('knowledge-detail', { kpId: kp.id })}
                    >
                      <h3 style={{ fontSize: 16 }}>{kp.name}</h3>
                      <p>{kp.intuition}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {groups.length === 0 && (
        <div className="empty">
          <div className="empty-icon">◈</div>
          <p>该范围暂无内容</p>
        </div>
      )}
    </div>
  )
}
