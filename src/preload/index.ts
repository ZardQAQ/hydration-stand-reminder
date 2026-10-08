import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type {
  ActionPayload,
  AppState,
  ClipboardItem,
  HistoryRecord,
  FloatingReminderPayload,
  NavigatePayload,
  NoteInput,
  QuickNote,
  Reminder,
  SettingsInput,
  ShortcutActionId,
  ShortcutBinding,
  SystemInfo,
  TimerAction,
  TodoInput,
  TodoReminder,
  WorkTask,
  WorkTaskInput
} from '../shared/types'

const toolboxApi = {
  getState: (): Promise<AppState> => ipcRenderer.invoke(IPC.STATE_GET),
  updateSettings: (settings: SettingsInput): Promise<AppState> =>
    ipcRenderer.invoke(IPC.SETTINGS_UPDATE, settings),
  resetSettings: (): Promise<AppState> => ipcRenderer.invoke(IPC.SETTINGS_RESET),
  action: (action: TimerAction, payload?: ActionPayload): Promise<AppState> =>
    ipcRenderer.invoke(IPC.TIMER_ACTION, action, payload),
  dismissReminder: (): Promise<boolean> => ipcRenderer.invoke(IPC.REMINDER_DISMISS),
  getSystemInfo: (): Promise<SystemInfo> => ipcRenderer.invoke(IPC.SYSTEM_INFO),
  getHistory: (): Promise<HistoryRecord[]> => ipcRenderer.invoke(IPC.HISTORY_GET),
  testReminder: (): Promise<boolean> => ipcRenderer.invoke(IPC.REMINDER_TEST),
  getTodos: (): Promise<TodoReminder[]> => ipcRenderer.invoke(IPC.TODO_LIST),
  saveTodo: (input: TodoInput): Promise<TodoReminder[]> => ipcRenderer.invoke(IPC.TODO_SAVE, input),
  deleteTodo: (id: string): Promise<TodoReminder[]> => ipcRenderer.invoke(IPC.TODO_DELETE, id),
  downloadTodoImage: (id: string, suggestedName?: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.TODO_DOWNLOAD_IMAGE, id, suggestedName),
  getWorkTasks: (): Promise<WorkTask[]> => ipcRenderer.invoke(IPC.WORK_TASK_LIST),
  saveWorkTask: (input: WorkTaskInput): Promise<WorkTask[]> =>
    ipcRenderer.invoke(IPC.WORK_TASK_SAVE, input),
  toggleWorkTask: (id: string): Promise<WorkTask[]> => ipcRenderer.invoke(IPC.WORK_TASK_TOGGLE, id),
  deleteWorkTask: (id: string): Promise<WorkTask[]> => ipcRenderer.invoke(IPC.WORK_TASK_DELETE, id),
  clearDoneWorkTasks: (): Promise<WorkTask[]> => ipcRenderer.invoke(IPC.WORK_TASK_CLEAR_DONE),
  getClipboard: (): Promise<ClipboardItem[]> => ipcRenderer.invoke(IPC.CLIPBOARD_LIST),
  copyClipboardItem: (id: string): Promise<boolean> => ipcRenderer.invoke(IPC.CLIPBOARD_COPY, id),
  deleteClipboardItem: (id: string): Promise<ClipboardItem[]> =>
    ipcRenderer.invoke(IPC.CLIPBOARD_DELETE, id),
  pinClipboardItem: (id: string): Promise<ClipboardItem[]> => ipcRenderer.invoke(IPC.CLIPBOARD_PIN, id),
  clearClipboard: (): Promise<ClipboardItem[]> => ipcRenderer.invoke(IPC.CLIPBOARD_CLEAR),
  getNotes: (): Promise<QuickNote[]> => ipcRenderer.invoke(IPC.NOTE_LIST),
  saveNote: (input: NoteInput): Promise<QuickNote[]> => ipcRenderer.invoke(IPC.NOTE_SAVE, input),
  deleteNote: (id: string): Promise<QuickNote[]> => ipcRenderer.invoke(IPC.NOTE_DELETE, id),
  getShortcuts: (): Promise<ShortcutBinding[]> => ipcRenderer.invoke(IPC.SHORTCUTS_LIST),
  updateShortcut: (id: ShortcutActionId, accelerator: string): Promise<ShortcutBinding[]> =>
    ipcRenderer.invoke(IPC.SHORTCUTS_UPDATE, id, accelerator),
  resetShortcuts: (): Promise<ShortcutBinding[]> => ipcRenderer.invoke(IPC.SHORTCUTS_RESET),
  clearAllData: (): Promise<AppState> => ipcRenderer.invoke(IPC.DATA_CLEAR_ALL),
  toggleWindow: (): Promise<boolean> => ipcRenderer.invoke(IPC.FLOATING_TOGGLE),
  resizeFloatingBall: (delta: number): Promise<AppState> =>
    ipcRenderer.invoke(IPC.FLOATING_RESIZE, delta),
  ackFloatingReminder: (): Promise<AppState> => ipcRenderer.invoke(IPC.FLOATING_REMINDER_ACK),
  onStateChanged: (callback: (state: AppState) => void): void => {
    ipcRenderer.on(IPC.STATE_CHANGED, (_event, state: AppState) => callback(state))
  },
  onReminder: (callback: (reminder: Reminder) => void): void => {
    ipcRenderer.on(IPC.REMINDER_SHOW, (_event, reminder: Reminder) => callback(reminder))
  },
  onReminderDismiss: (callback: () => void): void => {
    ipcRenderer.on(IPC.REMINDER_DISMISS, () => callback())
  },
  onFloatingReminder: (callback: (payload: FloatingReminderPayload) => void): void => {
    ipcRenderer.on(IPC.FLOATING_REMINDER_SHOW, (_event, payload: FloatingReminderPayload) => callback(payload))
  },
  onFloatingReminderDismiss: (callback: () => void): void => {
    ipcRenderer.on(IPC.FLOATING_REMINDER_DISMISS, () => callback())
  },
  onTodosChanged: (callback: (todos: TodoReminder[]) => void): void => {
    ipcRenderer.on(IPC.TODO_CHANGED, (_event, todos: TodoReminder[]) => callback(todos))
  },
  onWorkTasksChanged: (callback: (tasks: WorkTask[]) => void): void => {
    ipcRenderer.on(IPC.WORK_TASK_CHANGED, (_event, tasks: WorkTask[]) => callback(tasks))
  },
  onClipboardChanged: (callback: (items: ClipboardItem[]) => void): void => {
    ipcRenderer.on(IPC.CLIPBOARD_CHANGED, (_event, items: ClipboardItem[]) => callback(items))
  },
  onNotesChanged: (callback: (notes: QuickNote[]) => void): void => {
    ipcRenderer.on(IPC.NOTE_CHANGED, (_event, notes: QuickNote[]) => callback(notes))
  },
  onNavigate: (callback: (payload: NavigatePayload) => void): void => {
    ipcRenderer.on(IPC.NAVIGATE, (_event, payload: NavigatePayload) => callback(payload))
  }
}

contextBridge.exposeInMainWorld('reminderApi', toolboxApi)
