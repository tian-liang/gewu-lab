/** 在 maxWidth 内自动缩小字号绘制文本，避免窄屏溢出 */
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font = '12px sans-serif'
) {
  const sizeMatch = font.match(/(\d+(?:\.\d+)?)px/)
  if (!sizeMatch) {
    ctx.fillText(text, x, y)
    return
  }
  let size = parseFloat(sizeMatch[1])
  const original = size
  while (size > 8) {
    ctx.font = font.replace(/\d+(?:\.\d+)?px/, `${size}px`)
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 1
  }
  ctx.fillText(text, x, y)
  ctx.font = font.replace(/\d+(?:\.\d+)?px/, `${original}px`)
}

/** 多行文本：按 maxWidth 自动换行 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 18
) {
  let line = ''
  let cy = y
  for (const ch of text) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy)
      line = ch
      cy += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
  return cy
}
