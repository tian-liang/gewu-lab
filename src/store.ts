import { create } from 'zustand'

export type Route =
  | 'dashboard'
  | 'knowledge'
  | 'knowledge-detail'
  | 'lab'
  | 'practice'
  | 'mistakes'
  | 'profile'
  | 'about'

interface AppState {
  route: Route
  currentKpId: string | null
  currentDemoId: string | null
  offlineReady: boolean
  setOfflineReady: (v: boolean) => void
  navigate: (route: Route, opts?: { kpId?: string; demoId?: string }) => void
}

export const useApp = create<AppState>((set) => ({
  route: 'dashboard',
  currentKpId: null,
  currentDemoId: null,
  offlineReady: false,
  setOfflineReady: (v) => set({ offlineReady: v }),
  navigate: (route, opts) =>
    set({
      route,
      currentKpId: opts?.kpId ?? null,
      currentDemoId: opts?.demoId ?? null,
    }),
}))
