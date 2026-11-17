import { Suspense, lazy, useEffect, useState } from 'react'
import { useApp, type Route } from './store'
import ErrorBoundary from './components/ErrorBoundary'
import SearchBox from './components/SearchBox'
import { initContent } from './data/knowledge'
import { initQuestions } from './data/questions'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const KnowledgeMap = lazy(() => import('./pages/KnowledgeMap'))
const KnowledgeDetail = lazy(() => import('./pages/KnowledgeDetail'))
const Lab = lazy(() => import('./pages/Lab'))
const Practice = lazy(() => import('./pages/Practice'))
const Mistakes = lazy(() => import('./pages/Mistakes'))
const Profile = lazy(() => import('./pages/Profile'))
const About = lazy(() => import('./pages/About'))

const navItems: { id: Route; label: string; icon: string }[] = [
  { id: 'dashboard', label: '首页', icon: '◎' },
  { id: 'knowledge', label: '知识地图', icon: '◈' },
  { id: 'lab', label: '动态实验室', icon: '◐' },
  { id: 'practice', label: '练习中心', icon: '✎' },
  { id: 'mistakes', label: '错题本', icon: '✧' },
  { id: 'profile', label: '我的', icon: '◇' },
]

function isActive(current: Route, nav: Route) {
  if (nav === 'knowledge' && (current === 'knowledge' || current === 'knowledge-detail')) return true
  return current === nav
}

function PageFallback() {
  return (
    <div className="empty" style={{ padding: 60 }}>
      <div className="empty-icon">◎</div>
      <p>加载中…</p>
    </div>
  )
}

export default function App() {
  const { route, navigate, offlineReady, setOfflineReady } = useApp()
  const [ready, setReady] = useState(false)

  // 内容与题库模块动态加载（代码拆分）
  useEffect(() => {
    Promise.all([initContent(), initQuestions()]).then(() => setReady(true))
  }, [])

  // 离线缓存就绪状态：SW 回执 或 直接检查缓存条目（回访/离线场景）
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'CACHE_READY') setOfflineReady(true)
    }
    navigator.serviceWorker?.addEventListener('message', onMsg)
    if ('caches' in window) {
      caches.keys().then(async (keys) => {
        let total = 0
        for (const k of keys.filter((k) => k.startsWith('gewu-lab-'))) {
          total += (await (await caches.open(k)).keys()).length
        }
        if (total >= 4) setOfflineReady(true)
      })
    }
    return () => navigator.serviceWorker?.removeEventListener('message', onMsg)
  }, [setOfflineReady])

  // 带 #demo= 的分享链接直接进入实验室
  useEffect(() => {
    if (location.hash.includes('demo=')) navigate('lab')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 跨页跳转后回到顶部（做相关练习、打开演示、侧栏导航等）
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div
          className="brand"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="格物——点击了解名字的由来"
          onClick={() => navigate('about')}
        >
          <span className="brand-name">格物</span>
          <span className="brand-tag">GEWU LAB</span>
        </div>
        <SearchBox />
        <nav className="nav-group">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${isActive(route, item.id) ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: '12px' }}>
          <p className="small muted" style={{ margin: 0, lineHeight: 1.6 }}>
            数据保存在本机浏览器
            {offlineReady && (
              <span
                title="离线资源已就绪，断网可用"
                style={{ marginLeft: 6, display: 'inline-flex', verticalAlign: 'middle' }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6.5 18a4 4 0 0 1-.4-7.97A6 6 0 0 1 17.7 9.2 3.5 3.5 0 0 1 17 18z" />
                  <path d="M9.2 13.6l2.1 2.1 3.9-4" />
                </svg>
              </span>
            )}
            <br />
            记得定期导出备份
          </p>
        </div>
      </aside>
      <main className="main">
        <ErrorBoundary>
          {!ready ? (
            <div className="empty" style={{ padding: 80 }}>
              <div className="empty-icon">◎</div>
              <p>格物实验室加载中…</p>
              <div className="progress-track" style={{ maxWidth: 220, margin: '16px auto' }}>
                <div className="progress-fill" style={{ width: '60%', animation: 'none' }} />
              </div>
            </div>
          ) : (
            <Suspense fallback={<PageFallback />}>
              {route === 'dashboard' && <Dashboard />}
              {route === 'knowledge' && <KnowledgeMap />}
              {route === 'knowledge-detail' && <KnowledgeDetail />}
              {route === 'lab' && <Lab />}
              {route === 'practice' && <Practice />}
              {route === 'mistakes' && <Mistakes />}
              {route === 'profile' && <Profile />}
              {route === 'about' && <About />}
            </Suspense>
          )}
        </ErrorBoundary>
      </main>
    </div>
  )
}
