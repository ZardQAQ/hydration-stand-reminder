import type { Settings } from './types'
import { DEFAULT_SETTINGS } from './constants'
import { clampNumber } from './format'

export function isInsideWorkday(settings: Settings, now = new Date()): boolean {
  if (!settings.useWorkday) return true
  const [startHour, startMinute] = settings.workdayStart.split(':').map(Number)
  const [endHour, endMinute] = settings.workdayEnd.split(':').map(Number)
  const start = new Date(now)
  const end = new Date(now)
  start.setHours(startHour, startMinute, 0, 0)
  end.setHours(endHour, endMinute, 0, 0)
  return now >= start && now <= end
}

export function normalizeSettings(input: Partial<Settings>): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...input,
    waterInterval: clampNumber(input.waterInterval, 5, 240),
    standInterval: clampNumber(input.standInterval, 10, 240),
    standDuration: clampNumber(input.standDuration, 1, 30),
    snoozeMinutes: clampNumber(input.snoozeMinutes, 1, 60),
    workdayStart: input.workdayStart || DEFAULT_SETTINGS.workdayStart,
    workdayEnd: input.workdayEnd || DEFAULT_SETTINGS.workdayEnd,
    useWorkday: Boolean(input.useWorkday),
    enableWater: input.enableWater !== false,
    enableStand: input.enableStand !== false,
    autoStart: Boolean(input.autoStart),
    notifyBreakEnd: input.notifyBreakEnd !== false,
    sound: Boolean(input.sound),
    darkMode: Boolean(input.darkMode),
    clipboardEnabled: input.clipboardEnabled !== false,
    clipboardMaxItems: clampNumber(input.clipboardMaxItems, 20, 200),
    enableEyeBreak: Boolean(input.enableEyeBreak),
    eyeInterval: clampNumber(input.eyeInterval, 5, 120),
    eyeDuration: clampNumber(input.eyeDuration, 5, 120),
    monitorAlertCpu: clampNumber(input.monitorAlertCpu, 50, 100),
    monitorAlertEnabled: Boolean(input.monitorAlertEnabled),
    showFloatingBall: input.showFloatingBall !== false,
    floatingBallSize: clampNumber(
      input.floatingBallSize ?? DEFAULT_SETTINGS.floatingBallSize,
      56,
      140
    )
  }
}
