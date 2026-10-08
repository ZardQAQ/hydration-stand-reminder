import type { SystemInfo } from '../../shared/types'
import { MONITOR_ALERT_COOLDOWN_MS } from '../../shared/constants'
import { showSystemNotification } from '../reminder/notifications'
import { loadSettingsFromDisk } from '../storage/settings'
import { showMainWindow } from '../window'

let lastAlertAt = 0

export function checkMonitorAlert(info: SystemInfo): void {
  const settings = loadSettingsFromDisk()
  if (!settings.monitorAlertEnabled) return

  const cpu = Number(info.cpu.usage)
  if (!Number.isFinite(cpu) || cpu < settings.monitorAlertCpu) return

  const now = Date.now()
  if (now - lastAlertAt < MONITOR_ALERT_COOLDOWN_MS) return

  lastAlertAt = now
  showSystemNotification(
    {
      title: 'CPU 使用率过高',
      body: `当前 CPU ${cpu.toFixed(1)}%，已超过阈值 ${settings.monitorAlertCpu}%。`
    },
    settings.sound,
    showMainWindow
  )
}
