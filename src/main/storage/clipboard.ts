import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { ClipboardItem } from '../../shared/types'

function clipboardPath(): string {
  return path.join(app.getPath('userData'), 'clipboard-history.json')
}

export function clipboardCacheDir(): string {
  return path.join(app.getPath('userData'), 'clipboard-cache')
}

export function loadClipboardItems(): ClipboardItem[] {
  try {
    return JSON.parse(fs.readFileSync(clipboardPath(), 'utf8')) as ClipboardItem[]
  } catch {
    return []
  }
}

export function saveClipboardItems(items: ClipboardItem[]): ClipboardItem[] {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(clipboardPath(), JSON.stringify(items, null, 2))
  return items
}

export function pushClipboardItem(item: ClipboardItem, maxItems: number): ClipboardItem[] {
  const items = [item, ...loadClipboardItems()]
  return trimClipboardItems(items, maxItems)
}

export function trimClipboardItems(items: ClipboardItem[], maxItems: number): ClipboardItem[] {
  const pinned = items.filter((i) => i.pinned)
  const rest = items.filter((i) => !i.pinned)
  const trimmed = [...pinned, ...rest.slice(0, Math.max(0, maxItems - pinned.length))]
  return saveClipboardItems(trimmed)
}

export function deleteClipboardItem(id: string): ClipboardItem[] {
  const items = loadClipboardItems().filter((i) => i.id !== id)
  return saveClipboardItems(items)
}

export function pinClipboardItem(id: string): ClipboardItem[] {
  const items = loadClipboardItems().map((i) =>
    i.id === id ? { ...i, pinned: !i.pinned } : i
  )
  return saveClipboardItems(items)
}

export function clearClipboardItems(): ClipboardItem[] {
  return saveClipboardItems([])
}

export function getClipboardItem(id: string): ClipboardItem | undefined {
  return loadClipboardItems().find((i) => i.id === id)
}
