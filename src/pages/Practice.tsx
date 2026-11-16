import { useMemo, useState } from 'react'
import { useApp } from '../store'
import { questions as allQuestions, getQuestionsByKpIds } from '../data/questions'
import { knowledgePoints, getChapterGroups, getGradeLevels, matchGradeLevel } from '../data/knowledge'
import { addMistake, addPracticeRecord, updateMastery } from '../db/indexeddb'
import { subjectClass, subjectLabel, difficultyLabel, errorTypeLabel } from '../utils'
import type { Subject } from '../db/types'

type FilterState = { subject: Subject | 'all'; grade: string; chapter: string }

function pickRandom<T>(list: T[], n: number): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, n)
}

export default function Practice() {
  const navigate = useApp((s) => s.navigate)
  const [filter, setFilter] = useState<FilterState>({ subject: 'all', grade: 'all', chapter: 'all' })
  const [queue, setQueue] = useState<typeof allQuestions>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const [started, setStarted] = useState(false)

  const allGroups = useMemo(
    () => getChapterGroups(filter.subject === 'all' ? undefined : filter.subject),
    [filter.subject]
  )
  const grades = useMemo(() => getGradeLevels(), [])
  const groups = useMemo(
    () =>
      filter.grade === 'all'
        ? allGroups
        : allGroups.filter((g) => matchGradeLevel(g.grade, filter.grade)),
    [allGroups, filter.grade]
  )

  const buildQueue = () => {
    let pool = allQuestions
    if (filter.subject !== 'all') pool = pool.filter((q) => q.subject === filter.subject)
    if (filter.grade !== 'all' || filter.chapter !== 'all') {
      let kps = knowledgePoints
      if (filter.subject !== 'all') kps = kps.filter((k) => k.subject === filter.subject)
      if (filter.grade !== 'all') kps = kps.filter((k) => matchGradeLevel(k.grade, filter.grade))
      if (filter.chapter !== 'all') kps = kps.filter((k) => k.chapter === filter.chapter)
      pool = getQuestionsByKpIds(kps.map((k) => k.id))
    }
    setQueue(pickRandom(pool, 10))
    setIndex(0)
    setSelected(null)
    setSubmitted(false)
    setCorrectCount(0)
    setFinished(false)
    setStarted(true)
  }

  const q = queue[index]
  const progress = queue.length > 0 ? Math.round((index / queue.length) * 100) : 0

  const handleSubmit = async () => {
    if (selected === null || !q) return
    const correct = selected === q.answerIndex
    setSubmitted(true)
    if (correct) setCorrectCount((c) => c + 1)
    await addPracticeRecord(q.id, selected, correct, correct ? undefined : q.errorTypeHint)
    await updateMastery(q.knowledgePointId, correct)
    if (!correct) await addMistake(q.id, q.errorTypeHint)
  }

  const handleNext = () => {
    if (index + 1 >= queue.length) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
    setSubmitted(false)
  }

  // ── 选择范围页 ──────────────────────────────
  if (!started) {
    return (
      <div>
        <div className="page-head">
          <p className="eyebrow">练习中心</p>
          <h1 className="page-title">选择范围，开始练习</h1>
          <p className="page-sub">题库共 {allQuestions.length} 题 · 随机抽取 10 题</p>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <p className="eyebrow">学科</p>
          <div className="filter-row" style={{ marginBottom: 0 }}>
            {(['all', 'math', 'physics', 'chemistry'] as const).map((s) => (
              <button
                key={s}
                className={`filter-chip ${filter.subject === s ? 'active' : ''}`}
                onClick={() => setFilter({ subject: s, grade: 'all', chapter: 'all' })}
              >
                {s === 'all' ? '全部' : subjectLabel(s)}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <p className="eyebrow">年级</p>
          <div className="filter-row" style={{ marginBottom: 0 }}>
            <button
              className={`filter-chip ${filter.grade === 'all' ? 'active' : ''}`}
              onClick={() => setFilter((f) => ({ ...f, grade: 'all', chapter: 'all' }))}
            >
              全部年级
            </button>
            {grades.map((g) => (
              <button
                key={g}
                className={`filter-chip ${filter.grade === g ? 'active' : ''}`}
                onClick={() => setFilter((f) => ({ ...f, grade: g, chapter: 'all' }))}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <p className="eyebrow">章节</p>
          <div className="filter-row" style={{ marginBottom: 0 }}>
            <button
              className={`filter-chip ${filter.chapter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter((f) => ({ ...f, chapter: 'all' }))}
            >
              全部章节
            </button>
            {groups.map((g) => (
              <button
                key={`${g.grade}|${g.chapter}`}
                className={`filter-chip ${filter.chapter === g.chapter ? 'active' : ''}`}
                onClick={() => setFilter((f) => ({ ...f, chapter: g.chapter }))}
              >
                {g.chapter}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={buildQueue}>
          开始随机 10 题
        </button>
      </div>
    )
  }

  if (finished) {
    const acc = Math.round((correctCount / queue.length) * 100)
    return (
      <div>
        <div className="page-head">
          <p className="eyebrow">本轮完成</p>
          <h1 className="page-title">做得不错！</h1>
        </div>
        <div className="grid-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="eyebrow">正确率</p>
            <div className="big-num">{acc}%</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="eyebrow">答对</p>
            <div className="big-num">
              {correctCount}
              <span style={{ fontSize: 18, color: 'var(--ink-3)' }}>/{queue.length}</span>
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="eyebrow">错题已收进错题本</p>
            <div className="big-num">{queue.length - correctCount}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              setStarted(false)
              setFinished(false)
            }}
          >
            换个范围再练
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('mistakes')}>
            查看错题本
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('dashboard')}>
            回首页
          </button>
        </div>
      </div>
    )
  }

  if (!q) return null

  return (
    <div>
      <div className="page-head">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="eyebrow">练习中心</p>
            <h1 className="page-title" style={{ fontSize: 26 }}>
              第 {index + 1} 题 / 共 {queue.length} 题
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="small muted">已答对 {correctCount}</div>
          </div>
        </div>
        <div className="progress-track" style={{ marginTop: 12 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <span className={`chip ${subjectClass(q.subject)}`}>{subjectLabel(q.subject)}</span>
          <span className="chip chip-ok">{difficultyLabel(q.difficulty)}</span>
          <span className="small muted">
            {knowledgePoints.find((k) => k.id === q.knowledgePointId)?.name}
          </span>
        </div>

        <p className="question-stem">{q.stem}</p>

        <div className="option-list">
          {q.options.map((opt, i) => {
            let cls = 'option'
            if (!submitted && selected === i) cls += ' selected'
            if (submitted && i === q.answerIndex) cls += ' correct'
            if (submitted && selected === i && i !== q.answerIndex) cls += ' wrong'
            return (
              <button key={i} className={cls} disabled={submitted} onClick={() => setSelected(i)}>
                <span className="option-key">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>

        {submitted && (
          <div className="explain-box">
            <div style={{ marginBottom: 8 }}>
              {selected === q.answerIndex ? (
                <span className="chip chip-ok">✓ 回答正确</span>
              ) : (
                <span className="chip chip-bad">
                  ✗ 回答错误 · 错因：{errorTypeLabel(q.errorTypeHint)}
                </span>
              )}
            </div>
            {q.explanation}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {!submitted ? (
            <button className="btn btn-primary" disabled={selected === null} onClick={handleSubmit}>
              提交答案
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              {index + 1 >= queue.length ? '完成本轮' : '下一题 →'}
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => {
              setStarted(false)
              setFinished(false)
            }}
          >
            退出练习
          </button>
        </div>
      </div>
    </div>
  )
}
