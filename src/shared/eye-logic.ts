export function isEyeBreakDue(nextAt: number | null, now: number): boolean {
  return nextAt !== null && now >= nextAt
}

export function scheduleNextEyeBreak(intervalMinutes: number, now = Date.now()): number {
  return now + intervalMinutes * 60 * 1000
}
