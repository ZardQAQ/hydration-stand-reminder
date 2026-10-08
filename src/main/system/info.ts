import os from 'os'
import si from 'systeminformation'
import type { SystemInfo } from '../../shared/types'

const MEMO_NET = { prevRx: 0, prevTx: 0, prevTime: 0 }

let cpuStaticCache: Awaited<ReturnType<typeof si.cpu>> | null = null
let slowCache: Omit<
  SystemInfo,
  'cpu' | 'mem' | 'network'
> | null = null
let slowCacheTime = 0

async function getFastInfo(): Promise<
  Pick<SystemInfo, 'cpu' | 'mem' | 'network'>
> {
  const [cpu, mem, networkStats] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.networkStats()
  ])

  const cpuLoadBreakdown = {
    user: (cpu.currentLoadUser || 0).toFixed(1),
    system: (cpu.currentLoadSystem || 0).toFixed(1),
    idle: (cpu.currentLoadIdle || 0).toFixed(1)
  }

  let netDown = 0
  let netUp = 0
  const now = Date.now()
  if (networkStats && networkStats.length > 0) {
    const totalRx = networkStats.reduce((s, i) => s + (i.rx_bytes || 0), 0)
    const totalTx = networkStats.reduce((s, i) => s + (i.tx_bytes || 0), 0)
    if (MEMO_NET.prevTime > 0 && now > MEMO_NET.prevTime) {
      const dt = (now - MEMO_NET.prevTime) / 1000
      netDown = Math.max(0, (totalRx - MEMO_NET.prevRx) / 1024 / dt)
      netUp = Math.max(0, (totalTx - MEMO_NET.prevTx) / 1024 / dt)
    }
    MEMO_NET.prevRx = totalRx
    MEMO_NET.prevTx = totalTx
    MEMO_NET.prevTime = now
  }

  return {
    cpu: {
      usage: cpu.currentLoad.toFixed(1),
      cores: cpu.cpus ? cpu.cpus.length : os.cpus().length,
      breakdown: cpuLoadBreakdown
    },
    mem: {
      usage: ((mem.used / mem.total) * 100).toFixed(1),
      total: mem.total,
      used: mem.used,
      free: mem.free,
      swapTotal: mem.swaptotal,
      swapUsed: mem.swapused
    },
    network: { down: netDown, up: netUp }
  }
}

async function getSlowInfo(): Promise<Omit<SystemInfo, 'cpu' | 'mem' | 'network'>> {
  const now = Date.now()
  if (slowCache && now - slowCacheTime < 30000) {
    return slowCache
  }

  const cpuStaticPromise = cpuStaticCache
    ? Promise.resolve(cpuStaticCache)
    : si.cpu().then((c) => {
        cpuStaticCache = c
        return c
      })

  const [fsSize, graphics, battery, osInfo, cpuTemp, cpuStatic] = await Promise.all([
    si.fsSize(),
    si.graphics(),
    si.battery(),
    si.osInfo(),
    si.cpuTemperature().catch(() => null),
    cpuStaticPromise
  ])

  let gpuUsage: number | null = null
  let gpuName = ''
  let gpuMemUsed: number | null = null
  let gpuMemTotal: number | null = null
  if (graphics.controllers && graphics.controllers.length > 0) {
    const gpu = graphics.controllers[0]
    gpuName = gpu.model || gpu.vendor || 'GPU'
    if (gpu.utilizationGpu !== undefined && gpu.utilizationGpu !== null) {
      gpuUsage = gpu.utilizationGpu
    }
    if (gpu.memoryUsed !== undefined && gpu.memoryUsed !== null) {
      gpuMemUsed = gpu.memoryUsed
    }
    if (gpu.memoryTotal !== undefined && gpu.memoryTotal !== null) {
      gpuMemTotal = gpu.memoryTotal
    }
  }

  let diskUsage: string | null = null
  let diskTotal = 0
  let diskUsed = 0
  let diskCount = 0
  if (fsSize && fsSize.length > 0) {
    const disk = fsSize.find((d) => d.mount === 'C:\\') || fsSize[0]
    diskTotal = disk.size
    diskUsed = disk.used
    diskUsage = ((disk.used / disk.size) * 100).toFixed(1)
    diskCount = fsSize.length
  }

  let batteryInfo: SystemInfo['battery'] = null
  if (battery && battery.hasBattery) {
    batteryInfo = {
      percent: battery.percent,
      isCharging: battery.isCharging,
      timeRemaining: battery.timeRemaining || null,
      maxCapacity: battery.maxCapacity || null,
      model: battery.model || null
    }
  }

  let cpuTempInfo: SystemInfo['cpuTemp'] = null
  if (cpuTemp && cpuTemp.main !== undefined && cpuTemp.main !== null && cpuTemp.main > 0) {
    cpuTempInfo = {
      main: cpuTemp.main,
      max: cpuTemp.max || 100,
      cores: cpuTemp.cores || null
    }
  }

  const cpuStaticInfo = cpuStatic
    ? {
        brand: cpuStatic.brand || cpuStatic.manufacturer || '',
        speed: cpuStatic.speed || 0,
        speedMin: cpuStatic.speedMin || 0,
        speedMax: cpuStatic.speedMax || 0,
        cores: cpuStatic.cores || 0,
        physicalCores: cpuStatic.physicalCores || 0
      }
    : null

  slowCache = {
    gpu: { usage: gpuUsage, name: gpuName, memUsed: gpuMemUsed, memTotal: gpuMemTotal },
    disk: { usage: diskUsage, total: diskTotal, used: diskUsed, count: diskCount },
    battery: batteryInfo,
    uptime: osInfo ? osInfo.uptime : null,
    sysOS: osInfo
      ? (osInfo.distro || osInfo.platform || '') +
        (osInfo.release ? ' ' + osInfo.release : '')
      : null,
    cpuTemp: cpuTempInfo,
    cpuStatic: cpuStaticInfo
  }
  slowCacheTime = now
  return slowCache
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const [fast, slow] = await Promise.all([getFastInfo(), getSlowInfo()])
  return { ...fast, ...slow }
}
