import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { HistoryRecord } from '../../shared/types'
import { HISTORY_RETENTION_MS } from '../../shared/constants'

function historyPath(): string {
  return path.join(app.getPath('userData'), 'history.json')
}

export function loadHistory(): HistoryRecord[] {
  try {
    return JSON.parse(fs.readFileSync(historyPath(), 'utf8')) as HistoryRecord[]
  } catch {
    return []
  }
}

export function saveHistory(records: HistoryRecord[]): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(historyPath(), JSON.stringify(records, null, 2))
}

export function recordAction(type: HistoryRecord['type']): void {
  const records = loadHistory()
  records.push({ type, at: Date.now() })
  const cutoff = Date.now() - HISTORY_RETENTION_MS
  saveHistory(records.filter((r) => r.at > cutoff))
}
