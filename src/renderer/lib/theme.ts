import type { Settings } from '@shared/types'

export function applyDarkMode(settings: Settings): void {
  document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
}
