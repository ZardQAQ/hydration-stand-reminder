export type ReminderType = 'water' | 'stand'
export type ReminderKind = ReminderType | 'breakEnd' | 'info' | 'todo' | 'eye'

export type TodoRepeat = 'once' | 'daily'
export type WorkTaskPriority = 'high' | 'normal' | 'low'
export type WorkTaskFilter = 'all' | 'pending' | 'done'
export type NoteColor = 'default' | 'yellow' | 'blue' | 'green'
export type ShortcutActionId = 'toggleWindow' | 'quickNote' | 'markWater' | 'markStand'

export interface TodoImage {
  id: string
  name: string
  mimeType: string
}

export interface TodoImageInput {
  id?: string
  name: string
  mimeType: string
  data?: ArrayBuffer
}

export interface TodoReminder {
  id: string
  title: string
  body: string
  repeat: TodoRepeat
  at: number
  enabled: boolean
  createdAt: number
  lastTriggeredAt: number | null
  images: TodoImage[]
}

export interface TodoInput {
  id?: string
  title: string
  body: string
  repeat: TodoRepeat
  at: number
  enabled: boolean
  images?: TodoImageInput[]
}

export interface WorkTask {
  id: string
  title: string
  note: string
  priority: WorkTaskPriority
  done: boolean
  createdAt: number
  updatedAt: number
  completedAt: number | null
  images: TodoImage[]
}

export interface WorkTaskInput {
  id?: string
  title: string
  note?: string
  priority?: WorkTaskPriority
  done?: boolean
  images?: TodoImageInput[]
}

export interface ClipboardItem {
  id: string
  kind: 'text' | 'image'
  text?: string
  preview: string
  imagePath?: string
  createdAt: number
  pinned: boolean
}

export interface QuickNote {
  id: string
  title: string
  content: string
  pinned: boolean
  color: NoteColor
  updatedAt: number
}

export interface NoteInput {
  id?: string
  title: string
  content: string
  pinned: boolean
  color: NoteColor
}

export interface ShortcutBinding {
  id: ShortcutActionId
  label: string
  accelerator: string
}

export interface Settings {
  waterInterval: number
  standInterval: number
  standDuration: number
  snoozeMinutes: number
  workdayStart: string
  workdayEnd: string
  useWorkday: boolean
  enableWater: boolean
  enableStand: boolean
  autoStart: boolean
  notifyBreakEnd: boolean
  sound: boolean
  darkMode: boolean
  clipboardEnabled: boolean
  clipboardMaxItems: number
  enableEyeBreak: boolean
  eyeInterval: number
  eyeDuration: number
  monitorAlertCpu: number
  monitorAlertEnabled: boolean
  showFloatingBall: boolean
  floatingBallSize: number
}

export interface Reminder {
  type: ReminderKind
  title: string
  body: string
  at: number
  durationSec?: number
  images?: TodoImage[]
}

export interface AppState {
  running: boolean
  settings: Settings
  nextWaterAt: number | null
  nextStandAt: number | null
  activeBreakUntil: number | null
  lastReminder: Reminder | null
  nextEyeBreakAt: number | null
}

export interface HistoryRecord {
  type: ReminderType | 'eye'
  at: number
}

export type TimerAction = 'start' | 'pause' | 'reset' | 'done' | 'snooze'

export interface ActionPayload {
  type?: ReminderType
  minutes?: number
}

export interface SettingsInput {
  waterInterval: number | string
  standInterval: number | string
  standDuration: number | string
  snoozeMinutes: number | string
  workdayStart: string
  workdayEnd: string
  useWorkday: boolean
  enableWater: boolean
  enableStand: boolean
  autoStart: boolean
  notifyBreakEnd: boolean
  sound: boolean
  darkMode: boolean
  clipboardEnabled: boolean
  clipboardMaxItems: number | string
  enableEyeBreak: boolean
  eyeInterval: number | string
  eyeDuration: number | string
  monitorAlertCpu: number | string
  monitorAlertEnabled: boolean
  showFloatingBall: boolean
  floatingBallSize: number | string
}

