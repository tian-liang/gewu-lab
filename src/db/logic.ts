/**
 * 纯函数逻辑（可单测）：掌握度更新、间隔复习调度
 * 由 indexeddb.ts 调用，不触碰存储
 */

/** 掌握度更新：答对 +6、答错 −8，钳制在 [0, 100] */
export function nextMasteryScore(prev: number, correct: boolean): number {
  const delta = correct ? 6 : -8
  return Math.max(0, Math.min(100, prev + delta))
}

/** 间隔复习：第 n 次复习后的间隔天数（1→3→7→15→30 封顶） */
export function nextReviewDelay(timesReviewed: number): number {
  const gaps = [3, 7, 15, 30]
  const idx = Math.min(Math.max(timesReviewed - 1, 0), gaps.length - 1)
  return gaps[idx]
}

/** 顽固错题判定：同一题错 3 次及以上 */
export function isStubborn(timesWrong: number): boolean {
  return timesWrong >= 3
}

/** 错题是否可以移出错题本：累计复习满 3 次 */
export function shouldRetire(timesReviewed: number): boolean {
  return timesReviewed >= 3
}
