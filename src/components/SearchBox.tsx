import { useMemo, useRef, useState, useEffect } from 'react'
import { useApp } from '../store'
import { knowledgePoints } from '../data/knowledge'
import { subjectLabel, subjectClass } from '../utils'

/** 侧栏全局知识点搜索 */
export default function SearchBox() {
  const navigate = useApp((s) => s.navigate)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const results = useMemo(() => {
    const query = q.trim()
    if (!query) return []
    const lower = query.toLowerCase()
    const scored: { kp: (typeof knowledgePoints)[number]; score: number }[] = []
    for (const kp of knowledgePoints) {
      let score = 0
      if (kp.name.toLowerCase().includes(lower)) score += 10
      if (kp.chapter.toLowerCase().includes(lower)) score += 4
      if (kp.definition.toLowerCase().includes(lower)) score += 2
      if (kp.intuition.toLowerCase().includes(lower)) score += 1
      if (kp.formulas.some((f) => f.toLowerCase().includes(lower))) score += 2
      if (score > 0) scored.push({ kp, score })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, 8)
  }, [q])

  return (
    <div ref={wrapRef} className="search-box" style={{ position: 'relative', padding: '0 12px' }}>
      <input
        type="search"
        value={q}
        placeholder="搜索知识点…"
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        style={{
          width: '100%',
          height: 38,
          padding: '0 12px',
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--line)',
          background: 'var(--bg)',
          color: 'var(--ink)',
          fontSize: 13,
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
      {open && q.trim() && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 12,
            right: 12,
            marginTop: 4,
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-sm)',
            boxShadow: 'var(--shadow-lift)',
            zIndex: 40,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          {results.length === 0 && (
            <div style={{ padding: '14px 12px', color: 'var(--ink-3)', fontSize: 13 }}>
              没有找到「{q}」相关知识点
            </div>
          )}
          {results.map(({ kp }) => (
            <button
              key={kp.id}
              onClick={() => {
                navigate('knowledge-detail', { kpId: kp.id })
                setOpen(false)
                setQ('')
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                border: 'none',
                borderBottom: '1px solid var(--line)',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span className={`chip ${subjectClass(kp.subject)}`} style={{ fontSize: 10, padding: '1px 7px' }}>
                  {subjectLabel(kp.subject)}
                </span>
                <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{kp.name}</strong>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{kp.chapter}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
