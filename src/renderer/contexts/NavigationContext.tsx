import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { ToolId } from '../lib/types'

interface NavigationContextValue {
  activeTool: ToolId
  switchTool: (tool: ToolId) => void
  pendingNoteAction: string | null
  clearPendingNoteAction: () => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<ToolId>('reminders')
  const [pendingNoteAction, setPendingNoteAction] = useState<string | null>(null)

  const switchTool = useCallback((tool: ToolId) => {
    setActiveTool(tool)
  }, [])

  const clearPendingNoteAction = useCallback(() => {
    setPendingNoteAction(null)
  }, [])

  useEffect(() => {
    api.onNavigate((payload) => {
      setActiveTool(payload.tool as ToolId)
      if (payload.tool === 'notes' && payload.action === 'new') {
        setPendingNoteAction('new')
      }
    })
  }, [])

  const value = useMemo(
    () => ({ activeTool, switchTool, pendingNoteAction, clearPendingNoteAction }),
    [activeTool, switchTool, pendingNoteAction, clearPendingNoteAction]
  )

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
