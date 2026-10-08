import { app, globalShortcut } from 'electron'
import { registerTodoImageProtocol, registerTodoImageScheme } from './storage/todo-images'
import { APP_NAME } from '../shared/constants'
import { registerIpcHandlers, triggerQuickNote } from './ipc/handlers'
import {
  getState,
  handleAction,
  initReminderService,
  onActivateRecreateWindow,
  onWindowHidden,
  startTimer
} from './reminder/timer'
import { initScheduledReminders, startScheduledReminders } from './reminder/scheduled'
import { initEyeBreak, startEyeBreak } from './reminder/eye-break'
import { initClipboardWatcher, startClipboardWatcher } from './clipboard/watcher'
import { initNotes } from './notes/index'
import { initWorkTasks } from './work-tasks/index'
import { initShortcuts, unregisterAllShortcuts } from './shortcuts/registry'
import { initTray } from './tray'
import { createFloatingBall, updateFloatingBallVisibility } from './floating-ball'
import { createWindow, showMainWindow, setQuitting, getMainWindow, sendToRenderer, hideMainWindow } from './window'
import { IPC } from '../shared/ipc-channels'

registerTodoImageScheme()
app.setName(APP_NAME)
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_NAME)
}

function toggleRunning(): void {
  const current = getState()
  handleAction(current.running ? 'pause' : 'start')
}

function toggleWindow(): void {
  const win = getMainWindow()
  if (!win) return
  if (win.isVisible() && !win.isMinimized()) {
    hideMainWindow()
  } else {
    showMainWindow()
  }
}

function navigateTool(tool: string, action?: string): void {
  showMainWindow()
  sendToRenderer(IPC.NAVIGATE, { tool, action })
}

function bootstrap(): void {
  initReminderService({
    onToggle: toggleRunning,
    onQuit: () => app.quit()
  })

  registerTodoImageProtocol()
  createWindow(onWindowHidden)
  const state = getState()
  createFloatingBall(state.settings.showFloatingBall, state.settings.floatingBallSize)
  initTray(toggleRunning, showMainWindow, () => app.quit(), (tool) => navigateTool(tool))
  registerIpcHandlers()
  startTimer()
  initScheduledReminders()
  startScheduledReminders()
  initEyeBreak()
  startEyeBreak()
  initClipboardWatcher()
  startClipboardWatcher()
  initNotes()
  initWorkTasks()
  initShortcuts({
    toggleWindow,
    quickNote: () => {
      triggerQuickNote()
      navigateTool('notes', 'new')
    },
    markWater: () => handleAction('done', { type: 'water' }),
    markStand: () => handleAction('done', { type: 'stand' })
  })
}

app.whenReady().then(bootstrap)

app.on('activate', () => {
  onActivateRecreateWindow(() => createWindow(onWindowHidden))
})

app.on('will-quit', () => {
  unregisterAllShortcuts()
})

app.on('before-quit', () => {
  setQuitting(true)
})
