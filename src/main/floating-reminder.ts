import type { FloatingReminderPayload, Reminder, ReminderType } from '../shared/types'
import { FLOATING_REMINDER_TIMEOUT_MS } from '../shared/constants'
import { IPC } from '../shared/ipc-channels'
import { isActionableReminder } from '../shared/timer-logic'
import {
  revealFloatingBallWindow,
  sendToFloatingBall,
  setFloatingBallActionMode
} from './floating-ball'

let pendingType: ReminderType | null = null
let pendingTimeout: ReturnType<typeof setTimeout> | null = null
let onConfirm: ((type: ReminderType) => void) | null = null
let onSkip: (() => void) | null = null

export function initFloatingReminder(handlers: {
  onDone: (type: ReminderType) => void
  onSkip: () => void
}): void {
  onConfirm = handlers.onDone
  onSkip = handlers.onSkip
}

function clearPendingTimer(): void {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout)
    pendingTimeout = null
  }
}

function dismissFloatingReminderUI(): void {
  setFloatingBallActionMode(false)
  sendToFloatingBall(IPC.FLOATING_REMINDER_DISMISS)
}

function clearPending(): void {
  clearPendingTimer()
  pendingType = null
}

export function presentFloatingActionReminder(
  type: ReminderType,
  reminder: Reminder,
  isFloatingBallEnabled: boolean
): void {
  if (!isFloatingBallEnabled || !isActionableReminder(reminder.type)) return

  revealFloatingBallWindow()
  clearPending()
  pendingType = type

  const payload: FloatingReminderPayload = {
    reminder,
    expiresAt: Date.now() + FLOATING_REMINDER_TIMEOUT_MS
  }

  setFloatingBallActionMode(true)
  sendToFloatingBall(IPC.FLOATING_REMINDER_SHOW, payload)

  pendingTimeout = setTimeout(() => {
    skipFloatingReminder()
  }, FLOATING_REMINDER_TIMEOUT_MS)
}

export function ackFloatingReminder(): boolean {
  if (!pendingType || !onConfirm) return false

  const type = pendingType
  clearPending()
  dismissFloatingReminderUI()
  onConfirm(type)
  return true
}

export function skipFloatingReminder(): void {
  if (!pendingType) return
  clearPending()
  dismissFloatingReminderUI()
  onSkip?.()
}

export function clearFloatingReminderIfType(type: ReminderType): void {
  if (pendingType !== type) return
  clearPending()
  dismissFloatingReminderUI()
}
