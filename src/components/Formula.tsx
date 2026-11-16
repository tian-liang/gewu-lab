import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  tex: string
  block?: boolean
}

export function Formula({ tex, block = true }: Props) {
  let html = ''
  try {
    html = katex.renderToString(tex, {
      throwOnError: false,
      displayMode: block,
    })
  } catch {
    html = tex
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
