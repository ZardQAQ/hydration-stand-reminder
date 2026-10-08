import {
  TODO_IMAGE_MAX_BYTES,
  TODO_IMAGE_MAX_COUNT,
  TODO_IMAGE_MIME_TYPES
} from '@shared/constants'
import type { TodoImage, TodoImageInput } from '@shared/types'
import { todoImageUrl } from '@shared/todo-logic'

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp'
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp'
}

export interface DraftImage {
  key: string
  id?: string
  name: string
  mimeType: string
  previewUrl: string
  data?: ArrayBuffer
}

export function imagesFromTodo(images: TodoImage[] | undefined): DraftImage[] {
  return (images ?? []).map((image) => ({
    key: image.id,
    id: image.id,
    name: image.name,
    mimeType: image.mimeType,
    previewUrl: todoImageUrl(image.id)
  }))
}

export function toTodoImageInputs(images: DraftImage[]): TodoImageInput[] {
  return images.map((image) => ({
    id: image.id,
    name: image.name,
    mimeType: image.mimeType,
    data: image.data
  }))
}

export function revokeDraftImages(images: DraftImage[]): void {
  for (const image of images) {
    if (image.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(image.previewUrl)
    }
  }
}

export function inferImageMime(file: File): string | null {
  if (file.type === 'image/jpg') return 'image/jpeg'
  if ((TODO_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext ? EXT_MIME[ext] ?? null : null
}

export function isGenericClipboardImageName(name: string): boolean {
  return !name || /^image\.\w+$/i.test(name) || name === 'blob'
}

export function pastedImageFileName(mimeType: string, now = new Date()): string {
  const ext = MIME_EXT[mimeType] ?? 'png'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `粘贴图片-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.${ext}`
}

export function filesFromPasteEvent(event: ClipboardEvent): File[] {
  const data = event.clipboardData
  if (!data) return []

  const collected: File[] = []
  const seen = new Set<string>()

  const push = (file: File | null) => {
    if (!file) return
    const mimeType = inferImageMime(file)
    if (!mimeType) return
    const name = isGenericClipboardImageName(file.name)
      ? pastedImageFileName(mimeType)
      : file.name
    const named = name === file.name ? file : new File([file], name, { type: mimeType, lastModified: file.lastModified })
    const key = `${named.size}:${named.type}:${named.lastModified}`
    if (seen.has(key)) return
    seen.add(key)
    collected.push(named)
  }

  for (const item of Array.from(data.items)) {
    if (item.kind === 'file' && (item.type.startsWith('image/') || item.type === '')) {
      push(item.getAsFile())
    }
  }

  if (collected.length === 0) {
    for (const file of Array.from(data.files)) {
      push(file)
    }
  }

  return collected
}

export function validateImageFile(
  file: File,
  currentCount: number
): { mimeType: string } | { error: string } {
  if (currentCount >= TODO_IMAGE_MAX_COUNT) {
    return { error: `最多添加 ${TODO_IMAGE_MAX_COUNT} 张图片。` }
  }
  const mimeType = inferImageMime(file)
  if (!mimeType) {
    return { error: '仅支持 jpg、png、gif、webp、bmp 图片。' }
  }
  if (file.size > TODO_IMAGE_MAX_BYTES) {
    return { error: '单张图片不能超过 8MB。' }
  }
  return { mimeType }
}

export async function filesToDraftImages(
  files: FileList | File[],
  currentCount: number
): Promise<{ images: DraftImage[]; error?: string }> {
  const added: DraftImage[] = []
  let error: string | undefined

  for (const file of Array.from(files)) {
    const result = validateImageFile(file, currentCount + added.length)
    if ('error' in result) {
      error = result.error
      break
    }
    added.push({
      key: crypto.randomUUID(),
      name: file.name,
      mimeType: result.mimeType,
      previewUrl: URL.createObjectURL(file),
      data: await file.arrayBuffer()
    })
  }

  return { images: added, error }
}
