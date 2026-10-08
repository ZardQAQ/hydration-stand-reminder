import { useLayoutEffect, useRef, type ReactNode } from 'react'
import {
  REMINDER_GAUGE,
  buildTicks,
  setReminderGauge,
  buildArcPath,
  arcLength,
  MONITOR_GAUGE,
  setMonitorGauge,
  setArcProgress
} from './gauges'

interface ReminderGaugeCardProps {
  type: 'water' | 'stand'
  title: string
  subtitle: string
  countdown: string
  due: string
  minutes: number
  progress: number
  disabled: boolean
  actionsDisabled: boolean
  onDone: () => void
  onSnooze: () => void
  doneLabel: string
}

export function ReminderGaugeCard({
  type,
  title,
  subtitle,
  countdown,
  due,
  minutes,
  progress,
  disabled,
  actionsDisabled,
  onDone,
  onSnooze,
  doneLabel
}: ReminderGaugeCardProps) {
  const arcRef = useRef<SVGPathElement>(null)
  const trackRef = useRef<SVGPathElement>(null)
  const needleRef = useRef<SVGPolygonElement>(null)
  const ticksRef = useRef<SVGGElement>(null)
  const gradId = `${type}Grad`
  const glowId = `${type}Glow`
  const cardClass = type === 'water' ? 'water-card' : 'stand-card'
  const iconClass = type === 'water' ? 'water-icon' : 'stand-icon'
  const btnClass = type === 'water' ? 'water-btn' : 'stand-btn'
  const needleClass = type === 'water' ? 'water-needle' : 'stand-needle'
  const accent = type === 'water' ? '#0d7e6f' : '#d4583a'
  const gradStops =
    type === 'water'
      ? ['#5eead4', '#14b8a6', '#0d7e6f']
      : ['#fca5a1', '#f97044', '#d4583a']

  useLayoutEffect(() => {
    if (ticksRef.current) buildTicks(ticksRef.current, REMINDER_GAUGE, 6)
  }, [])

  useLayoutEffect(() => {
    if (arcRef.current && trackRef.current && needleRef.current) {
      setReminderGauge(arcRef.current, trackRef.current, needleRef.current, progress)
    }
  }, [progress])

  return (
    <article className={`card ${cardClass}${disabled ? ' is-disabled' : ''}`}>
      <div className="card-header">
        <div className={`card-icon ${iconClass}`}>
          {type === 'water' ? (
            <svg viewBox="0 0 24 24">
              <path d="M12 2C8 7 5.8 10.4 5.8 14.1a6.2 6.2 0 0 0 12.4 0C18.2 10.4 16 7 12 2Z" />
              <path d="M9.4 15.2c.5 1.4 1.5 2.1 2.9 2.2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M12 5.2a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" />
              <path d="M8.4 9.2L12 7.4l3.6 1.8" />
              <path d="M12 7.5v6.2" />
              <path d="m9.2 22 2.8-8.3 2.8 8.3" />
            </svg>
          )}
        </div>
        <div className="card-title">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="gauge-wrap">
        <svg className="gauge-svg" viewBox="0 0 200 160">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradStops[0]} />
              <stop offset="50%" stopColor={gradStops[1]} />
              <stop offset="100%" stopColor={gradStops[2]} />
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle className="gauge-bg" cx="100" cy="105" r="80" />
          <g className="gauge-ticks" ref={ticksRef} />
          <path className="gauge-track" ref={trackRef} />
          <path
            className="gauge-arc"
            ref={arcRef}
            stroke={`url(#${gradId})`}
            filter={`url(#${glowId})`}
          />
          <polygon className={`gauge-needle ${needleClass}`} ref={needleRef} />
          <circle cx="100" cy="105" r="10" fill="#fff" stroke="#d0d6d3" strokeWidth="1.5" />
          <circle cx="100" cy="105" r="4" fill={accent} />
        </svg>
        <div className="gauge-text">
          <span className="gauge-value">{countdown}</span>
          <span className="gauge-label">{due}</span>
        </div>
      </div>
      <div className="card-footer">
        <div className="card-minutes">
          <span>{minutes}</span> 分钟间隔
        </div>
      </div>
      <div className="card-actions">
        <button
          className={`btn-primary ${btnClass}`}
          type="button"
          disabled={actionsDisabled}
          onClick={onDone}
        >
          {doneLabel}
        </button>
        <button
          className="btn-secondary"
          type="button"
          disabled={actionsDisabled}
          onClick={onSnooze}
        >
          稍后
        </button>
      </div>
    </article>
  )
}

interface MonitorGaugeProps {
  arcClass: string
  value: string
  footer: ReactNode
  children: ReactNode
  ratio: number
}

export function MonitorGaugeCard({ arcClass, value, footer, children, ratio }: MonitorGaugeProps) {
  const arcRef = useRef<SVGPathElement>(null)
  const trackRef = useRef<SVGPathElement>(null)

  useLayoutEffect(() => {
    const config = MONITOR_GAUGE
    const trackPath = buildArcPath(config.cx, config.cy, config.r, config.startAngle, config.spanDeg)
    const len = arcLength(config)
    if (trackRef.current) trackRef.current.setAttribute('d', trackPath)
    if (arcRef.current) {
      arcRef.current.setAttribute('d', trackPath)
      setArcProgress(arcRef.current, 0, len)
    }
  }, [])

  useLayoutEffect(() => {
    if (arcRef.current) setMonitorGauge(arcRef.current, ratio)
  }, [ratio])

  return (
    <article className="monitor-card">
      {children}
      <div className="monitor-gauge-wrap">
        <svg className="monitor-gauge" viewBox="0 0 120 100">
          <path className="mg-track" ref={trackRef} />
          <path className={`mg-arc ${arcClass}`} ref={arcRef} />
        </svg>
        <div className="monitor-value">{value}</div>
      </div>
      <div className="monitor-footer">{footer}</div>
    </article>
  )
}
