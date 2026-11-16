import { readFileSync, writeFileSync, readdirSync } from 'fs'

// ── 加载现有知识点 ──────────────────────────────
const files = readdirSync('src/data/content')
  .filter((f) => f.endsWith('.ts') && f !== '_spec.ts')
  .map((f) => 'src/data/content/' + f)
const kpNames = []
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  const re = /id: '(kp-[^']+)',\s*subject: '([^']+)',\s*grade: '([^']+)',\s*chapter: '([^']+)',\s*name: '([^']+)'/g
  let m
  while ((m = re.exec(text))) {
    kpNames.push({ id: m[1], subject: m[2], grade: m[3], chapter: m[4], name: m[5] })
  }
}
console.log(`现有知识点: ${kpNames.length}`)

// ── 参照清单 ──────────────────────────────────
const ref = JSON.parse(readFileSync('scripts/zhongkao-reference.json', 'utf8'))

// ── 模糊匹配 ──────────────────────────────────
function norm(s) {
  return s.replace(/[的与和及其、（）()、，,。.：:：]/g, '').toLowerCase()
}
function score(a, b) {
  const na = norm(a), nb = norm(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.9
  // 字符重合度
  const setA = new Set(na), setB = new Set(nb)
  let inter = 0
  for (const ch of setA) if (setB.has(ch)) inter++
  const union = new Set([...setA, ...setB]).size
  return inter / union
}

const report = { math: [], physics: [], chemistry: [] }
const subjectMap = { math: 'math', physics: 'physics', chemistry: 'chemistry' }

for (const [subj, chapters] of Object.entries(ref)) {
  if (subj === 'note') continue
  const code = subjectMap[subj]
  for (const [chapter, items] of Object.entries(chapters)) {
    for (const item of items) {
      const candidates = kpNames.filter((k) => k.subject === code)
      let best = 0, bestKp = null
      for (const kp of candidates) {
        const s = Math.max(score(item, kp.name), score(item, kp.chapter + kp.name))
        if (s > best) { best = s; bestKp = kp }
      }
      const status = best >= 0.6 ? 'covered' : best >= 0.4 ? 'partial' : 'missing'
      report[subj].push({ chapter, item, status, best: +best.toFixed(2), match: bestKp?.name ?? null })
    }
  }
}

// ── 输出 ──────────────────────────────────────
const lines = ['# 中考考点覆盖度对照报告', '']
let totalC = 0, totalP = 0, totalM = 0
for (const subj of ['math', 'physics', 'chemistry']) {
  const rows = report[subj]
  const c = rows.filter((r) => r.status === 'covered').length
  const p = rows.filter((r) => r.status === 'partial').length
  const m = rows.filter((r) => r.status === 'missing').length
  totalC += c; totalP += p; totalM += m
  lines.push(`## ${subj}　覆盖 ${c}　部分 ${p}　缺失 ${m}　（共 ${rows.length} 项）`)
  lines.push('')
  lines.push('### 缺失（优先补齐）')
  for (const r of rows.filter((x) => x.status === 'missing')) {
    lines.push(`- [${r.chapter}] ${r.item}`)
  }
  lines.push('')
  lines.push('### 部分覆盖（建议加厚）')
  for (const r of rows.filter((x) => x.status === 'partial')) {
    lines.push(`- [${r.chapter}] ${r.item}　↔ 现有「${r.match}」相似度 ${r.best}`)
  }
  lines.push('')
}
lines.unshift(`> 合计：覆盖 ${totalC}　部分 ${totalP}　缺失 ${totalM}　（参照 ${totalC + totalP + totalM} 项）`, '')
writeFileSync('scripts/gap-report.md', lines.join('\n'))
console.log(`覆盖 ${totalC}　部分 ${totalP}　缺失 ${totalM}`)
console.log('报告写入 scripts/gap-report.md')
