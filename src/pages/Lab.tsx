import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react'
import { useApp } from '../store'
import { demoConfigs } from '../data/knowledge'
import { subjectLabel, subjectClass } from '../utils'
import ErrorBoundary from '../components/ErrorBoundary'

// 16 个演示组件按需加载（代码拆分）
const demoComponents: Record<string, ComponentType> = {
  'demo-linear': lazy(() => import('../demos/LinearDemo')),
  'demo-quadratic': lazy(() => import('../demos/QuadraticDemo')),
  'demo-pythagoras': lazy(() => import('../demos/PythagorasDemo')),
  'demo-probability': lazy(() => import('../demos/ProbabilityDemo')),
  'demo-trig': lazy(() => import('../demos/TrigDemo')),
  'demo-force': lazy(() => import('../demos/ForceDemo')),
  'demo-circuit': lazy(() => import('../demos/CircuitDemo')),
  'demo-lens': lazy(() => import('../demos/LensDemo')),
  'demo-optics': lazy(() => import('../demos/OpticsDemo')),
  'demo-particles': lazy(() => import('../demos/ParticleDemo')),
  'demo-atom': lazy(() => import('../demos/AtomDemo')),
  'demo-heat-engine': lazy(() => import('../demos/HeatEngineDemo')),
  'demo-motion-graph': lazy(() => import('../demos/MotionGraphDemo')),
  'demo-tangent': lazy(() => import('../demos/TangentDemo')),
  'demo-induction': lazy(() => import('../demos/InductionDemo')),
  'demo-solution': lazy(() => import('../demos/SolutionDemo')),
}

function readHash(): { demoId: string | null; params: URLSearchParams } {
  const raw = location.hash.replace(/^#/, '')
  const params = new URLSearchParams(raw)
  return { demoId: params.get('demo'), params }
}

export default function Lab() {
  const { currentDemoId, navigate } = useApp()
  const [active, setActive] = useState<string>(() => readHash().demoId ?? currentDemoId ?? 'demo-linear')
  const demo = demoConfigs.find((d) => d.id === active)
  const DemoComp = demoComponents[active]

  useEffect(() => {
    const { params } = readHash()
    params.set('demo', active)
    const hash = `#${params.toString()}`
    if (location.hash !== hash) history.replaceState(null, '', hash)
  }, [active])

  useEffect(() => {
    const onHash = () => {
      const { demoId } = readHash()
      if (demoId && demoComponents[demoId]) setActive(demoId)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div>
      <div className="page-head">
        <p className="eyebrow">动态实验室</p>
        <h1 className="page-title">拖动参数，看懂过程</h1>
        <p className="page-sub">不是看视频——是自己动手验证猜想。</p>
      </div>

      <div className="filter-row">
        {demoConfigs.map((d) => (
          <button
            key={d.id}
            className={`filter-chip ${active === d.id ? 'active' : ''}`}
            onClick={() => setActive(d.id)}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="lab-layout">
        <div>
          <ErrorBoundary>
            <Suspense fallback={<div className="empty" style={{ padding: 40 }}>演示加载中…</div>}>
              {DemoComp && <DemoComp />}
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className="lab-controls">
          <div className="card">
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {demo && (
                <span className={`chip ${subjectClass(demo.subject)}`}>
                  {subjectLabel(demo.subject)}
                </span>
              )}
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '0 0 10px' }}>
              {demo?.name}
            </h3>
            <p className="small" style={{ color: 'var(--ink-2)', margin: 0, lineHeight: 1.8 }}>
              {demo?.description}
            </p>
          </div>

          <div className="card">
            <p className="eyebrow">怎么玩</p>
            <ol className="small" style={{ color: 'var(--ink-2)', margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
              <li>拖动右侧滑杆，观察画面的即时变化</li>
              <li>记录你看到的规律，先猜再验证</li>
              <li>把结论写下来，去知识点里对答案</li>
            </ol>
          </div>

          <div className="card">
            <p className="eyebrow">学以致用</p>
            <button
              className="btn btn-primary btn-block"
              onClick={() => navigate('knowledge-detail', { kpId: demo?.knowledgePointId })}
            >
              查看相关知识点
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => navigate('practice')}>
              去做练习题
            </button>
          </div>

          <div className="card" style={{ background: 'var(--accent-soft)', border: 'none' }}>
            <p className="small" style={{ margin: 0, color: 'var(--accent)', lineHeight: 1.7 }}>
              <strong>提示：</strong>把演示链接分享给同学——参数会保留在 URL 里，对方打开就能看到你调的状态。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
