import { Suspense, lazy, useEffect, useState, type LazyExoticComponent, type ReactElement } from 'react'
import type { Reminder } from '@shared/types'
import { api } from './api/client'
import { AppStateProvider } from './contexts/AppStateContext'
import { NavigationProvider, useNavigation } from './contexts/NavigationContext'
import { ToastProvider } from './contexts/ToastContext'
import { Sidebar } from './components/layout/Sidebar'
import { AppHeader } from './components/layout/AppHeader'
import { Toast } from './components/common/Toast'
import { ReminderDialog } from './components/common/ReminderDialog'
import type { ToolId } from './lib/types'

const RemindersPage = lazy(() => import('./features/reminders/RemindersPage'))
const TodoPage = lazy(() => import('./features/todo/TodoPage'))
const WorkTasksPage = lazy(() => import('./features/work-tasks/WorkTasksPage'))
const StatsPage = lazy(() => import('./features/stats/StatsPage'))
const ClipboardPage = lazy(() => import('./features/clipboard/ClipboardPage'))
const NotesPage = lazy(() => import('./features/notes/NotesPage'))
const EyeBreakPage = lazy(() => import('./features/eye/EyeBreakPage'))
const ShortcutsPage = lazy(() => import('./features/shortcuts/ShortcutsPage'))
const MonitorPage = lazy(() => import('./features/monitor/MonitorPage'))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'))
const AboutPage = lazy(() => import('./features/about/AboutPage'))

const PAGES: Record<ToolId, LazyExoticComponent<() => ReactElement>> = {
  reminders: RemindersPage,
  todo: TodoPage,
  'work-tasks': WorkTasksPage,
  stats: StatsPage,
  clipboard: ClipboardPage,
  notes: NotesPage,
  eye: EyeBreakPage,
  shortcuts: ShortcutsPage,
  monitor: MonitorPage,
  settings: SettingsPage,
  about: AboutPage
}

function PageRouter() {
  const { activeTool } = useNavigation()
  const Page = PAGES[activeTool]

  return (
    <Suspense fallback={<section className="tab-page active" />}>
      <Page />
    </Suspense>
  )
}

function AppShell() {
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null)

  useEffect(() => {
    api.onReminder(setActiveReminder)
    api.onReminderDismiss(() => setActiveReminder(null))
  }, [])

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <AppHeader />
        <main className="tool-content">
          <PageRouter />
        </main>
      </div>
      <ReminderDialog reminder={activeReminder} onClose={() => setActiveReminder(null)} />
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppStateProvider>
        <NavigationProvider>
          <AppShell />
        </NavigationProvider>
      </AppStateProvider>
    </ToastProvider>
  )
}
