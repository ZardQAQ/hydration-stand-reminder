import { Notification } from 'electron'
import type { AppState, Reminder, ReminderType } from '../../shared/types'
import { addMinutes } from '../../shared/format'
import { reminderContent } from '../../shared/timer-logic'

export function showSystemNotification(
  reminder: Pick<Reminder, 'title' | 'body'>,
  sound: boolean,
  onClick: () => void
): void {
  if (!Notification.isSupported()) return
  const notification = new Notification({
    title: reminder.title,
    body: reminder.body,
    silent: !sound
  })
  notification.on('click', onClick)
  notification.show()
}

export function buildReminder(
  type: ReminderType,
  standDuration: number,
  at = Date.now()
): Reminder {
  const { title, body } = reminderContent(type, standDuration)
  return { type, title, body, at }
}

export function buildBreakEndReminder(at = Date.now()): Reminder {
  return {
    type: 'breakEnd',
    title: '活动结束',
    body: '可以坐下来了，继续保持良好节奏。',
    at
  }
}

export function buildTestReminder(at = Date.now()): Reminder {
  return {
    type: 'info',
    title: '提醒测试',
    body: '通知功能正常，你会在需要时收到喝水和站立提醒。',
    at
  }
}

export function applyReminderToState(
  state: AppState,
  type: ReminderType,
  at = Date.now()
): AppState {
  const reminder = buildReminder(type, state.settings.standDuration, at)
  return {
    ...state,
    lastReminder: reminder,
    activeBreakUntil:
      type === 'stand' ? addMinutes(state.settings.standDuration, at) : state.activeBreakUntil
  }
}
