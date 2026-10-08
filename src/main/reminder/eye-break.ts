import { TICK_INTERVAL_ACTIVE_MS } from '../../shared/constants'
import { isEyeBreakDue, scheduleNextEyeBreak } from '../../shared/eye-logic'
import { recordAction } from '../storage/history'
import { getState, patchState, presentReminderMessage } from './timer'
import type { Reminder } from '../../shared/types'

let timer: ReturnType<typeof setInterval> | null = null

function buildEyeReminder(durationSec: number): Reminder {
  return {
    type: 'eye',
    title: '用眼休息',
    body: `看向 6 米外，放松眼睛 ${durationSec} 秒。`,
    at: Date.now(),
    durationSec
  }
}

function tick(): void {
  const state = getState()
  if (!state.settings.enableEyeBreak || state.nextEyeBreakAt === null) return
  const now = Date.now()
  if (!isEyeBreakDue(state.nextEyeBreakAt, now)) return

  presentReminderMessage(buildEyeReminder(state.settings.eyeDuration))
  recordAction('eye')
  patchState({ nextEyeBreakAt: scheduleNextEyeBreak(state.settings.eyeInterval, now) })
}

export function initEyeBreak(): void {
  const state = getState()
  if (state.settings.enableEyeBreak) {
    patchState({ nextEyeBreakAt: scheduleNextEyeBreak(state.settings.eyeInterval) })
  }
}

export function startEyeBreak(): void {
  if (timer) return
  timer = setInterval(tick, TICK_INTERVAL_ACTIVE_MS)
}

export function onEyeSettingsChanged(enable: boolean, intervalMinutes: number): void {
  patchState({
    nextEyeBreakAt: enable ? scheduleNextEyeBreak(intervalMinutes) : null
  })
}
