import type { ActionPayload, AppState, ReminderKind, ReminderType, TimerAction } from './types'
import { addMinutes } from './format'

export function isActionableReminder(type: ReminderKind): type is ReminderType {
  return type === 'water' || type === 'stand'
}

export function scheduleFromNow(state: AppState, now = Date.now()): AppState {
  return {
    ...state,
    nextWaterAt: state.settings.enableWater
      ? addMinutes(state.settings.waterInterval, now)
      : null,
    nextStandAt: state.settings.enableStand
      ? addMinutes(state.settings.standInterval, now)
      : null,
    activeBreakUntil: null
  }
}

export function applyTimerAction(
  state: AppState,
  action: TimerAction,
  payload: ActionPayload = {},
  now = Date.now()
): AppState {
  let next: AppState = { ...state }

  if (action === 'start') {
    next.running = true
    if (!next.nextWaterAt || !next.nextStandAt) {
      next = scheduleFromNow(next, now)
    }
  }

  if (action === 'pause') {
    next.running = false
  }

  if (action === 'reset') {
    next = {
      ...next,
      running: false,
      nextWaterAt: null,
      nextStandAt: null,
      activeBreakUntil: null,
      lastReminder: null
    }
  }

  if (action === 'done') {
    if (payload.type === 'water') {
      next.nextWaterAt = addMinutes(next.settings.waterInterval, now)
    }
    if (payload.type === 'stand') {
      next.nextStandAt = addMinutes(next.settings.standInterval, now)
      next.activeBreakUntil = null
    }
  }

  if (action === 'snooze') {
    const minutes = payload.minutes ?? next.settings.snoozeMinutes
    if (payload.type === 'water') {
      next.nextWaterAt = addMinutes(minutes, now)
    }
    if (payload.type === 'stand') {
      next.nextStandAt = addMinutes(minutes, now)
      next.activeBreakUntil = null
    }
  }

  return next
}

export function stateSnapshotKey(state: AppState): string {
  return JSON.stringify({
    running: state.running,
    nextWaterAt: state.nextWaterAt,
    nextStandAt: state.nextStandAt,
    activeBreakUntil: state.activeBreakUntil,
    lastReminder: state.lastReminder,
    nextEyeBreakAt: state.nextEyeBreakAt,
    settings: state.settings
  })
}

export function reminderContent(
  type: ReminderType,
  standDuration: number
): { title: string; body: string } {
  if (type === 'water') {
    return {
      title: '该喝水了',
      body: '补充一杯水，让注意力回到状态。'
    }
  }
  return {
    title: '该站起来活动了',
    body: `站立或走动 ${standDuration} 分钟，放松肩颈和腰背。`
  }
}
