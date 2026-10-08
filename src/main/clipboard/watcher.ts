import { clipboard, nativeImage } from 'electron'
import fs from 'fs'
import path from 'path'
import type { ClipboardItem } from '../../shared/types'
import { CLIPBOARD_POLL_MS } from '../../shared/constants'
import { isDuplicateClipboardText, truncatePreview } from '../../shared/clipboard-logic'
import { IPC } from '../../shared/ipc-channels'
import { sendToRenderer } from '../window'
import { loadSettingsFromDisk } from '../storage/settings'
import {
  clipboardCacheDir,
  deleteClipboardItem,
  getClipboardItem,
  loadClipboardItems,
  pinClipboardItem,
  pushClipboardItem,
  saveClipboardItems,
  trimClipboardItems
} from '../storage/clipboard'

let items: ClipboardItem[] = []
let timer: ReturnType<typeof setInterval> | null = null
let lastText = ''
let lastImageHash = ''
let writing = false

function broadcast(): void {
  sendToRenderer(IPC.CLIPBOARD_CHANGED, [...items])
}

function imageHash(image: Electron.NativeImage): string {
  if (image.isEmpty()) return ''
  return image.toPNG().toString('base64').slice(0, 64)
}

function saveImage(image: Electron.NativeImage): string {
  const dir = clipboardCacheDir()
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, `${crypto.randomUUID()}.png`)
  fs.writeFileSync(filePath, image.toPNG())
  return filePath
}

function pollClipboard(): void {
  if (writing) return
  const settings = loadSettingsFromDisk()
  if (!settings.clipboardEnabled) return

  const text = clipboard.readText()
  if (text && !isDuplicateClipboardText(lastText, text)) {
    const latest = items[0]
    if (!latest || latest.kind !== 'text' || latest.text !== text) {
      lastText = text
      items = pushClipboardItem(
        {
          id: crypto.randomUUID(),
          kind: 'text',
          text,
          preview: truncatePreview(text),
          createdAt: Date.now(),
          pinned: false
        },
        settings.clipboardMaxItems
      )
      broadcast()
      return
    }
  }

  const image = clipboard.readImage()
  const hash = imageHash(image)
  if (hash && hash !== lastImageHash) {
    const latest = items[0]
    if (!latest || latest.kind !== 'image' || latest.imagePath !== hash) {
      lastImageHash = hash
      const imagePath = saveImage(image)
      items = pushClipboardItem(
        {
          id: crypto.randomUUID(),
          kind: 'image',
          preview: '[图片]',
          imagePath,
          createdAt: Date.now(),
          pinned: false
        },
        settings.clipboardMaxItems
      )
      broadcast()
    }
  }
}

export function initClipboardWatcher(): void {
  items = loadClipboardItems()
}

export function startClipboardWatcher(): void {
  if (timer) return
  timer = setInterval(pollClipboard, CLIPBOARD_POLL_MS)
}

export function stopClipboardWatcher(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export function getClipboardItems(): ClipboardItem[] {
  return [...items]
}

export function copyClipboardItem(id: string): boolean {
  const item = getClipboardItem(id)
  if (!item) return false
  writing = true
  try {
    if (item.kind === 'text' && item.text) {
      clipboard.writeText(item.text)
      lastText = item.text
    } else if (item.kind === 'image' && item.imagePath && fs.existsSync(item.imagePath)) {
      clipboard.writeImage(nativeImage.createFromPath(item.imagePath))
      lastImageHash = imageHash(clipboard.readImage())
    } else {
      return false
    }
    return true
  } finally {
    setTimeout(() => {
      writing = false
    }, 600)
  }
}

export function removeClipboardItem(id: string): ClipboardItem[] {
  items = deleteClipboardItem(id)
  broadcast()
  return [...items]
}

export function togglePinClipboardItem(id: string): ClipboardItem[] {
  items = pinClipboardItem(id)
  broadcast()
  return [...items]
}

export function clearAllClipboard(): ClipboardItem[] {
  items = saveClipboardItems([])
  broadcast()
  return [...items]
}

export function reloadClipboardFromSettings(): void {
  const settings = loadSettingsFromDisk()
  items = trimClipboardItems(items, settings.clipboardMaxItems)
  if (!settings.clipboardEnabled) {
    stopClipboardWatcher()
  } else {
    startClipboardWatcher()
  }
  broadcast()
}
