import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppState } from '@shared/types'
import { api } from '../api/client'
import { applyDarkMode } from '../lib/theme'

interface AppStateContextValue {
  state: AppState | null
  setState: (state: AppState) => void
  refreshState: () => Promise<void>
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null)

  const refreshState = useCallback(async () => {
    const next = await api.getState()
    setState(next)
    applyDarkMode(next.settings)
  }, [])

  useEffect(() => {
    void refreshState()
    api.onStateChanged((next) => {
      setState(next)
      applyDarkMode(next.settings)
    })
  }, [refreshState])

  const value = useMemo(
    () => ({ state, setState, refreshState }),
    [state, refreshState]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppStateContext(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppStateContext must be used within AppStateProvider')
  return ctx
}

export function useAppState(): AppState | null {
  return useAppStateContext().state
}
