import { describe, it, expect } from 'vitest'
import { nextMasteryScore, nextReviewDelay, isStubborn, shouldRetire } from './logic'

describe('nextMasteryScore 掌握度更新', () => {
  it('答对 +6', () => {
    expect(nextMasteryScore(50, true)).toBe(56)
    expect(nextMasteryScore(0, true)).toBe(6)
  })

  it('答错 −8', () => {
    expect(nextMasteryScore(50, false)).toBe(42)
  })

  it('下限 0 不出负数', () => {
    expect(nextMasteryScore(3, false)).toBe(0)
    expect(nextMasteryScore(0, false)).toBe(0)
  })

  it('上限 100 不溢出', () => {
    expect(nextMasteryScore(98, true)).toBe(100)
    expect(nextMasteryScore(100, true)).toBe(100)
  })

  it('未练习默认从 0 开始', () => {
    expect(nextMasteryScore(0, true)).toBeGreaterThan(0)
    expect(nextMasteryScore(0, false)).toBe(0)
  })
})

describe('nextReviewDelay 间隔复习', () => {
  it('第 1 次复习 → 3 天', () => {
    expect(nextReviewDelay(1)).toBe(3)
  })
  it('第 2 次 → 7 天', () => {
    expect(nextReviewDelay(2)).toBe(7)
  })
  it('第 3 次 → 15 天', () => {
    expect(nextReviewDelay(3)).toBe(15)
  })
  it('第 4 次 → 30 天并封顶', () => {
    expect(nextReviewDelay(4)).toBe(30)
    expect(nextReviewDelay(10)).toBe(30)
  })
  it('间隔严格递增', () => {
    const seq = [1, 2, 3, 4].map(nextReviewDelay)
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i]).toBeGreaterThan(seq[i - 1])
    }
  })
})

describe('isStubborn 顽固错题', () => {
  it('错 2 次不算顽固', () => {
    expect(isStubborn(2)).toBe(false)
  })
  it('错 3 次算顽固', () => {
    expect(isStubborn(3)).toBe(true)
    expect(isStubborn(5)).toBe(true)
  })
})

describe('shouldRetire 错题本移出', () => {
  it('复习不足 3 次不移出', () => {
    expect(shouldRetire(2)).toBe(false)
  })
  it('复习满 3 次移出', () => {
    expect(shouldRetire(3)).toBe(true)
  })
})
