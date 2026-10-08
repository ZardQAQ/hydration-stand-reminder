import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import type {
  ActionPayload,
  NoteInput,
  SettingsInput,
  ShortcutActionId,
  TimerAction,
  TodoInput,
  WorkTaskInput
} from '../../shared/types'
import { getSystemInfo } from '../system/info'
import { checkMonitorAlert } from '../system/monitor-alert'
import { loadHistory } from '../storage/history'
import {
  clearAllClipboard,
  copyClipboardItem,
  getClipboardItems,
  removeClipboardItem,
  togglePinClipboardItem,
  reloadClipboardFromSettings
} from '../clipboard/watcher'
import { createEmptyNote, deleteNote, getNotes, saveNote } from '../notes/index'
import {
  clearDoneWorkTasks,
  deleteWorkTask,
  getWorkTasks,
  saveWorkTask,
  toggleWorkTask
} from '../work-tasks/index'
import {
  dismissReminder,
  getState,
  handleAction,
  resetSettings,
  testReminder,
  updateSettings
} from '../reminder/timer'
import { deleteTodo, getTodos, saveTodo } from '../reminder/scheduled'
import { downloadTodoImage } from '../storage/todo-images'
import { onEyeSettingsChanged } from '../reminder/eye-break'
import {
  getShortcuts,
  resetShortcutBindings,
  updateShortcutBinding
} from '../shortcuts/registry'
import { clearAllUserData } from '../data/clear-all'
import { getMainWindow, toggleMainWindow } from '../window'
import { updateFloatingBallVisibility, resizeFloatingBall } from '../floating-ball'
import { ackFloatingReminder } from '../floating-reminder'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.STATE_GET, () => getState())

  ipcMain.handle(IPC.REMINDER_DISMISS, () => {
    dismissReminder()
    return true
  })

  ipcMain.handle(IPC.SETTINGS_UPDATE, (_event, settings: SettingsInput) => {
    const next = updateSettings(settings)
    reloadClipboardFromSettings()
    onEyeSettingsChanged(next.settings.enableEyeBreak, next.settings.eyeInterval)
    updateFloatingBallVisibility(next)
    return next
  })

  ipcMain.handle(IPC.SETTINGS_RESET, () => {
    const next = resetSettings()
    reloadClipboardFromSettings()
    onEyeSettingsChanged(next.settings.enableEyeBreak, next.settings.eyeInterval)
    updateFloatingBallVisibility(next)
    return next
  })

  ipcMain.handle(IPC.TIMER_ACTION, (_event, action: TimerAction, payload?: ActionPayload) =>
    handleAction(action, payload ?? {})
  )

  ipcMain.handle(IPC.SYSTEM_INFO, async () => {
    const info = await getSystemInfo()
    checkMonitorAlert(info)
    return info
  })

  ipcMain.handle(IPC.HISTORY_GET, () => loadHistory())

  ipcMain.handle(IPC.REMINDER_TEST, () => testReminder())

  ipcMain.handle(IPC.TODO_LIST, () => getTodos())
  ipcMain.handle(IPC.TODO_SAVE, (_event, input: TodoInput) => saveTodo(input))
  ipcMain.handle(IPC.TODO_DELETE, (_event, id: string) => deleteTodo(id))
  ipcMain.handle(IPC.TODO_DOWNLOAD_IMAGE, (_event, id: string, suggestedName?: string) =>
    downloadTodoImage(id, suggestedName, getMainWindow())
  )

  ipcMain.handle(IPC.WORK_TASK_LIST, () => getWorkTasks())
  ipcMain.handle(IPC.WORK_TASK_SAVE, (_event, input: WorkTaskInput) => saveWorkTask(input))
  ipcMain.handle(IPC.WORK_TASK_TOGGLE, (_event, id: string) => toggleWorkTask(id))
  ipcMain.handle(IPC.WORK_TASK_DELETE, (_event, id: string) => deleteWorkTask(id))
  ipcMain.handle(IPC.WORK_TASK_CLEAR_DONE, () => clearDoneWorkTasks())

  ipcMain.handle(IPC.CLIPBOARD_LIST, () => getClipboardItems())
  ipcMain.handle(IPC.CLIPBOARD_COPY, (_event, id: string) => copyClipboardItem(id))
  ipcMain.handle(IPC.CLIPBOARD_DELETE, (_event, id: string) => removeClipboardItem(id))
  ipcMain.handle(IPC.CLIPBOARD_PIN, (_event, id: string) => togglePinClipboardItem(id))
  ipcMain.handle(IPC.CLIPBOARD_CLEAR, () => clearAllClipboard())

  ipcMain.handle(IPC.NOTE_LIST, () => getNotes())
  ipcMain.handle(IPC.NOTE_SAVE, (_event, input: NoteInput) => saveNote(input))
  ipcMain.handle(IPC.NOTE_DELETE, (_event, id: string) => deleteNote(id))

  ipcMain.handle(IPC.SHORTCUTS_LIST, () => getShortcuts())
  ipcMain.handle(IPC.SHORTCUTS_UPDATE, (_event, id: ShortcutActionId, accelerator: string) =>
    updateShortcutBinding(id, accelerator)
  )
  ipcMain.handle(IPC.SHORTCUTS_RESET, () => resetShortcutBindings())

  ipcMain.handle(IPC.DATA_CLEAR_ALL, () => clearAllUserData())

  ipcMain.handle(IPC.FLOATING_TOGGLE, () => {
    toggleMainWindow()
    return true
  })

  ipcMain.handle(IPC.FLOATING_RESIZE, (_event, delta: number) => resizeFloatingBall(Number(delta)))

  ipcMain.handle(IPC.FLOATING_REMINDER_ACK, () => {
    ackFloatingReminder()
    return getState()
  })
}

export function triggerQuickNote(): void {
  createEmptyNote()
}
