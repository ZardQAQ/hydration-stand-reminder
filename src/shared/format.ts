export function formatCountdown(
  target: number | null,
  padMinutes = false,
  now = Date.now()
): string {
  if (target === null) return '--:--'
  const diff = Math.max(0, target - now)
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  const minStr = padMinutes ? String(minutes).padStart(2, '0') : String(minutes)
  return `${minStr}:${String(seconds).padStart(2, '0')}`
}

export function formatDue(target: number | null): string {
  if (!target) return '等待开始'
  const date = new Date(target)
  return `预计 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function progressRatio(
  target: number | null,
  intervalMinutes: number,
  now = Date.now()
): number {
  if (!target) return 0
  const total = intervalMinutes * 60 * 1000
  const remaining = Math.max(0, target - now)
  return (total - remaining) / total
}

export function clampNumber(value: unknown, min: number, max: number): number {
  const number = Number(value)
  if (!Number.isFinite(number)) return min
  return Math.min(max, Math.max(min, Math.round(number)))
}

export function addMinutes(minutes: number, from = Date.now()): number {
  return from + minutes * 60 * 1000
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

export function formatNetSpeed(kbps: number | null | undefined): string {
  if (kbps === null || kbps === undefined) return '--'
  if (kbps < 1000) return kbps.toFixed(1) + ' KB/s'
  return (kbps / 1024).toFixed(1) + ' MB/s'
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '--'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return d + '天 ' + h + '时'
  return h + '时 ' + m + '分'
}
