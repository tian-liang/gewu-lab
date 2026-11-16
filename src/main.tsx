import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// 注册 Service Worker（生产环境或 ?sw=1 显式启用）
// 路径基于 BASE_URL，兼容 GitHub Pages 子路径部署
if ('serviceWorker' in navigator && (import.meta.env.PROD || location.search.includes('sw=1'))) {
  window.addEventListener('load', () => {
    const swUrl = import.meta.env.BASE_URL + 'sw.js'
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        const sendCacheUrls = () => {
          const urls = performance
            .getEntriesByType('resource')
            .map((e) => (e as PerformanceResourceTiming).name)
            .filter((u) => u.startsWith(location.origin) && !u.includes('sw.js'))
          reg.active?.postMessage({ type: 'CACHE_URLS', urls })
        }
        if (reg.active) sendCacheUrls()
        reg.addEventListener('activate', () => setTimeout(sendCacheUrls, 500))
        navigator.serviceWorker.addEventListener('controllerchange', () => setTimeout(sendCacheUrls, 500))
      })
      .catch((err) => {
        console.warn('SW registration failed:', err)
      })
  })
}
