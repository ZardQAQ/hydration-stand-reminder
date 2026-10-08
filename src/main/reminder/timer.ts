import type { ActionPayload, AppState, Reminder, ReminderType, TimerAction } from '../../shared/types'
import { DEFAULT_SETTINGS, TICK_INTERVAL_ACTIVE_MS, TICK_INTERVAL_IDLE_MS } from '../../shared/constants'
import { addMinutes } from '../../shared/format'
import { isInsideWorkday } from '../../shared/workday'
import {
  applyTimerAction,
  scheduleFromNow,
  stateSnapshotKey
} from '../../shared/timer-logic'
import { recordAction } from '../storage/history'
import { loadSettingsFromDisk, saveSettingsToDisk } from '../storage/settings'
import {
  applyReminderToState,
  buildBreakEndReminder,
  buildTestReminder,
  showSystemNotification
} from '../reminder/notifications'
import { presentFloatingActionReminder, clearFloatingReminderIfType, initFloatingReminder } from '../floating-reminder'
import { updateTrayMenu } from '../tray'
import { getMainWindow, isMainWindowOnScreen, sendToRenderer, showMainWindow } from '../window'
import { IPC } from '../../shared/ipc-channels'
import type { SettingsInput } from '../../shared/types'
import { normalizeSettings } from '../../shared/workday'

let state: AppState = {
  running: false,
  settings: { ...DEFAULT_SETTINGS },
  nextWaterAt: null,
  nextStandAt: null,
  activeBreakUntil: null,
  lastReminder: null,
  nextEyeBreakAt: null
}

let timer: ReturnType<typeof setInterval> | null = null
let lastSnapshot = ''
let lastWorkdayInside = true
let isShowingReminder = false
let onToggleRunning: (() => void) | null = null
let onQuit: (() => void) | null = null

function cloneState(): AppState {
  return JSON.parse(JSON.stringify(state)) as AppState
}

function pushState(force = false): void {
  const snapshot = stateSnapshotKey(state)
  if (!force && snapshot === lastSnapshot) return
  lastSnapshot = snapshot
  sendToRenderer(IPC.STATE_CHANGED, cloneState())
  if (onToggleRunning && onQuit) {
    updateTrayMenu(state, onToggleRunning, showMainWindow, onQuit)
  }
}

function clearInAppReminder(): void {
  isShowingReminder = false
  sendToRenderer(IPC.REMINDER_DISMISS)
}

export function presentReminderMessage(reminder: Reminder): void {
  if (isShowingReminder) return

  state = { ...state, lastReminder: reminder }
  showSystemNotification(reminder, state.settings.sound, showMainWindow)

  if (isMainWindowOnScreen()) {
    isShowingReminder = true
    sendToRenderer(IPC.REMINDER_SHOW, reminder)
  } else {
    isShowingReminder = false
  }

  pushState(true)
}

function presentReminder(type: ReminderType): void {
  if (isShowingReminder) return
  state = applyReminderToState(state, type)
  if (state.lastReminder) {
    presentReminderMessage(state.lastReminder)
    presentFloatingActionReminder(type, state.lastReminder, state.settings.showFloatingBall)
  }
}

function rescheduleAfterWater(): void {
  if (state.settings.enableWater) {
    state.nextWaterAt = addMinutes(state.settings.waterInterval)
  }
}

function rescheduleAfterStand(): void {
  if (state.settings.enableStand) {
    state.nextStandAt = addMinutes(state.settings.standInterval)
  }
}

function tick(): void {
  if (!state.running) return
  const now = Date.now()
  const insideWorkday = isInsideWorkday(state.settings, new Date(now))

  if (insideWorkday !== lastWorkdayInside) {
    updateTimerCadence(insideWorkday)
  }

  if (!insideWorkday) {
    pushState()
    return
  }

  let changed = false

  if (state.settings.enableWater && state.nextWaterAt && now >= state.nextWaterAt) {
    presentReminder('water')
    rescheduleAfterWater()
    changed = true
  }

  if (state.settings.enableStand && state.nextStandAt && now >= state.nextStandAt) {
    presentReminder('stand')
    rescheduleAfterStand()
    changed = true
  }

  if (state.activeBreakUntil && now >= state.activeBreakUntil) {
    state.activeBreakUntil = null
    changed = true
    if (state.settings.notifyBreakEnd) {
      presentReminderMessage(buildBreakEndReminder(now))
    }
  }

  if (changed) {
    pushState(true)
  } else {
    pushState()
  }
}

