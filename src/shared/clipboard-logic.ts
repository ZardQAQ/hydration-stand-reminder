import { CLIPBOARD_PREVIEW_MAX } from './constants'

export function truncatePreview(text: string, max = CLIPBOARD_PREVIEW_MAX): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max)}…`
}

export function isDuplicateClipboardText(prev: string | undefined, next: string): boolean {
  return prev === next
}
