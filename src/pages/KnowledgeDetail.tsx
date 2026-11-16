import { useEffect } from 'react'
import { useApp } from '../store'
import { knowledgePoints, demoConfigs } from '../data/knowledge'
import { subjectLabel, subjectClass } from '../utils'
import { Formula } from '../components/Formula'

export default function KnowledgeDetail() {
  const { currentKpId, navigate } = useApp()
  const kp = knowledgePoints.find((k) => k.id === currentKpId) ?? knowledgePoints[0]

  // 知识关联跳转（前置/下一步）后回到顶部
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [kp.id])
  const demo = demoConfigs.find((d) => d.id === kp.demoId)

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate('knowledge')}>
        ← 返回知识地图
      </button>

      <div className="page-head">
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <span className={`chip ${subjectClass(kp.subject)}`}>{subjectLabel(kp.subject)}</span>
          <span className="chip chip-ok">{kp.chapter}</span>
          <span className="small muted" style={{ lineHeight: 1 }}>{kp.grade}</span>
        </div>
        <h1 className="page-title">{kp.name}</h1>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="eyebrow">是什么</p>
          <p style={{ margin: 0, lineHeight: 1.8 }}>{kp.definition}</p>
        </div>
        <div className="card">
          <p className="eyebrow">直觉理解</p>
          <p style={{ margin: 0, lineHeight: 1.8 }}>{kp.intuition}</p>
        </div>
      </div>

      {kp.formulas.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="eyebrow">关键公式</p>
          {kp.formulas.map((f, i) => (
            <div className="formula-block" key={i}>
              <Formula tex={f} />
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="eyebrow">典型例题</p>
        {kp.examples.map((ex, i) => (
          <details key={i} style={{ marginBottom: 12 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 500, padding: '8px 0' }}>
              {i + 1}. {ex.title}
            </summary>
            <div style={{ padding: '8px 0 4px 18px' }}>
              <p style={{ margin: '0 0 10px' }}>{ex.problem}</p>
              <ol className="small" style={{ color: 'var(--ink-2)', margin: '0 0 10px', paddingLeft: 18 }}>
                {ex.steps.map((s, j) => (
                  <li key={j} style={{ marginBottom: 4 }}>{s}</li>
                ))}
              </ol>
              <div className="explain-box">
                <strong>答案：</strong>
                {ex.answer}
              </div>
            </div>
          </details>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--warn)' }}>
        <p className="eyebrow">易错警示</p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {kp.mistakes.map((m, i) => (
            <li key={i} style={{ marginBottom: 6, color: 'var(--ink-2)' }}>{m}</li>
          ))}
        </ul>
      </div>

      <div className="grid-2">
        <div className="card">
          <p className="eyebrow">知识关联</p>
          <div className="tag-list">
            {kp.prerequisites.map((p) => {
              const target = knowledgePoints.find((k) => k.id === p)
              return (
                <button key={p} className="filter-chip" onClick={() => navigate('knowledge-detail', { kpId: p })}>
                  前置：{target?.name ?? p}
                </button>
              )
            })}
            {kp.nexts.map((p) => {
              const target = knowledgePoints.find((k) => k.id === p)
              return (
                <button key={p} className="filter-chip" onClick={() => navigate('knowledge-detail', { kpId: p })}>
                  下一步：{target?.name ?? p}
                </button>
              )
            })}
            {kp.prerequisites.length === 0 && kp.nexts.length === 0 && (
              <span className="small muted">暂无关联</span>
            )}
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">动手验证</p>
          {demo ? (
            <>
              <p className="small" style={{ color: 'var(--ink-2)', margin: '0 0 12px' }}>{demo.description}</p>
              <button className="btn btn-primary" onClick={() => navigate('lab', { demoId: demo.id })}>
                打开动态演示 →
              </button>
            </>
          ) : (
            <p className="small muted" style={{ margin: 0 }}>本知识点暂无配套演示</p>
          )}
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-ghost btn-block" onClick={() => navigate('practice')}>
              做相关练习 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