export interface SystemInfo {
  cpu: {
    usage: string
    cores: number
    breakdown: { user: string; system: string; idle: string }
  }
  mem: {
    usage: string
    total: number
    used: number
    free: number
    swapTotal: number
    swapUsed: number
  }
  network: { down: number; up: number }
  gpu: {
    usage: number | null
    name: string
    memUsed: number | null
    memTotal: number | null
  }
  disk: {
    usage: string | null
    total: number
    used: number
    count: number
  }
  battery: {
    percent: number
    isCharging: boolean
    timeRemaining: number | null
    maxCapacity: number | null
    model: string | null
  } | null
  uptime: number | null
  sysOS: string | null
  cpuTemp: {
    main: number
    max: number
    cores: number[] | null
  } | null
  cpuStatic: {
    brand: string
    speed: number
    speedMin: number
    speedMax: number
    cores: number
    physicalCores: number
  } | null
}

export interface NavigatePayload {
  tool: string
  action?: string
}

export interface FloatingReminderPayload {
  reminder: Reminder
  expiresAt: number
}

export interface ToolboxApi {
  getState: () => Promise<AppState>
  updateSettings: (settings: SettingsInput) => Promise<AppState>
  resetSettings: () => Promise<AppState>
  action: (action: TimerAction, payload?: ActionPayload) => Promise<AppState>
  dismissReminder: () => Promise<boolean>
  getSystemInfo: () => Promise<SystemInfo>
  getHistory: () => Promise<HistoryRecord[]>
  testReminder: () => Promise<boolean>
  getTodos: () => Promise<TodoReminder[]>
  saveTodo: (input: TodoInput) => Promise<TodoReminder[]>
  deleteTodo: (id: string) => Promise<TodoReminder[]>
  downloadTodoImage: (id: string, suggestedName?: string) => Promise<boolean>
  getWorkTasks: () => Promise<WorkTask[]>
  saveWorkTask: (input: WorkTaskInput) => Promise<WorkTask[]>
  toggleWorkTask: (id: string) => Promise<WorkTask[]>
  deleteWorkTask: (id: string) => Promise<WorkTask[]>
  clearDoneWorkTasks: () => Promise<WorkTask[]>
  getClipboard: () => Promise<ClipboardItem[]>
  copyClipboardItem: (id: string) => Promise<boolean>
  deleteClipboardItem: (id: string) => Promise<ClipboardItem[]>
  pinClipboardItem: (id: string) => Promise<ClipboardItem[]>
  clearClipboard: () => Promise<ClipboardItem[]>
  getNotes: () => Promise<QuickNote[]>
  saveNote: (input: NoteInput) => Promise<QuickNote[]>
  deleteNote: (id: string) => Promise<QuickNote[]>
  getShortcuts: () => Promise<ShortcutBinding[]>
  updateShortcut: (id: ShortcutActionId, accelerator: string) => Promise<ShortcutBinding[]>
  resetShortcuts: () => Promise<ShortcutBinding[]>
  clearAllData: () => Promise<AppState>
  toggleWindow: () => Promise<boolean>
  resizeFloatingBall: (delta: number) => Promise<AppState>
  ackFloatingReminder: () => Promise<AppState>
  onStateChanged: (callback: (state: AppState) => void) => void
  onReminder: (callback: (reminder: Reminder) => void) => void
  onReminderDismiss: (callback: () => void) => void
  onFloatingReminder: (callback: (payload: FloatingReminderPayload) => void) => void
  onFloatingReminderDismiss: (callback: () => void) => void
  onTodosChanged: (callback: (todos: TodoReminder[]) => void) => void
  onWorkTasksChanged: (callback: (tasks: WorkTask[]) => void) => void
  onClipboardChanged: (callback: (items: ClipboardItem[]) => void) => void
  onNotesChanged: (callback: (notes: QuickNote[]) => void) => void
  onNavigate: (callback: (payload: NavigatePayload) => void) => void
}

export type ReminderApi = ToolboxApi
