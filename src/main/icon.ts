import { app, nativeImage } from 'electron'
import path from 'path'

export function getIconPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icon.png')
  }
  return path.join(app.getAppPath(), 'build/icon.png')
}

export function getAppIcon(size?: number): Electron.NativeImage {
  const image = nativeImage.createFromPath(getIconPath())
  if (size && !image.isEmpty()) {
    return image.resize({ width: size, height: size })
  }
  return image
}
