import { BrowserWindow, Menu } from 'electron'
import path from 'path'
import { APP_NAME } from '../shared/constants'
import { getFloatingBallWindow } from './floating-ball'
import { getAppIcon } from './icon'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

export function setQuitting(value: boolean): void {
  isQuitting = value
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function showMainWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

export function hideMainWindow(): void {
  mainWindow?.hide()
}

export function toggleMainWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
    mainWindow.hide()
  } else {
    showMainWindow()
  }
}

export function isMainWindowOnScreen(): boolean {
  return Boolean(
    mainWindow &&
      !mainWindow.isDestroyed() &&
      mainWindow.isVisible() &&
      !mainWindow.isMinimized()
  )
}

export function createWindow(onHide: () => void): BrowserWindow {
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 620,
    title: APP_NAME,
    icon: getAppIcon(),
    backgroundColor: '#f0f2f0',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
  mainWindow.on('hide', onHide)
  mainWindow.on('minimize', onHide)

  return mainWindow
}

function sendToWebContents(win: BrowserWindow | null, channel: string, payload?: unknown): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload)
  }
}

export function sendToRenderer(channel: string, payload?: unknown): void {
  sendToWebContents(mainWindow, channel, payload)
  sendToWebContents(getFloatingBallWindow(), channel, payload)
}
