import { BrowserWindow, screen } from 'electron'
import path from 'path'
import type { AppState } from '../shared/types'
import {
  FLOATING_ACTION_HEIGHT_RATIO,
  FLOATING_ACTION_WIDTH_RATIO,
  FLOATING_BALL_DEFAULT_SIZE,
  FLOATING_BALL_HEIGHT_RATIO,
  FLOATING_BALL_MAX_SIZE,
  FLOATING_BALL_MIN_SIZE,
  FLOATING_BALL_WIDTH_RATIO,
} from '../shared/constants'
import { clampNumber } from '../shared/format'
import { getState, updateSettings } from './reminder/timer'

let floatingBallWindow: BrowserWindow | null = null
let showBall = true
let actionMode = false

function getFloatingBallDevUrl(rendererUrl: string): string {
  const url = new URL(rendererUrl)
  const basePath = url.pathname.replace(/\/?index\.html$/, '').replace(/\/$/, '') || ''
  url.pathname = `${basePath}/floating-ball.html`
  return url.toString()
}

export function getFloatingBallWindow(): BrowserWindow | null {
  return floatingBallWindow
}

function getFloatingBallDimensions(size: number): { width: number; height: number } {
  const base = clampNumber(size, FLOATING_BALL_MIN_SIZE, FLOATING_BALL_MAX_SIZE)
  return {
    width: Math.round(base * FLOATING_BALL_WIDTH_RATIO),
    height: Math.round(base * FLOATING_BALL_HEIGHT_RATIO)
  }
}

function getActionDimensions(size: number): { width: number; height: number } {
  const base = clampNumber(size, FLOATING_BALL_MIN_SIZE, FLOATING_BALL_MAX_SIZE)
  return {
    width: Math.round(base * FLOATING_ACTION_WIDTH_RATIO),
    height: Math.round(base * FLOATING_ACTION_HEIGHT_RATIO)
  }
}

function setWindowBoundsKeepingCenter(width: number, height: number): void {
  const win = floatingBallWindow
  if (!win || win.isDestroyed()) return

  const [x, y] = win.getPosition()
  const [currentWidth, currentHeight] = win.getSize()
  const centerX = x + currentWidth / 2
  const centerY = y + currentHeight / 2

  win.setBounds({
    x: Math.round(centerX - width / 2),
    y: Math.round(centerY - height / 2),
    width,
    height
  })
}

export function sendToFloatingBall(channel: string, payload?: unknown): void {
  const win = getFloatingBallWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload)
  }
}

export function setFloatingBallActionMode(active: boolean): void {
  actionMode = active
  const size = getState().settings.floatingBallSize
  if (active) {
    const { width, height } = getActionDimensions(size)
    setWindowBoundsKeepingCenter(width, height)
  } else {
    applyFloatingBallWindowSize(size)
  }
}

export function applyFloatingBallWindowSize(size: number): void {
  if (actionMode) return

  const { width, height } = getFloatingBallDimensions(size)
  setWindowBoundsKeepingCenter(width, height)
}

export function resizeFloatingBall(delta: number): AppState {
  const current = getState()
  const nextSize = clampNumber(
    current.settings.floatingBallSize + delta,
    FLOATING_BALL_MIN_SIZE,
    FLOATING_BALL_MAX_SIZE
  )

  if (nextSize === current.settings.floatingBallSize) {
    return current
  }

  const next = updateSettings({
    ...current.settings,
    floatingBallSize: nextSize
  })
  if (!actionMode) {
    applyFloatingBallWindowSize(nextSize)
  }
  return next
}

export function createFloatingBall(initialShow = true, initialSize = FLOATING_BALL_DEFAULT_SIZE): BrowserWindow | null {
  showBall = initialShow
  const ballSize = clampNumber(initialSize, FLOATING_BALL_MIN_SIZE, FLOATING_BALL_MAX_SIZE)
  const { width: ballWidth, height: ballHeight } = getFloatingBallDimensions(ballSize)

  if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
    applyFloatingBallWindowSize(ballSize)
    if (showBall) floatingBallWindow.show()
    else floatingBallWindow.hide()
    return floatingBallWindow
  }

  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize
  const margin = 20

  floatingBallWindow = new BrowserWindow({
    width: ballWidth,
    height: ballHeight,
    x: screenWidth - ballWidth - margin,
    y: 160,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    floatingBallWindow.loadURL(getFloatingBallDevUrl(process.env.ELECTRON_RENDERER_URL))
  } else {
    floatingBallWindow.loadFile(
      path.join(__dirname, '../renderer/floating-ball.html')
    )
  }

  if (!showBall) {
    floatingBallWindow.hide()
  }

  floatingBallWindow.on('closed', () => {
    floatingBallWindow = null
  })

  return floatingBallWindow
}

export function updateFloatingBallVisibility(state: AppState): void {
  const shouldShow = state.settings.showFloatingBall !== false
  applyFloatingBallWindowSize(state.settings.floatingBallSize)

  if (showBall === shouldShow) return
  showBall = shouldShow

  if (!floatingBallWindow || floatingBallWindow.isDestroyed()) {
    if (shouldShow) createFloatingBall(true, state.settings.floatingBallSize)
    return
  }

  if (shouldShow) {
    floatingBallWindow.show()
  } else {
    floatingBallWindow.hide()
  }
}

export function revealFloatingBallWindow(): void {
  if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
    floatingBallWindow.show()
  }
}

export function hideFloatingBall(): void {
  if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
    floatingBallWindow.hide()
  }
}

export function destroyFloatingBall(): void {
  if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
    floatingBallWindow.destroy()
    floatingBallWindow = null
  }
}
