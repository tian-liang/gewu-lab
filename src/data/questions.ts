import type { Question, Subject } from '../db/types'

// 题库随内容模块动态加载（代码拆分）
export let questions: Question[] = []

let initPromise: Promise<void> | null = null

export function initQuestions(): Promise<void> {
  if (!initPromise) {
    initPromise = Promise.all([
      import('./content/math-linear'),
      import('./content/math-7'),
      import('./content/math-8'),
      import('./content/math-9'),
      import('./content/physics-8'),
      import('./content/physics-9'),
      import('./content/chemistry-9'),
      import('./content/math-supplement'),
      import('./content/physics-supplement'),
      import('./content/chemistry-supplement'),
    ]).then((mods) => {
      questions = mods.flatMap((m) => m.questions)
    })
  }
  return initPromise
}

export function getQuestionsByKnowledgePoint(kpId: string) {
  return questions.filter((q) => q.knowledgePointId === kpId)
}

export function getQuestionById(id: string) {
  return questions.find((q) => q.id === id)
}

export function getQuestionsBySubject(subject: Subject) {
  return questions.filter((q) => q.subject === subject)
}

export function getQuestionsByKpIds(kpIds: string[]) {
  const set = new Set(kpIds)
  return questions.filter((q) => set.has(q.knowledgePointId))
}
