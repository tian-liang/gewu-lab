import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const shots = '/tmp/gewu-shots2'
mkdirSync(shots, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (err) => errors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: `${shots}/1-dashboard.png`, fullPage: true })
console.log('✓ dashboard')

// 知识地图 - 展开章节
await page.click('text=知识地图')
await page.waitForTimeout(400)
await page.screenshot({ path: `${shots}/2-knowledge.png`, fullPage: true })
console.log('✓ knowledge map')

// 切换到物理
await page.click('button.filter-chip:has-text("物理")')
await page.waitForTimeout(300)
// 展开某一章
const chapters = page.locator('.card > button')
const count = await chapters.count()
console.log('章节数:', count)
if (count > 1) {
  await chapters.nth(1).click()
  await page.waitForTimeout(300)
}
await page.screenshot({ path: `${shots}/3-knowledge-physics.png`, fullPage: true })
console.log('✓ knowledge physics')

// 点进一个知识点
const kpCards = page.locator('.kp-card')
if ((await kpCards.count()) > 0) {
  await kpCards.first().click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${shots}/4-kp-detail.png`, fullPage: true })
  console.log('✓ kp detail')
}

// 练习中心 - 新的选择范围页
await page.click('text=练习中心')
await page.waitForTimeout(400)
await page.screenshot({ path: `${shots}/5-practice-select.png`, fullPage: true })
console.log('✓ practice select')

// 选数学
await page.click('button.filter-chip:has-text("数学")')
await page.waitForTimeout(200)
// 选一个章节（第一个非"全部章节"）
const chapterChips = page.locator('.filter-chip')
const cc = await chapterChips.count()
console.log('filter chips:', cc)
// 开始练习
await page.click('text=开始随机 10 题')
await page.waitForTimeout(500)
await page.screenshot({ path: `${shots}/6-practice-q.png`, fullPage: true })
console.log('✓ practice question')

// 答一题
const options = page.locator('.option')
if ((await options.count()) > 0) {
  await options.first().click()
  await page.click('text=提交答案')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${shots}/7-practice-answer.png`, fullPage: true })
  console.log('✓ answered')
}

// 实验室
await page.click('text=动态实验室')
await page.waitForTimeout(600)
await page.screenshot({ path: `${shots}/8-lab.png`, fullPage: true })
console.log('✓ lab')

// 错题本
await page.click('text=错题本')
await page.waitForTimeout(400)
await page.screenshot({ path: `${shots}/9-mistakes.png`, fullPage: true })
console.log('✓ mistakes')

// 我的
await page.click('text=我的')
await page.waitForTimeout(400)
await page.screenshot({ path: `${shots}/10-profile.png`, fullPage: true })
console.log('✓ profile')

await browser.close()
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ALL PAGES VERIFIED, no console errors')
