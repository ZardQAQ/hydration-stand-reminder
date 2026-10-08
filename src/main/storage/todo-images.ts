import { app, BrowserWindow, dialog, net, protocol } from 'electron'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'node:url'
import {
  TODO_IMAGE_MAX_BYTES,
  TODO_IMAGE_MAX_COUNT,
  TODO_IMAGE_MIME_TYPES,
  TODO_IMAGE_PROTOCOL
} from '../../shared/constants'
import type { TodoImage, TodoImageInput } from '../../shared/types'

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp'
}

const ALLOWED_MIME = new Set<string>(TODO_IMAGE_MIME_TYPES)
const IMAGE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function registerTodoImageScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: TODO_IMAGE_PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true
      }
    }
  ])
}

export function registerTodoImageProtocol(): void {
  protocol.handle(TODO_IMAGE_PROTOCOL, (request) => {
    const id = decodeURIComponent(new URL(request.url).pathname.replace(/^\//, ''))
    const filePath = resolveTodoImagePath(id)
    if (!filePath) {
      return new Response('Not found', { status: 404 })
    }
    return net.fetch(pathToFileURL(filePath).href)
  })
}

export function todoImagesDir(): string {
  return path.join(app.getPath('userData'), 'todo-images')
}

export function resolveTodoImagePath(id: string): string | null {
  if (!IMAGE_ID_RE.test(id)) return null
  const dir = todoImagesDir()
  if (!fs.existsSync(dir)) return null
  const match = fs.readdirSync(dir).find((file) => path.parse(file).name === id)
  if (!match) return null
  const resolved = path.resolve(dir, match)
  if (!resolved.startsWith(path.resolve(dir) + path.sep)) return null
  return resolved
}

export function persistTodoImages(
  incoming: TodoImageInput[] | undefined,
  previous: TodoImage[] = []
): TodoImage[] {
  if (incoming === undefined) return previous

  const previousById = new Map(previous.map((image) => [image.id, image]))
  const next: TodoImage[] = []

  for (const item of incoming ?? []) {
    if (next.length >= TODO_IMAGE_MAX_COUNT) break

    const buffer = toBuffer(item.data)
    if (buffer) {
      const saved = saveTodoImageFile(item.mimeType, item.name, buffer)
      if (saved) next.push(saved)
      continue
    }

    if (item.id && previousById.has(item.id)) {
      next.push(previousById.get(item.id)!)
    }
  }

  const keptIds = new Set(next.map((image) => image.id))
  for (const image of previous) {
    if (!keptIds.has(image.id)) {
      deleteTodoImageFile(image.id)
    }
  }

  return next
}

export function deleteTodoImageFile(id: string): void {
  const filePath = resolveTodoImagePath(id)
  if (!filePath) return
  try {
    fs.unlinkSync(filePath)
  } catch {
    /* ignore missing files */
  }
}

export function deleteTodoImageFiles(images: TodoImage[] | undefined): void {
  for (const image of images ?? []) {
    deleteTodoImageFile(image.id)
  }
}

export function clearAllTodoImages(): void {
  const dir = todoImagesDir()
  if (!fs.existsSync(dir)) return
  fs.rmSync(dir, { recursive: true, force: true })
}

export async function downloadTodoImage(
  id: string,
  suggestedName?: string,
  win?: BrowserWindow | null
): Promise<boolean> {
  const src = resolveTodoImagePath(id)
  if (!src) return false

  const ext = path.extname(src).replace('.', '') || 'png'
  const fallbackName = suggestedName?.trim() || `待办图片.${ext}`
  const result = await dialog.showSaveDialog(win ?? undefined, {
    title: '保存图片',
    defaultPath: fallbackName,
    filters: [{ name: '图片', extensions: [ext] }]
  })

  if (result.canceled || !result.filePath) return false
  fs.copyFileSync(src, result.filePath)
  return true
}

function saveTodoImageFile(mimeType: string, name: string, data: Buffer): TodoImage | null {
  const mime = normalizeMimeType(mimeType, name)
  if (!mime || data.byteLength === 0 || data.byteLength > TODO_IMAGE_MAX_BYTES) return null

  const ext = MIME_EXTENSION[mime]
  if (!ext) return null

  const id = crypto.randomUUID()
  const dir = todoImagesDir()
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${id}${ext}`), data)

  return {
    id,
    name: sanitizeFileName(name, ext),
    mimeType: mime
  }
}

function toBuffer(data: unknown): Buffer | null {
  if (!data) return null
  if (Buffer.isBuffer(data)) return data
  if (data instanceof ArrayBuffer) return Buffer.from(data)
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  }
  if (typeof data === 'object' && data !== null && 'data' in data) {
    const bytes = (data as { data: unknown }).data
    if (Array.isArray(bytes)) return Buffer.from(bytes)
  }
  return null
}

function normalizeMimeType(mimeType: string, name: string): string | null {
  if (mimeType === 'image/jpg') return 'image/jpeg'
  if (ALLOWED_MIME.has(mimeType)) return mimeType

  const ext = path.extname(name).replace('.', '').toLowerCase()
  const fromExt: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp'
  }
  return fromExt[ext] ?? null
}

function sanitizeFileName(name: string, ext: string): string {
  const raw = path.basename(name || `image${ext}`)
  let cleaned = ''
  for (const char of raw) {
    const code = char.charCodeAt(0)
    if (code < 32 || '<>:"/\\|?*'.includes(char)) {
      cleaned += '_'
    } else {
      cleaned += char
    }
  }
  cleaned = cleaned.trim() || `image${ext}`
  return cleaned.slice(0, 120)
}
