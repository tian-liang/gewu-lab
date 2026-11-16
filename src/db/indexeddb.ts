import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { MistakeEntry, MasteryEntry, PracticeRecord, ErrorType } from './types'
import { nextMasteryScore, nextReviewDelay, isStubborn, shouldRetire } from './logic'

interface GewuDB extends DBSchema {
  practice_records: {
    key: string
    value: PracticeRecord
    indexes: { 'by-ts': number }
  }
  mistake_book: {
    key: string
    value: MistakeEntry
    indexes: { 'by-review': number; 'by-question': string }
  }
  mastery: {
    key: string
    value: MasteryEntry
  }
}

let dbPromise: Promise<IDBPDatabase<GewuDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GewuDB>('gewu_lab', 1, {
      upgrade(db) {
        const p = db.createObjectStore('practice_records', { keyPath: 'id' })
        p.createIndex('by-ts', 'ts')
        const m = db.createObjectStore('mistake_book', { keyPath: 'id' })
        m.createIndex('by-review', 'reviewAt')
        m.createIndex('by-question', 'questionId')
        db.createObjectStore('mastery', { keyPath: 'knowledgePointId' })
      },
    })
  }
  return dbPromise
}

const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export async function addPracticeRecord(
  questionId: string,
  answer: number,
  correct: boolean,
  errorType?: ErrorType
) {
  const db = await getDB()
  const rec: PracticeRecord = {
    id: rid(),
    questionId,
    answer,
    correct,
    errorType,
    ts: Date.now(),
  }
  await db.put('practice_records', rec)
  return rec
}

export async function getPracticeRecords(): Promise<PracticeRecord[]> {
  const db = await getDB()
  return db.getAllFromIndex('practice_records', 'by-ts')
}

export async function addMistake(questionId: string, errorType: ErrorType) {
  const db = await getDB()
  const existing = await db.getAllFromIndex('mistake_book', 'by-question', questionId)
  const now = Date.now()
  if (existing.length > 0) {
    const entry = existing[0]
    entry.timesWrong += 1
    entry.timesReviewed += 1
    entry.reviewAt = now + 24 * 3600 * 1000
    entry.stubborn = isStubborn(entry.timesWrong)
    entry.errorType = errorType
    await db.put('mistake_book', entry)
    return entry
  }
  const entry: MistakeEntry = {
    id: rid(),
    questionId,
    errorType,
    addedAt: now,
    reviewAt: now + 24 * 3600 * 1000,
    timesWrong: 1,
    timesReviewed: 0,
    stubborn: false,
  }
  await db.put('mistake_book', entry)
  return entry
}

export async function getMistakes(): Promise<MistakeEntry[]> {
  const db = await getDB()
  return db.getAll('mistake_book')
}

export async function resolveMistake(id: string, stillWrong: boolean) {
  const db = await getDB()
  const entry = await db.get('mistake_book', id)
  if (!entry) return
  const now = Date.now()
  if (stillWrong) {
    entry.timesWrong += 1
    entry.stubborn = isStubborn(entry.timesWrong)
    entry.reviewAt = now + 24 * 3600 * 1000
  } else {
    entry.timesReviewed += 1
    entry.reviewAt = now + nextReviewDelay(entry.timesReviewed) * 24 * 3600 * 1000
    if (shouldRetire(entry.timesReviewed)) {
      await db.delete('mistake_book', id)
      return
    }
  }
  await db.put('mistake_book', entry)
}

export async function updateMastery(knowledgePointId: string, correct: boolean) {
  const db = await getDB()
  const existing = await db.get('mastery', knowledgePointId)
  const now = Date.now()
  const score = nextMasteryScore(existing?.score ?? 0, correct)
  await db.put('mastery', {
    knowledgePointId,
    score,
    updatedAt: now,
  })
}

export async function getMastery(): Promise<MasteryEntry[]> {
  const db = await getDB()
  return db.getAll('mastery')
}

export async function exportData() {
  const db = await getDB()
  return {
    version: 2,
    exportedAt: Date.now(),
    practice_records: await db.getAll('practice_records'),
    mistake_book: await db.getAll('mistake_book'),
    mastery: await db.getAll('mastery'),
  }
}

export async function importData(data: {
  practice_records?: PracticeRecord[]
  mistake_book?: MistakeEntry[]
  mastery?: MasteryEntry[]
}) {
  const db = await getDB()
  const tx = db.transaction(['practice_records', 'mistake_book', 'mastery'], 'readwrite')
  for (const r of data.practice_records ?? []) await tx.objectStore('practice_records').put(r)
  for (const r of data.mistake_book ?? []) await tx.objectStore('mistake_book').put(r)
  for (const r of data.mastery ?? []) await tx.objectStore('mastery').put(r)
  await tx.done
}
