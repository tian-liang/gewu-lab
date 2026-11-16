import { useApp } from '../store'

export default function About() {
  const navigate = useApp((s) => s.navigate)

  return (
    <div style={{ maxWidth: 720 }}>
      <button className="btn btn-ghost" style={{ marginBottom: 20 }} onClick={() => navigate('dashboard')}>
        ← 返回首页
      </button>

      <div className="page-head">
        <p className="eyebrow">彩蛋 · 名字的由来</p>
        <h1 className="page-title" style={{ fontSize: 40, letterSpacing: '0.04em' }}>
          格物
        </h1>
        <p className="page-sub" style={{ fontSize: 16 }}>
          推究事物的道理，从中获得知识。
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--accent)' }}>
        <p className="eyebrow">出自《礼记 · 大学》</p>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            lineHeight: 2,
            margin: '8px 0 0',
            color: 'var(--ink)',
          }}
        >
          致知在格物，物格而后知至，
          <br />
          知至而后意诚，意诚而后心正。
        </p>
        <p className="small muted" style={{ margin: '14px 0 0', lineHeight: 1.9 }}>
          「格物致知」是儒家修身八条目的起点：先推究事物的原理（格物），才能获得真知（致知）。
          这是中国读书人两千年来对「如何学习」最经典的回答——不是背下来，是**弄明白**。
        </p>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="eyebrow">一段有名的公案</p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '6px 0 10px' }}>
            王阳明格竹
          </h3>
          <p style={{ margin: 0, color: 'var(--ink-2)', lineHeight: 1.9, fontSize: 14 }}>
            明代思想家王阳明年轻时，和朋友对着院子里的竹子「格」了七天七夜，想格出竹子的道理，
            结果道理没格出来，人先病倒了。后来他才悟到：**理不在事物之外，而在与事物的互动之中**——
            要观察、要动手、要验证，而不是空想。
          </p>
        </div>
        <div className="card">
          <p className="eyebrow">我们为什么取这个名字</p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '6px 0 10px' }}>
            把「格」字做成动词
          </h3>
          <p style={{ margin: 0, color: 'var(--ink-2)', lineHeight: 1.9, fontSize: 14 }}>
            数理化不是背出来的，是「格」出来的。拖动一次函数的参数看直线怎么变，
            调一次温度看分子怎么跑，改一次电阻看电流怎么走——
            <strong>每一次动手验证，都是一次格物</strong>。所以这里叫「格物实验室」。
          </p>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--accent-soft)', border: 'none' }}>
        <p className="eyebrow" style={{ color: 'var(--accent)' }}>
          写给打开这个页面的你
        </p>
        <p style={{ margin: 0, color: 'var(--accent)', lineHeight: 2, fontSize: 14.5 }}>
          这个页面没有入口，只有点开名字的人才会看到。
          <br />
          愿你学习时少一点死记硬背，多一点「格物」的好奇心——
          <br />
          看见规律的那一刻，比记住答案有意思得多。
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => navigate('lab')}>
          去实验室格一格 →
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('dashboard')}>
          回首页
        </button>
      </div>
    </div>
  )
}
