import { globalShortcut } from 'electron'
import type { ShortcutActionId } from '../../shared/types'
import { loadShortcuts, resetShortcuts, updateShortcut } from '../storage/shortcuts'

export interface ShortcutHandlers {
  toggleWindow: () => void
  quickNote: () => void
  markWater: () => void
  markStand: () => void
}

let handlers: ShortcutHandlers | null = null

const actionMap: Record<ShortcutActionId, keyof ShortcutHandlers> = {
  toggleWindow: 'toggleWindow',
  quickNote: 'quickNote',
  markWater: 'markWater',
  markStand: 'markStand'
}

export function initShortcuts(h: ShortcutHandlers): void {
  handlers = h
  registerAll()
}

export function registerAll(): string[] {
  globalShortcut.unregisterAll()
  const failures: string[] = []
  if (!handlers) return failures

  for (const binding of loadShortcuts()) {
    const action = actionMap[binding.id]
    if (!action) continue
    try {
      const ok = globalShortcut.register(binding.accelerator, () => {
        handlers?.[action]()
      })
      if (!ok) failures.push(binding.label)
    } catch {
      failures.push(binding.label)
    }
  }
  return failures
}

export function getShortcuts() {
  return loadShortcuts()
}

export function updateShortcutBinding(id: ShortcutActionId, accelerator: string) {
  const bindings = updateShortcut(id, accelerator)
  registerAll()
  return bindings
}

export function resetShortcutBindings() {
  const bindings = resetShortcuts()
  registerAll()
  return bindings
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll()
}
