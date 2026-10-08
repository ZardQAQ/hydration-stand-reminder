import type { AppState, FloatingReminderPayload, WorkTask } from '@shared/types'
import {
  FLOATING_ACTION_HEIGHT_RATIO,
  FLOATING_ACTION_WIDTH_RATIO,
  FLOATING_BALL_HEIGHT_RATIO,
  FLOATING_BALL_SIZE_STEP,
  FLOATING_BALL_WIDTH_RATIO,
  FLOATING_REMINDER_TIMEOUT_MS
} from '@shared/constants'
import { formatCountdown } from '@shared/format'
import { countPending } from '@shared/work-task-logic'

const ballEl = document.getElementById('ball')!
const normalView = document.getElementById('normal-view')!
const actionView = document.getElementById('action-view')!
const actionIcon = document.getElementById('action-icon')!
const actionTitle = document.getElementById('action-title')!
const actionRingProgress = document.getElementById('action-ring-progress')!
const actionCountdown = document.getElementById('action-countdown')!
const waterRow = document.getElementById('water-row')!
const standRow = document.getElementById('stand-row')!
const waterLabel = document.getElementById('water-label')!
const standLabel = document.getElementById('stand-label')!
const taskCountEl = document.getElementById('task-count')!
const taskCountWrap = document.getElementById('task-count-wrap')!

let state: AppState | null = null
let pendingTaskCount = 0
let tickTimer: ReturnType<typeof setInterval> | null = null
let actionTimer: ReturnType<typeof setInterval> | null = null
let activePrompt: FloatingReminderPayload | null = null
let promptStartedAt = 0

function applyBallSize(size: number, inActionMode = false): void {
  document.documentElement.style.setProperty('--card-size', `${size}px`)
  const widthRatio = inActionMode ? FLOATING_ACTION_WIDTH_RATIO : FLOATING_BALL_WIDTH_RATIO
  const heightRatio = inActionMode ? FLOATING_ACTION_HEIGHT_RATIO : FLOATING_BALL_HEIGHT_RATIO
  document.documentElement.style.setProperty('--card-width', `${Math.round(size * widthRatio)}px`)
  document.documentElement.style.setProperty('--card-height', `${Math.round(size * heightRatio)}px`)
}

function setLine(
  row: HTMLElement,
  label: HTMLElement,
  visible: boolean,
  target: number | null,
  idleText: string
): void {
  if (!visible) {
    row.classList.add('hidden')
    return
  }

  row.classList.remove('hidden')
  const hasTarget = target !== null && target > 0
  label.textContent = hasTarget ? formatCountdown(target, true) : idleText
  label.classList.toggle('muted', !hasTarget)
}

function updateTaskCount(tasks?: WorkTask[]): void {
  if (tasks) {
    pendingTaskCount = countPending(tasks)
  }
  const text = pendingTaskCount > 99 ? '99+' : String(pendingTaskCount)
  taskCountEl.textContent = text
  taskCountEl.classList.toggle('empty', pendingTaskCount === 0)
  taskCountWrap.title = pendingTaskCount === 0 ? '暂无未完成事项' : `${pendingTaskCount} 件未完成工作事项`
}

function updateDisplay(): void {
  if (!state || activePrompt) return

  const { settings, running, nextWaterAt, nextStandAt } = state
  const idleText = running ? '--:--' : '未开始'

  setLine(waterRow, waterLabel, settings.enableWater, nextWaterAt, idleText)
  setLine(standRow, standLabel, settings.enableStand, nextStandAt, idleText)
  updateTaskCount()
}

function startTick(): void {
  if (tickTimer) return
  tickTimer = setInterval(updateDisplay, 1000)
}

function clearActionTimer(): void {
  if (actionTimer) {
    clearInterval(actionTimer)
    actionTimer = null
  }
}

function updateActionUrgency(): void {
  if (!activePrompt) return

  const leftMs = Math.max(0, activePrompt.expiresAt - Date.now())
  const leftSec = Math.ceil(leftMs / 1000)
  const elapsedMs = Math.max(0, Date.now() - promptStartedAt)
  const urgency = Math.min(1, Math.max(0, elapsedMs / FLOATING_REMINDER_TIMEOUT_MS))
  const remain = Math.min(1, Math.max(0, leftMs / FLOATING_REMINDER_TIMEOUT_MS))

  document.documentElement.style.setProperty('--urgency', urgency.toFixed(3))
  document.documentElement.style.setProperty('--remain', remain.toFixed(3))
  document.documentElement.style.setProperty(
    '--pulse-period',
    `${Math.max(0.45, 1.9 - urgency * 1.35)}s`
  )

  ballEl.classList.remove('urgency-low', 'urgency-mid', 'urgency-high')
  if (urgency >= 0.72) ballEl.classList.add('urgency-high')
  else if (urgency >= 0.38) ballEl.classList.add('urgency-mid')
  else ballEl.classList.add('urgency-low')

  actionRingProgress.style.strokeDashoffset = `${(1 - remain) * 100}`

  const minutes = Math.floor(leftSec / 60)
  const seconds = leftSec % 60
  if (leftSec <= 0) {
    actionCountdown.textContent = '正在跳过…'
    return
  }

  if (urgency >= 0.72) {
    actionCountdown.textContent = `抓紧点击！${minutes}:${String(seconds).padStart(2, '0')}`
  } else if (urgency >= 0.38) {
    actionCountdown.textContent = `${minutes}:${String(seconds).padStart(2, '0')} 后将跳过`
  } else {
    actionCountdown.textContent = `点击确认 · ${minutes}:${String(seconds).padStart(2, '0')}`
  }
}

