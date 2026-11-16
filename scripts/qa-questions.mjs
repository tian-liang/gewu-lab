/**
 * 题库质检脚本：结构完整性 + 答案一致性校验
 * 用法：node scripts/qa-questions.mjs
 * 退出码：0 = 通过（可有警告）；1 = 存在错误级问题
 */
import { execFileSync } from 'child_process'
import { readdirSync, writeFileSync, mkdirSync } from 'fs'

const ROOT = new URL('..', import.meta.url).pathname
const contentDir = ROOT + 'src/data/content'

// ── 1. 用 esbuild 把内容文件打成一个可导入的 bundle ──────────────
const files = readdirSync(contentDir)
  .filter((f) => f.endsWith('.ts') && f !== '_spec.ts')
  .map((f) => `${contentDir}/${f}`)

mkdirSync('/tmp/qa', { recursive: true })
const entry = '/tmp/qa/entry.ts'
writeFileSync(
  entry,
  files.map((f, i) => `import { knowledgePoints as k${i}, questions as q${i} } from '${f}'`).join('\n') +
    `\nexport const all = [${files.map((_, i) => `{ knowledgePoints: k${i}, questions: q${i} }`).join(', ')}]\n`
)

execFileSync(
  ROOT + 'node_modules/.bin/esbuild',
  [entry, '--bundle', '--format=esm', '--outfile=/tmp/qa/bundle.mjs', '--external:../../db/types'],
  { stdio: 'pipe' }
)

const { all } = await import('/tmp/qa/bundle.mjs')
const knowledgePoints = all.flatMap((m) => m.knowledgePoints)
const questions = all.flatMap((m) => m.questions)

console.log(`知识点: ${knowledgePoints.length}　题目: ${questions.length}`)

// ── 2. 校验规则 ──────────────────────────────────────────
const errors = []
const warns = []
const err = (msg) => errors.push(msg)
const warn = (msg) => warns.push(msg)

// 2.1 ID 唯一性
const kpIds = new Set()
for (const kp of knowledgePoints) {
  if (kpIds.has(kp.id)) err(`知识点 ID 重复: ${kp.id}`)
  kpIds.add(kp.id)
}
const qIds = new Set()
for (const q of questions) {
  if (qIds.has(q.id)) err(`题目 ID 重复: ${q.id}`)
  qIds.add(q.id)
}

// 2.2 知识点结构
for (const kp of knowledgePoints) {
  if (!kp.name?.trim()) err(`${kp.id}: 名称为空`)
  if (!kp.definition?.trim()) err(`${kp.id} (${kp.name}): definition 为空`)
  if (!kp.intuition?.trim()) warn(`${kp.id} (${kp.name}): intuition 为空`)
  if (!Array.isArray(kp.formulas)) err(`${kp.id}: formulas 不是数组`)
  if (!Array.isArray(kp.mistakes)) err(`${kp.id}: mistakes 不是数组`)
  if (!Array.isArray(kp.examples)) err(`${kp.id}: examples 不是数组`)
  if (kp.examples?.length === 0) warn(`${kp.id} (${kp.name}): 无例题`)
  if ((kp.mistakes?.length ?? 0) < 1) warn(`${kp.id} (${kp.name}): 易错点少于 1 条`)

  // 例题结构：必须有 problem、≥2 步 steps、answer
  for (const [i, ex] of (kp.examples ?? []).entries()) {
    if (!ex.problem?.trim()) err(`${kp.id} 例题${i + 1}: problem 为空`)
    if (!Array.isArray(ex.steps) || ex.steps.length < 2) err(`${kp.id} 例题${i + 1}: steps 不足 2 条`)
    if (!ex.answer?.trim()) err(`${kp.id} 例题${i + 1}: answer 为空`)
  }

  // LaTeX 公式语法：花括号配对、$ 不裸露、空公式
  for (const [i, f] of (kp.formulas ?? []).entries()) {
    if (!f.trim()) {
      err(`${kp.id} 公式${i + 1}: 为空`)
      continue
    }
    let depth = 0
    for (const ch of f) {
      if (ch === '{') depth++
      if (ch === '}') depth--
      if (depth < 0) break
    }
    if (depth !== 0) err(`${kp.id} 公式${i + 1}: 花括号不配对 → ${f.slice(0, 40)}`)
    if (/\\\\[a-zA-Z]+\s*$/.test(f)) warn(`${kp.id} 公式${i + 1}: 末尾疑似截断的命令 → ${f.slice(-20)}`)
    // 常见 typo：连续两个反斜杠命令间无空格导致无法渲染
    if (/[a-zA-Z]\\\\[a-zA-Z]/.test(f)) warn(`${kp.id} 公式${i + 1}: 命令粘连 → ${f.slice(0, 40)}`)
  }
}

// 2.3 题目结构 + 答案
const VALID_ERR = new Set(['concept', 'calculation', 'reading', 'method'])
const VALID_DIFF = new Set(['basic', 'advanced', 'challenge'])
const LET = ['A', 'B', 'C', 'D']

