import type { ToolboxApi } from '@shared/types'

declare global {
  interface Window {
    reminderApi: ToolboxApi
  }
}

export const api = window.reminderApi