function enterActionMode(payload: FloatingReminderPayload): void {
  activePrompt = payload
  promptStartedAt = Date.now()
  const { reminder } = payload

  if (state) {
    applyBallSize(state.settings.floatingBallSize, true)
  }

  ballEl.classList.add('action-mode', reminder.type)
  ballEl.title = reminder.type === 'water' ? '点击确认已喝水' : '点击确认已站立'
  normalView.classList.add('hidden')
  actionView.classList.remove('hidden')
  actionIcon.textContent = reminder.type === 'water' ? '💧' : '🧍'
  actionTitle.textContent = reminder.type === 'water' ? '去喝水' : '去站立'

  updateActionUrgency()
  clearActionTimer()
  actionTimer = setInterval(updateActionUrgency, 120)
}

function exitActionMode(): void {
  activePrompt = null
  promptStartedAt = 0
  clearActionTimer()

  document.documentElement.style.setProperty('--urgency', '0')
  document.documentElement.style.setProperty('--remain', '1')
  document.documentElement.style.setProperty('--pulse-period', '1.8s')

  ballEl.classList.remove('action-mode', 'water', 'stand', 'urgency-low', 'urgency-mid', 'urgency-high')
  ballEl.title = '左键切换窗口 | 滚轮缩放 | 右键菜单'
  actionView.classList.add('hidden')
  normalView.classList.remove('hidden')

  if (state) {
    applyBallSize(state.settings.floatingBallSize, false)
    updateDisplay()
  }
}

const api = window.reminderApi
if (!api) {
  document.body.innerHTML = '<div style="color:white;padding:8px">API not loaded</div>'
  throw new Error('reminderApi not available')
}

function toggleWindow(): void {
  void api.toggleWindow?.()
}

async function toggleReminder(): Promise<void> {
  if (!state) return
  const action = state.running ? 'pause' : 'start'
  applyState(await api.action(action))
}

async function markWater(): Promise<void> {
  applyState(await api.action('done', { type: 'water' }))
}

async function markStand(): Promise<void> {
  applyState(await api.action('done', { type: 'stand' }))
}

async function ackReminder(): Promise<void> {
  if (!activePrompt) return
  applyState(await api.ackFloatingReminder())
}

function applyState(next: AppState): void {
  state = next
  applyBallSize(next.settings.floatingBallSize, Boolean(activePrompt))
  if (!activePrompt) {
    updateDisplay()
  }
}

void api.getState().then((initial) => {
  applyState(initial)
  startTick()
})

void api.getWorkTasks().then((tasks) => {
  updateTaskCount(tasks)
})

api.onStateChanged((next) => {
  applyState(next)
})

api.onWorkTasksChanged((tasks) => {
  updateTaskCount(tasks)
})

api.onFloatingReminder((payload) => {
  enterActionMode(payload)
})

api.onFloatingReminderDismiss(() => {
  exitActionMode()
})

ballEl.addEventListener('click', (e: MouseEvent) => {
  e.preventDefault()
  if (activePrompt) {
    void ackReminder()
    return
  }
  toggleWindow()
})

ballEl.addEventListener(
  'wheel',
  (e: WheelEvent) => {
    if (activePrompt) return
    e.preventDefault()
    const delta = e.deltaY < 0 ? FLOATING_BALL_SIZE_STEP : -FLOATING_BALL_SIZE_STEP
    void api.resizeFloatingBall(delta).then(applyState)
  },
  { passive: false }
)

type MenuItem =
  | { label: string; action: () => void | Promise<void> }
  | { type: 'sep' }

function showContextMenu(e: MouseEvent): void {
  e.preventDefault()
  const existing = document.getElementById('ctx-menu')
  if (existing) existing.remove()

  const running = state?.running ?? false
  const menu = document.createElement('div')
  menu.id = 'ctx-menu'
  menu.style.cssText = `
    position: fixed;
    top: ${e.clientY}px;
    left: ${e.clientX}px;
    background: rgba(28, 30, 33, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 4px 0;
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    z-index: 9999;
    min-width: 132px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.88);
    -webkit-app-region: no-drag;
  `

  const items: MenuItem[] = [
    { label: running ? '关闭提醒' : '开启提醒', action: toggleReminder },
    { type: 'sep' },
    { label: '已喝水', action: markWater },
    { label: '已站立', action: markStand },
    { type: 'sep' },
    { label: '显示窗口', action: toggleWindow }
  ]

  for (const item of items) {
    if ('type' in item && item.type === 'sep') {
      const sep = document.createElement('div')
      sep.style.cssText = 'height:1px;background:rgba(255,255,255,0.08);margin:4px 0;'
      menu.appendChild(sep)
      continue
    }

    const el = document.createElement('div')
    el.textContent = item.label
    el.style.cssText = `
      padding: 6px 14px;
      cursor: pointer;
      white-space: nowrap;
    `
    el.addEventListener('mouseenter', () => {
      el.style.background = 'rgba(255,255,255,0.06)'
    })
    el.addEventListener('mouseleave', () => {
      el.style.background = ''
    })
    el.addEventListener('click', () => {
      void item.action()
      menu.remove()
    })
    menu.appendChild(el)
  }

  document.body.appendChild(menu)

  const close = (ev: MouseEvent) => {
    if (!menu.contains(ev.target as Node)) {
      menu.remove()
      document.removeEventListener('click', close)
    }
  }
  setTimeout(() => document.addEventListener('click', close), 0)
}

ballEl.addEventListener('contextmenu', showContextMenu)