function setTimerInterval(ms: number): void {
  if (timer) clearInterval(timer)
  timer = setInterval(tick, ms)
}

function updateTimerCadence(forceInside?: boolean): void {
  if (!state.running) {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    return
  }
  const inside = forceInside ?? isInsideWorkday(state.settings)
  if (inside !== lastWorkdayInside || !timer) {
    lastWorkdayInside = inside
    setTimerInterval(inside ? TICK_INTERVAL_ACTIVE_MS : TICK_INTERVAL_IDLE_MS)
  }
}

export function initReminderService(handlers: {
  onToggle: () => void
  onQuit: () => void
}): void {
  onToggleRunning = handlers.onToggle
  onQuit = handlers.onQuit
  initFloatingReminder({
    onDone: (type) => {
      handleAction('done', { type })
    },
    onSkip: () => {
      clearInAppReminder()
    }
  })
  state.settings = loadSettingsFromDisk()
  lastSnapshot = stateSnapshotKey(state)

  if (state.settings.autoStart && !state.running) {
    state = applyTimerAction(state, 'start')
    if (!state.settings.enableWater) state.nextWaterAt = null
    if (!state.settings.enableStand) state.nextStandAt = null
    lastSnapshot = stateSnapshotKey(state)
  }
}

export function startTimer(): void {
  updateTimerCadence()
}

export function getState(): AppState {
  return cloneState()
}

export function patchState(partial: Partial<AppState>): void {
  state = { ...state, ...partial }
  pushState(true)
}

export function getMutableSettings(): AppState['settings'] {
  return state.settings
}

export function handleAction(action: TimerAction, payload: ActionPayload = {}): AppState {
  const prevRunning = state.running
  state = applyTimerAction(state, action, payload)

  if (action === 'done' && payload.type) {
    recordAction(payload.type)
    clearFloatingReminderIfType(payload.type)
    clearInAppReminder()
  }

  if (action === 'snooze' && payload.type) {
    clearFloatingReminderIfType(payload.type)
    clearInAppReminder()
  }

  if (action === 'start') {
    if (!state.settings.enableWater) state.nextWaterAt = null
    if (!state.settings.enableStand) state.nextStandAt = null
  }

  if (action === 'start' || action === 'pause' || action === 'reset') {
    updateTimerCadence()
  }

  if (prevRunning !== state.running || action === 'start') {
    updateTimerCadence()
  }

  pushState(true)
  return cloneState()
}

export function dismissReminder(): void {
  isShowingReminder = false
}

export function testReminder(): boolean {
  presentReminderMessage(buildTestReminder())
  return true
}

export function onWindowHidden(): void {
  clearInAppReminder()
}

export function updateSettings(input: SettingsInput): AppState {
  state.settings = normalizeSettings({
    ...state.settings,
    ...input
  })
  saveSettingsToDisk(state.settings)
  if (state.running) {
    state = scheduleFromNow(state)
    if (!state.settings.enableWater) state.nextWaterAt = null
    if (!state.settings.enableStand) state.nextStandAt = null
  }
  updateTimerCadence()
  pushState(true)
  return cloneState()
}

export function resetSettings(): AppState {
  state.settings = { ...DEFAULT_SETTINGS }
  saveSettingsToDisk(state.settings)
  if (state.running) {
    state = scheduleFromNow(state)
  }
  updateTimerCadence()
  pushState(true)
  return cloneState()
}

export function onActivateRecreateWindow(createWindow: () => void): void {
  if (!getMainWindow()) {
    createWindow()
  }
  showMainWindow()
}
