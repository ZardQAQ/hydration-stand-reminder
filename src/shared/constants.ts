import type { Settings, ShortcutBinding } from './types'

export const APP_NAME = '桌面效率工具箱'

export const DEFAULT_SETTINGS: Settings = {
  waterInterval: 30,
  standInterval: 60,
  standDuration: 5,
  snoozeMinutes: 10,
  workdayStart: '09:00',
  workdayEnd: '18:00',
  useWorkday: false,
  enableWater: true,
  enableStand: true,
  autoStart: false,
  notifyBreakEnd: true,
  sound: true,
  darkMode: false,
  clipboardEnabled: true,
  clipboardMaxItems: 100,
  enableEyeBreak: false,
  eyeInterval: 20,
  eyeDuration: 20,
  monitorAlertCpu: 90,
  monitorAlertEnabled: false,
  showFloatingBall: true,
  floatingBallSize: 84
}

export const FLOATING_BALL_DEFAULT_SIZE = 84
export const FLOATING_BALL_MIN_SIZE = 56
export const FLOATING_BALL_MAX_SIZE = 140
export const FLOATING_BALL_SIZE_STEP = 4
export const FLOATING_BALL_WIDTH_RATIO = 1.78
export const FLOATING_BALL_HEIGHT_RATIO = 0.68
export const FLOATING_ACTION_WIDTH_RATIO = 1.95
export const FLOATING_ACTION_HEIGHT_RATIO = 1.22
export const FLOATING_REMINDER_TIMEOUT_MS = 2 * 60 * 1000

export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  { id: 'toggleWindow', label: '显示/隐藏窗口', accelerator: 'CommandOrControl+Shift+H' },
  { id: 'quickNote', label: '快速新建便签', accelerator: 'CommandOrControl+Shift+N' },
  { id: 'markWater', label: '标记已喝水', accelerator: 'CommandOrControl+Shift+W' },
  { id: 'markStand', label: '标记已站立', accelerator: 'CommandOrControl+Shift+S' }
]

export const TICK_INTERVAL_ACTIVE_MS = 1000
export const TICK_INTERVAL_IDLE_MS = 60000
export const MONITOR_POLL_MS = 5000
export const CLIPBOARD_POLL_MS = 500
export const HISTORY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000
export const MONITOR_ALERT_COOLDOWN_MS = 5 * 60 * 1000
export const CLIPBOARD_PREVIEW_MAX = 120
export const TODO_IMAGE_MAX_COUNT = 9
export const TODO_IMAGE_MAX_BYTES = 8 * 1024 * 1024
export const TODO_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
] as const
export const TODO_IMAGE_PROTOCOL = 'todo-img'
