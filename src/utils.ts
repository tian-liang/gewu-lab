import type { Subject } from './db/types'

export function subjectLabel(s: Subject) {
  return s === 'math' ? '数学' : s === 'physics' ? '物理' : '化学'
}

export function subjectClass(s: Subject) {
  return s === 'math' ? 'chip-math' : s === 'physics' ? 'chip-physics' : 'chip-chemistry'
}

export function difficultyLabel(d: string) {
  return d === 'basic' ? '基础' : d === 'advanced' ? '提高' : '挑战'
}

export function errorTypeLabel(t: string) {
  return (
    { concept: '概念不清', calculation: '计算失误', reading: '审题偏差', method: '方法不会' }[t] ?? t
  )
}

export function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
