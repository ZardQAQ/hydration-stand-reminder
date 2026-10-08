import { Menu, Tray } from 'electron'
import type { AppState } from '../../shared/types'
import { APP_NAME } from '../../shared/constants'
import { formatCountdown } from '../../shared/format'
import { getAppIcon } from '../icon'

let tray: Tray | null = null
let onNavigateTool: ((tool: string) => void) | null = null

export function createTrayIcon(): Electron.NativeImage {
  return getAppIcon(32)
}

export function initTray(
  onToggle: () => void,
  onShowWindow: () => void,
  onQuit: () => void,
  onNavigate?: (tool: string) => void
): Tray {
  onNavigateTool = onNavigate ?? null
  tray = new Tray(createTrayIcon())
  tray.on('click', onShowWindow)
  tray.on('double-click', onShowWindow)
  updateTrayMenu(
    {
      running: false,
      settings: {} as AppState['settings'],
      nextWaterAt: null,
      nextStandAt: null,
      activeBreakUntil: null,
      lastReminder: null,
      nextEyeBreakAt: null
    },
    onToggle,
    onShowWindow,
    onQuit
  )
  return tray
}

export function updateTrayNavigate(handler: (tool: string) => void): void {
  onNavigateTool = handler
}

export function updateTrayMenu(
  state: AppState,
  onToggle: () => void,
  onShowWindow: () => void,
  onQuit: () => void
): void {
  if (!tray) return
  const now = Date.now()
  const waterText = state.nextWaterAt
    ? `喝水：${formatCountdown(state.nextWaterAt, false, now)}`
    : '喝水：未开始'
  const standText = state.nextStandAt
    ? `站立：${formatCountdown(state.nextStandAt, false, now)}`
    : '站立：未开始'
  tray.setToolTip(APP_NAME)
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: state.running ? '暂停提醒' : '开始提醒',
        click: onToggle
      },
      { label: waterText, enabled: false },
      { label: standText, enabled: false },
      { type: 'separator' },
      {
        label: '剪贴板',
        click: () => onNavigateTool?.('clipboard')
      },
      {
        label: '工作事项',
        click: () => onNavigateTool?.('work-tasks')
      },
      {
        label: '便签',
        click: () => onNavigateTool?.('notes')
      },
      { type: 'separator' },
      { label: '显示窗口', click: onShowWindow },
      { label: '退出', click: onQuit }
    ])
  )
}

export function getTray(): Tray | null {
  return tray
}
