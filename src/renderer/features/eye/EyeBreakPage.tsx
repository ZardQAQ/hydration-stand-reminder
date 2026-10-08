import { useEffect, useState } from 'react'
import { formatCountdown } from '@shared/format'
import { api } from '../../api/client'
import { useAppState } from '../../contexts/AppStateContext'

export default function EyeBreakPage() {
  const appState = useAppState()
  const [todayCount, setTodayCount] = useState(0)
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    void api.getHistory().then((records) => {
      const today = new Date()
      const count = records.filter((r) => {
        if (r.type !== 'eye') return false
        const d = new Date(r.at)
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        )
      }).length
      setTodayCount(count)
    })
  }, [appState?.nextEyeBreakAt])

  const enabled = appState?.settings.enableEyeBreak ?? false

  return (
    <section id="tab-eye" className="tab-page active">
      <div className="eye-area settings-area">
        <h3 className="settings-title">用眼休息（20-20-20）</h3>
        <p className="eye-desc">
          每 20 分钟提醒你看向 6 米外，放松眼睛 20 秒。可在「设置 → 用眼休息」中调整。
        </p>
        <div className="eye-stats-row">
          <div className="eye-stat-card">
            <span className="eye-stat-label">状态</span>
            <strong>{enabled ? '用眼休息已启用' : '用眼休息未启用'}</strong>
          </div>
          <div className="eye-stat-card">
            <span className="eye-stat-label">下次提醒</span>
            <strong>
              {enabled ? formatCountdown(appState?.nextEyeBreakAt ?? null, true) : '--:--'}
            </strong>
          </div>
          <div className="eye-stat-card">
            <span className="eye-stat-label">今日休息</span>
            <strong>{todayCount}</strong>
          </div>
        </div>
      </div>
    </section>
  )
}
