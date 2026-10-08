import { describe, expect, it } from 'vitest'
import {
  isGenericClipboardImageName,
  pastedImageFileName
} from '../src/renderer/features/todo/image-helpers'

describe('todo clipboard paste helpers', () => {
  it('treats screenshot default names as generic', () => {
    expect(isGenericClipboardImageName('image.png')).toBe(true)
    expect(isGenericClipboardImageName('image.jpeg')).toBe(true)
    expect(isGenericClipboardImageName('blob')).toBe(true)
    expect(isGenericClipboardImageName('')).toBe(true)
    expect(isGenericClipboardImageName('会议白板.png')).toBe(false)
  })

  it('names pasted screenshots with a timestamp', () => {
    const now = new Date('2026-08-31T10:15:07')
    expect(pastedImageFileName('image/png', now)).toBe('粘贴图片-20260831-101507.png')
    expect(pastedImageFileName('image/jpeg', now)).toBe('粘贴图片-20260831-101507.jpg')
  })
})
