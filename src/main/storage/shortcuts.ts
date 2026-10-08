import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { ShortcutActionId, ShortcutBinding } from '../../shared/types'
import { DEFAULT_SHORTCUTS } from '../../shared/constants'

function shortcutsPath(): string {
  return path.join(app.getPath('userData'), 'shortcuts.json')
}

export function loadShortcuts(): ShortcutBinding[] {
  try {
    const saved = JSON.parse(fs.readFileSync(shortcutsPath(), 'utf8')) as ShortcutBinding[]
    return DEFAULT_SHORTCUTS.map((def) => {
      const found = saved.find((s) => s.id === def.id)
      return found ? { ...def, accelerator: found.accelerator } : def
    })
  } catch {
    return [...DEFAULT_SHORTCUTS]
  }
}

export function saveShortcuts(bindings: ShortcutBinding[]): ShortcutBinding[] {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(shortcutsPath(), JSON.stringify(bindings, null, 2))
  return bindings
}

export function updateShortcut(id: ShortcutActionId, accelerator: string): ShortcutBinding[] {
  const bindings = loadShortcuts().map((b) => (b.id === id ? { ...b, accelerator } : b))
  return saveShortcuts(bindings)
}

export function resetShortcuts(): ShortcutBinding[] {
  return saveShortcuts([...DEFAULT_SHORTCUTS])
}
