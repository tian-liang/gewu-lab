export type Subject = 'math' | 'physics' | 'chemistry'

export interface KnowledgePoint {
  id: string
  subject: Subject
  grade: string
  chapter: string
  name: string
  definition: string
  intuition: string
  formulas: string[]
  examples: Example[]
  mistakes: string[]
  prerequisites: string[]
  nexts: string[]
  demoId?: string
  mastery?: number
}

export interface Example {
  title: string
  problem: string
  steps: string[]
  answer: string
}

export type ErrorType = 'concept' | 'calculation' | 'reading' | 'method'

export interface Question {
  id: string
  knowledgePointId: string
  subject: Subject
  difficulty: 'basic' | 'advanced' | 'challenge'
  stem: string
  options: string[]
  answerIndex: number
  explanation: string
  errorTypeHint: ErrorType
}

export interface PracticeRecord {
  id: string
  questionId: string
  answer: number
  correct: boolean
  errorType?: ErrorType
  ts: number
}

export interface MistakeEntry {
  id: string
  questionId: string
  errorType: ErrorType
  addedAt: number
  reviewAt: number
  timesWrong: number
  timesReviewed: number
  stubborn: boolean
}

export interface MasteryEntry {
  knowledgePointId: string
  score: number
  updatedAt: number
}

export interface DemoConfig {
  id: string
  subject: Subject
  name: string
  description: string
  knowledgePointId: string
}
