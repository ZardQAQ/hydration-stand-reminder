const SVG_NS = 'http://www.w3.org/2000/svg'

export interface ArcGaugeConfig {
  cx: number
  cy: number
  r: number
  startAngle: number
  spanDeg: number
}

export function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export function buildArcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  spanDeg: number
): string {
  const s = polarToXY(cx, cy, r, startAngle)
  const e = polarToXY(cx, cy, r, startAngle + spanDeg)
  const large = spanDeg > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

export function arcLength(config: ArcGaugeConfig): number {
  return (config.spanDeg / 360) * 2 * Math.PI * config.r
}

export function setArcProgress(
  arcEl: SVGPathElement,
  ratio: number,
  length: number
): void {
  const clamped = Math.min(1, Math.max(0, ratio))
  arcEl.style.strokeDasharray = `${length * clamped} ${length}`
}

export function buildTicks(
  container: SVGGElement,
  config: ArcGaugeConfig,
  majorCount: number
): void {
  container.innerHTML = ''
  const minorStep = config.spanDeg / (majorCount * 5)
  for (let i = 0; i <= majorCount * 5; i++) {
    const angle = config.startAngle + i * minorStep
    const isMajor = i % 5 === 0
    const innerR = isMajor ? config.r - 8 : config.r - 4
    const p1 = polarToXY(config.cx, config.cy, innerR, angle)
    const p2 = polarToXY(config.cx, config.cy, config.r, angle)
    const line = document.createElementNS(SVG_NS, 'line')
    line.setAttribute('x1', String(p1.x))
    line.setAttribute('y1', String(p1.y))
    line.setAttribute('x2', String(p2.x))
    line.setAttribute('y2', String(p2.y))
    line.setAttribute('class', isMajor ? 'tick-major' : 'tick-minor')
    container.appendChild(line)
  }
}

export const REMINDER_GAUGE: ArcGaugeConfig = {
  cx: 100,
  cy: 105,
  r: 68,
  startAngle: 150,
  spanDeg: 240
}

export const MONITOR_GAUGE: ArcGaugeConfig = {
  cx: 60,
  cy: 80,
  r: 45,
  startAngle: 150,
  spanDeg: 240
}

export function setReminderGauge(
  arcEl: SVGPathElement,
  trackEl: SVGPathElement,
  needleEl: SVGPolygonElement,
  ratio: number
): void {
  const config = REMINDER_GAUGE
  const len = arcLength(config)
  setArcProgress(arcEl, ratio, len)
  trackEl.setAttribute(
    'd',
    buildArcPath(config.cx, config.cy, config.r, config.startAngle, config.spanDeg)
  )
  const angleDeg = config.startAngle + ratio * config.spanDeg
  const tip = polarToXY(config.cx, config.cy, 58, angleDeg)
  const tail = polarToXY(config.cx, config.cy, 12, angleDeg + 180)
  const baseL = polarToXY(config.cx, config.cy, 5, angleDeg + 90)
  const baseR = polarToXY(config.cx, config.cy, 5, angleDeg - 90)
  needleEl.setAttribute(
    'points',
    `${tip.x},${tip.y} ${baseL.x},${baseL.y} ${tail.x},${tail.y} ${baseR.x},${baseR.y}`
  )
}

export function initMonitorGauges(): void {
  const config = MONITOR_GAUGE
  const trackPath = buildArcPath(config.cx, config.cy, config.r, config.startAngle, config.spanDeg)
  const len = arcLength(config)
  ;['cpuTrack', 'gpuTrack', 'memTrack', 'diskTrack', 'tempTrack', 'batTrack'].forEach((id) => {
    document.getElementById(id)?.setAttribute('d', trackPath)
  })
  ;['cpuArc', 'gpuArc', 'memArc', 'diskArc', 'tempArc', 'batArc'].forEach((id) => {
    const el = document.getElementById(id) as SVGPathElement | null
    if (!el) return
    el.setAttribute('d', trackPath)
    el.style.strokeDasharray = `0 ${len}`
  })
}

export function setMonitorGauge(arcEl: SVGPathElement, ratio: number): void {
  setArcProgress(arcEl, ratio, arcLength(MONITOR_GAUGE))
}