for (const q of questions) {
  const tag = `${q.id}`
  if (!q.stem?.trim()) err(`${tag}: 题干为空`)
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    err(`${tag}: 选项数 = ${q.options?.length ?? 0}（应为 4）`)
    continue
  }
  if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) {
    err(`${tag}: answerIndex = ${q.answerIndex}（应为 0-3）`)
    continue
  }
  if (!q.explanation?.trim()) err(`${tag}: 解析为空`)
  if (!VALID_ERR.has(q.errorTypeHint)) err(`${tag}: errorTypeHint 非法 (${q.errorTypeHint})`)
  if (!VALID_DIFF.has(q.difficulty)) err(`${tag}: difficulty 非法 (${q.difficulty})`)
  if (!kpIds.has(q.knowledgePointId)) err(`${tag}: knowledgePointId 悬空 (${q.knowledgePointId})`)
  if (q.subject !== 'math' && q.subject !== 'physics' && q.subject !== 'chemistry') {
    err(`${tag}: subject 非法 (${q.subject})`)
  }

  // 选项重复（仅归一化空白与全半角括号，保留数学符号差异）
  const norm = (s) =>
    String(s).replace(/\s+/g, '').replace(/（/g, '(').replace(/）/g, ')')
  const seen = new Map()
  q.options.forEach((o, i) => {
    const k = norm(o)
    if (seen.has(k)) err(`${tag}: 选项 ${LET[seen.get(k)]} 与 ${LET[i]} 内容重复 ("${o}")`)
    else seen.set(k, i)
    if (!String(o).trim()) err(`${tag}: 选项 ${LET[i]} 为空`)
  })

  // 答案字母一致性：解析里"故选X / 答案是X / 选X / 正确答案是X"与 answerIndex 比对
  const exp = q.explanation
  const patterns = [
    /故选\s*([A-D])/,
    /答案(?:是|为|选)\s*([A-D])/,
    /选\s*([A-D])\s*(?:项|是正确|正确|$)/,
    /正确答案(?:是|为)\s*([A-D])/,
    /^\s*([A-D])\s*[.。、]/,
  ]
  for (const re of patterns) {
    const m = exp.match(re)
    if (m) {
      const said = LET.indexOf(m[1])
      if (said !== q.answerIndex && said >= 0) {
        err(`${tag}: 解析说"选 ${m[1]}"，但 answerIndex=${LET[q.answerIndex]}`)
      }
      break
    }
  }

  // 正确选项 vs 错误选项的解析提及（弱启发式）：解析里出现"选项 X 错"但 X 是正确答案
  const wrongMentions = [...exp.matchAll(/[选选项]{0,2}\s*([A-D])\s*(?:错|不对|不正确|错误)/g)]
  for (const wm of wrongMentions) {
    const said = LET.indexOf(wm[1])
    if (said === q.answerIndex) {
      warn(`${tag}: 解析把正确选项 ${wm[1]} 说成"错"，请人工确认`)
    }
  }
}

// 2.4 覆盖检查：每个知识点至少 1 题
const byKp = new Map()
for (const q of questions) {
  byKp.set(q.knowledgePointId, (byKp.get(q.knowledgePointId) ?? 0) + 1)
}
for (const kp of knowledgePoints) {
  const n = byKp.get(kp.id) ?? 0
  if (n === 0) warn(`${kp.id} (${kp.name}): 没有配套题目`)
  else if (n < 3) warn(`${kp.id} (${kp.name}): 只有 ${n} 题`)
}

// 2.5 题干雷同（完全相同）
const stemMap = new Map()
for (const q of questions) {
  const k = q.stem.trim()
  if (stemMap.has(k)) warn(`题干重复: ${stemMap.get(k)} 与 ${q.id}`)
  else stemMap.set(k, q.id)
}

// ── 3. 报告 ──────────────────────────────────────────────
console.log(`\n错误 ${errors.length} 条　警告 ${warns.length} 条`)
if (errors.length) {
  console.log('\n── 错误（必须修复）──')
  errors.slice(0, 40).forEach((e) => console.log('  ✗ ' + e))
  if (errors.length > 40) console.log(`  …另有 ${errors.length - 40} 条`)
}
if (warns.length) {
  console.log('\n── 警告（建议检查）──')
  warns.slice(0, 30).forEach((w) => console.log('  ⚠ ' + w))
  if (warns.length > 30) console.log(`  …另有 ${warns.length - 30} 条`)
}

writeFileSync(
  'scripts/qa-report.md',
  [
    '# 题库质检报告',
    '',
    `知识点 ${knowledgePoints.length}　题目 ${questions.length}`,
    `错误 ${errors.length}　警告 ${warns.length}`,
    '',
    '## 错误',
    ...errors.map((e) => `- ${e}`),
    '',
    '## 警告',
    ...warns.map((w) => `- ${w}`),
  ].join('\n')
)
console.log('\n报告写入 scripts/qa-report.md')
process.exit(errors.length ? 1 : 0)
