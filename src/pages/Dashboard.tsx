import { useEffect, useState } from 'react'
import { useApp } from '../store'
import { knowledgePoints, getChapterGroups, demoConfigs } from '../data/knowledge'
import { questions } from '../data/questions'
import { getMastery, getMistakes, getPracticeRecords } from '../db/indexeddb'
import { subjectLabel, subjectClass } from '../utils'

export default function Dashboard() {
  const navigate = useApp((s) => s.navigate)
  const [mastery, setMastery] = useState<Record<string, number>>({})
  const [mistakeCount, setMistakeCount] = useState(0)
  const [totalPracticed, setTotalPracticed] = useState(0)

  useEffect(() => {
    ;(async () => {
      const m = await getMastery()
      const map: Record<string, number> = {}
      m.forEach((e) => (map[e.knowledgePointId] = e.score))
      setMastery(map)
      const mistakes = await getMistakes()
      setMistakeCount(mistakes.length)
      const records = await getPracticeRecords()
      setTotalPracticed(records.length)
    })()
  }, [])

  const avgMastery =
    knowledgePoints.length > 0
      ? Math.round(
          knowledgePoints.reduce((sum, kp) => sum + (mastery[kp.id] ?? 0), 0) /
            knowledgePoints.length
        )
      : 0

  // 掌握度最弱的 3 个知识点
  const weakest = [...knowledgePoints]
    .sort((a, b) => (mastery[a.id] ?? 0) - (mastery[b.id] ?? 0))
    .slice(0, 3)

  // 章节级掌握度
  const chapterStats = getChapterGroups().map((g) => {
    const scores = g.items.map((k) => mastery[k.id] ?? 0)
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return { ...g, avg }
  })

  return (
    <div>
      <div className="page-head">
        <p className="eyebrow">学习仪表盘</p>
        <h1 className="page-title">你好，继续探索吧</h1>
        <p className="page-sub">
          覆盖初中三年 {knowledgePoints.length} 个知识点 · 题库 {questions.length} 题
        </p>
      </div>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="eyebrow">综合掌握度</p>
          <div className="big-num">
            {avgMastery}
            <span style={{ fontSize: 18, color: 'var(--ink-3)' }}>%</span>
          </div>
          <div className="progress-track" style={{ marginTop: 12 }}>
            <div className="progress-fill" style={{ width: `${avgMastery}%` }} />
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">累计练习</p>
          <div className="big-num">
            {totalPracticed}
            <span style={{ fontSize: 18, color: 'var(--ink-3)' }}> 题</span>
          </div>
          <p className="small muted" style={{ margin: '10px 0 0' }}>
            目标：每周 20 题
          </p>
        </div>
        <div className="card">
          <p className="eyebrow">待复习错题</p>
          <div
            className="big-num"
            style={{ color: mistakeCount > 0 ? 'var(--warn)' : 'var(--ink)' }}
          >
            {mistakeCount}
            <span style={{ fontSize: 18, color: 'var(--ink-3)' }}> 道</span>
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => navigate('mistakes')}>
            去复习 →
          </button>
        </div>
      </div>

      <div className="grid-dashboard">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="eyebrow">待加强知识点</p>
            {weakest.map((kp) => (
              <button
                key={kp.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'left',
                  padding: '12px 14px',
                  marginBottom: 8,
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('knowledge-detail', { kpId: kp.id })}
              >
                <span className={`chip ${subjectClass(kp.subject)}`}>{subjectLabel(kp.subject)}</span>
                <strong style={{ flex: 1, fontSize: 14 }}>{kp.name}</strong>
                <span className="num small" style={{ color: 'var(--warn)' }}>
                  {mastery[kp.id] ?? 0}
                </span>
              </button>
            ))}
            <button className="btn btn-primary btn-block" onClick={() => navigate('practice')}>
              开始针对性练习
            </button>
          </div>

          <div className="card">
            <p className="eyebrow">章节掌握概览</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {chapterStats.slice(0, 10).map((c) => (
                <div
                  key={`${c.grade}|${c.chapter}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => navigate('knowledge')}
                >
                  <span className={`chip ${subjectClass(c.subject)}`}>{subjectLabel(c.subject)}</span>
                  <span className="small" style={{ flex: 1 }}>
                    {c.chapter}
                  </span>
                  <div className="progress-track" style={{ width: 120 }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${c.avg}%`,
                        background: c.avg < 40 ? 'var(--bad)' : c.avg < 65 ? 'var(--warn)' : 'var(--accent)',
                      }}
                    />
                  </div>
                  <span className="num small" style={{ minWidth: 30, textAlign: 'right' }}>
                    {c.avg}
                  </span>
                </div>
              ))}
            </div>
            {chapterStats.length > 10 && (
              <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={() => navigate('profile')}>
                查看全部章节 →
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="eyebrow">动态实验室</p>
            {demoConfigs.slice(0, 3).map((d) => (
              <button
                key={d.id}
                className="card card-hover"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: 10,
                  padding: '14px 16px',
                  border: '1px solid var(--line)',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('lab', { demoId: d.id })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={`chip ${subjectClass(d.subject)}`}>{subjectLabel(d.subject)}</span>
                  <strong style={{ fontSize: 14 }}>{d.name}</strong>
                </div>
                <p className="small muted" style={{ margin: 0 }}>
                  {d.description.slice(0, 40)}…
                </p>
              </button>
            ))}
            <button className="btn btn-ghost btn-block" onClick={() => navigate('lab')}>
              全部演示 →
            </button>
          </div>

          <div className="card">
            <p className="eyebrow">内容规模</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="big-num">{questions.length}</span>
              <span className="muted">道题</span>
            </div>
            <p className="small muted" style={{ margin: '10px 0 0' }}>
              知识点 {knowledgePoints.length} 个 · 章节 {chapterStats.length} 章
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
