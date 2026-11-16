import type { KnowledgePoint, DemoConfig, Subject } from '../db/types'

// 内容模块动态加载（代码拆分）：initContent() 完成后可同步读取
export let knowledgePoints: KnowledgePoint[] = []

let initPromise: Promise<void> | null = null

export function initContent(): Promise<void> {
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
      knowledgePoints = mods.flatMap((m) => m.knowledgePoints)
    })
  }
  return initPromise
}

export const demoConfigs: DemoConfig[] = [
  {
    id: 'demo-linear',
    subject: 'math',
    name: '一次函数参数实验',
    description: '拖动 k 和 b，观察一次函数 y = kx + b 图像如何变化。感受斜率与截距的几何意义。',
    knowledgePointId: 'kp-linear-image',
  },
  {
    id: 'demo-quadratic',
    subject: 'math',
    name: '二次函数图像',
    description: '拖动 a、b、c，观察抛物线开口、对称轴与顶点的移动。理解二次函数的图像与性质。',
    knowledgePointId: 'kp-m9-23',
  },
  {
    id: 'demo-pythagoras',
    subject: 'math',
    name: '勾股定理',
    description: '改变直角边长度，观察三个正方形的面积变化。验证 a²+b²=c²。',
    knowledgePointId: 'kp-m8-31',
  },
  {
    id: 'demo-probability',
    subject: 'math',
    name: '概率实验',
    description: '大量抛硬币，观察频率如何趋近 50%。理解用频率估计概率。',
    knowledgePointId: 'kp-m9-19',
  },
  {
    id: 'demo-trig',
    subject: 'math',
    name: '三角函数',
    description: '改变角度，观察 sin、cos、tan 的变化规律。理解锐角三角函数的几何意义。',
    knowledgePointId: 'kp-m9-31',
  },
  {
    id: 'demo-force',
    subject: 'physics',
    name: '受力分析实验室',
    description: '改变拉力大小与角度，观察合力方向与小车运动。理解力的合成与分解。',
    knowledgePointId: 'kp-p8-31',
  },
  {
    id: 'demo-circuit',
    subject: 'physics',
    name: '电路模拟',
    description: '调节电压、电阻与串并联方式，观察电流变化。验证欧姆定律。',
    knowledgePointId: 'kp-p9-12',
  },
  {
    id: 'demo-lens',
    subject: 'physics',
    name: '凸透镜成像',
    description: '改变物距与焦距，观察实像、虚像的形成条件。理解凸透镜成像规律。',
    knowledgePointId: 'kp-p8-20',
  },
  {
    id: 'demo-optics',
    subject: 'physics',
    name: '光的反射与折射',
    description: '改变入射角与介质折射率，观察反射光、折射光与全反射现象。',
    knowledgePointId: 'kp-p8-14',
  },
  {
    id: 'demo-particles',
    subject: 'chemistry',
    name: '微观粒子运动',
    description: '调节温度，观察分子运动快慢与物态变化。理解温度是分子平均动能的标志。',
    knowledgePointId: 'kp-p9-1',
  },
  {
    id: 'demo-atom',
    subject: 'chemistry',
    name: '原子结构',
    description: '选择元素，观察原子核与核外电子的分层排布。理解原子的构成。',
    knowledgePointId: 'kp-c9-8',
  },
  {
    id: 'demo-heat-engine',
    subject: 'physics',
    name: '热机四冲程',
    description: '观察吸气、压缩、做功、排气四个冲程的动态过程，理解内能与机械能的转化。',
    knowledgePointId: 'kp-ps-23',
  },
  {
    id: 'demo-motion-graph',
    subject: 'physics',
    name: '运动图像 s-t / v-t',
    description: '改变初速度与加速度，观察 s-t 和 v-t 图像如何联动变化。',
    knowledgePointId: 'kp-ps-3',
  },
  {
    id: 'demo-tangent',
    subject: 'math',
    name: '圆的切线性质',
    description: '拖动圆外一点，观察两条切线的切线长相等、半径与切线垂直。',
    knowledgePointId: 'kp-ms-22',
  },
  {
    id: 'demo-induction',
    subject: 'physics',
    name: '电磁感应',
    description: '移动磁铁穿过线圈，观察灵敏电流计的偏转。理解磁生电的条件。',
    knowledgePointId: 'kp-p9-26',
  },
  {
    id: 'demo-solution',
    subject: 'chemistry',
    name: '溶液配制与稀释',
    description: '改变溶质和溶剂质量，观察溶质质量分数的变化。',
    knowledgePointId: 'kp-cs-24',
  },
]

export interface ChapterGroup {
  chapter: string
  grade: string
  subject: Subject
  items: KnowledgePoint[]
}

/** 年级升序权重 */
const GRADE_ORDER: Record<string, number> = {
  七年级上: 1,
  七年级下: 2,
  八年级上: 3,
  八年级下: 4,
  九年级上: 5,
  九年级下: 6,
  九年级全一册: 7,
  九年级: 7,
}

function gradeRank(grade: string) {
  return GRADE_ORDER[grade] ?? 99
}

/** 按 学科 → 年级升序 → 章节 分组 */
export function getChapterGroups(subject?: Subject): ChapterGroup[] {
  const list = subject ? knowledgePoints.filter((k) => k.subject === subject) : knowledgePoints
  const map = new Map<string, ChapterGroup>()
  for (const kp of list) {
    const key = `${kp.subject}|${kp.grade}|${kp.chapter}`
    if (!map.has(key)) {
      map.set(key, { subject: kp.subject, grade: kp.grade, chapter: kp.chapter, items: [] })
    }
    map.get(key)!.items.push(kp)
  }
  return [...map.values()].sort(
    (a, b) => gradeRank(a.grade) - gradeRank(b.grade) || 0
  )
}

/** 年级列表（升序） */
export function getGrades(subject: Subject): string[] {
  const seen = new Set<string>()
  for (const kp of knowledgePoints) {
    if (kp.subject === subject) seen.add(kp.grade)
  }
  return [...seen].sort((a, b) => gradeRank(a) - gradeRank(b))
}

/** 全部年级（跨学科合并，升序） */
export function getAllGrades(): string[] {
  const seen = new Set<string>()
  for (const kp of knowledgePoints) seen.add(kp.grade)
  return [...seen].sort((a, b) => gradeRank(a) - gradeRank(b))
}

/** 年级段（七/八/九年级），筛选用，兼容各教材命名 */
export function getGradeLevels(): string[] {
  return ['七年级', '八年级', '九年级']
}

/** 年级段匹配：'九年级' 能匹配 九年级上/九年级下/九年级全一册/九年级 */
export function matchGradeLevel(kpGrade: string, level: string) {
  return kpGrade.startsWith(level)
}
