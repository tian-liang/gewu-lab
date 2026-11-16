import { describe, it, expect, beforeAll } from 'vitest'
import {
  getGradeLevels,
  matchGradeLevel,
  getChapterGroups,
  getGrades,
  getAllGrades,
  initContent,
  knowledgePoints,
} from './knowledge'

describe('getGradeLevels 年级段', () => {
  it('返回七/八/九年级三档', () => {
    expect(getGradeLevels()).toEqual(['七年级', '八年级', '九年级'])
  })
})

describe('matchGradeLevel 年级段匹配', () => {
  it('九年级段匹配全部九年级命名变体', () => {
    expect(matchGradeLevel('九年级上', '九年级')).toBe(true)
    expect(matchGradeLevel('九年级下', '九年级')).toBe(true)
    expect(matchGradeLevel('九年级全一册', '九年级')).toBe(true)
    expect(matchGradeLevel('九年级', '九年级')).toBe(true)
  })
  it('七年级段不匹配八年级', () => {
    expect(matchGradeLevel('八年级上', '七年级')).toBe(false)
  })
})

describe('内容加载后的分组与年级排序', () => {
  beforeAll(async () => {
    await initContent()
  })

  it('知识点全部加载', () => {
    expect(knowledgePoints.length).toBeGreaterThan(300)
  })

  it('年级列表升序', () => {
    const order = ['七年级上', '七年级下', '八年级上', '八年级下', '九年级上', '九年级下', '九年级全一册', '九年级']
    const all = getAllGrades()
    const ranks = all.map((g) => order.indexOf(g))
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1])
    }
  })

  it('数学年级升序且不含物理命名', () => {
    const mathGrades = getGrades('math')
    expect(mathGrades[0]).toBe('七年级上')
    expect(mathGrades).not.toContain('九年级全一册')
  })

  it('章节分组不丢失知识点', () => {
    const groups = getChapterGroups()
    const total = groups.reduce((s, g) => s + g.items.length, 0)
    expect(total).toBe(knowledgePoints.length)
  })

  it('章节组按年级升序排列', () => {
    const groups = getChapterGroups('math')
    const first = groups[0]
    expect(first.grade).toBe('七年级上')
    const last = groups[groups.length - 1]
    expect(last.grade).toBe('九年级下')
  })
})
