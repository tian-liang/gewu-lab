/* 格物实验室 Service Worker：离线缓存（兼容子路径部署） */
const CACHE_VERSION = 'gewu-lab-v1'
const SHELL_CACHE = CACHE_VERSION + '-shell'
const RUNTIME_CACHE = CACHE_VERSION + '-runtime'

// 部署基路径：GitHub Pages 子路径下 scope 形如 /<repo>/
const BASE = self.registration.scope

const STATIC_RE = /\.(js|css|woff2?|png|jpg|svg|webp)$/

// 安装：预缓存应用外壳及其引用的入口资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await cache.addAll([BASE])
      try {
        const res = await fetch(BASE, { cache: 'reload' })
        const html = await res.text()
        const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
          .map((m) => m[1])
          .filter((u) => u.includes('assets/') || u.includes('fonts/'))
          .map((u) => new URL(u, BASE).href)
        await cache.addAll(urls)
      } catch (e) {
        // 入口解析失败不阻塞安装
      }
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('gewu-lab-') && k !== SHELL_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

// 页面加载完成后，把已下载的同源资源补进缓存（覆盖懒加载 chunk）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        let ok = 0
        for (const url of event.data.urls) {
          try {
            const res = await fetch(url)
            if (res.ok) {
              await cache.put(url, res)
              ok++
            }
          } catch (e) {
            /* 单个失败忽略 */
          }
        }
        // 回执：首批资源缓存完成
        event.source?.postMessage({ type: 'CACHE_READY', count: ok })
      })
    )
  }
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // 导航：网络优先，离线回退缓存外壳
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone()
          caches.open(SHELL_CACHE).then((c) => c.put(BASE, clone))
          return res
        })
        .catch(() => caches.match(BASE))
    )
    return
  }

  // 静态资源：缓存优先
  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(RUNTIME_CACHE).then((c) => c.put(req, clone))
            }
            return res
          })
      )
    )
    return
  }

  // 其余：网络优先，失败回退缓存
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && url.pathname.startsWith(new URL(BASE).pathname)) {
          const clone = res.clone()
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, clone))
        }
        return res
      })
      .catch(() => caches.match(req))
  )
})
