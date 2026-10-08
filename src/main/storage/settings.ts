import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { Settings } from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../shared/constants'
import { normalizeSettings } from '../../shared/workday'

function settingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function loadSettingsFromDisk(): Settings {
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8')
    return normalizeSettings(JSON.parse(raw) as Partial<Settings>)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettingsToDisk(settings: Settings): void {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2))
}
