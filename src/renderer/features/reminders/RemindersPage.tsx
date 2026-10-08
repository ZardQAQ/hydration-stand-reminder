import { useEffect, useState } from 'react'
import { formatCountdown, formatDue, progressRatio } from '@shared/format'
import { api } from '../../api/client'
import { useAppStateContext } from '../../contexts/AppStateContext'
import { ReminderGaugeCard } from '../../components/gauges/GaugeCards'

export default function RemindersPage() {
  const { state, setState } = useAppStateContext()
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!state?.running) return
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [state?.running])

  if (!state) return null

  const { settings } = state
  const waterEnabled = settings.enableWater
  const standEnabled = settings.enableStand
  const actionsDisabled = !state.running

  const handleAction = async (action: 'done' | 'snooze', type: 'water' | 'stand') => {
    const next = await api.action(action, { type })
    setState(next)
  }

  let activityTitle = state.running ? '提醒已经开始' : '今天从一个小提醒开始'
  let activityBody = state.running
    ? '窗口关闭后会进入托盘，提醒仍会继续运行。'
    : '开始后，应用会在后台运行，并通过系统通知提醒你。'

  if (state.activeBreakUntil) {
    activityTitle = '现在适合站起来活动'
    activityBody = `保持站立、走动或拉伸，持续 ${settings.standDuration} 分钟。`
  } else if (state.lastReminder) {
    activityTitle = state.lastReminder.title
    activityBody = state.lastReminder.body
  }

  return (
    <section id="tab-reminders" className="tab-page active">
      <div className="cards-row">
        <ReminderGaugeCard
          type="water"
          title="喝水"
          subtitle="下一次补水提醒"
          countdown={waterEnabled ? formatCountdown(state.nextWaterAt, true) : '已关闭'}
          due={waterEnabled ? formatDue(state.nextWaterAt) : '提醒已关闭'}
          minutes={settings.waterInterval}
          progress={waterEnabled ? progressRatio(state.nextWaterAt, settings.waterInterval) : 0}
          disabled={!waterEnabled}
          actionsDisabled={actionsDisabled || !waterEnabled}
          doneLabel="已喝水"
          onDone={() => void handleAction('done', 'water')}
          onSnooze={() => void handleAction('snooze', 'water')}
        />
        <ReminderGaugeCard
          type="stand"
          title="站立"
          subtitle="下一次活动提醒"
          countdown={standEnabled ? formatCountdown(state.nextStandAt, true) : '已关闭'}
          due={standEnabled ? formatDue(state.nextStandAt) : '提醒已关闭'}
          minutes={settings.standInterval}
          progress={standEnabled ? progressRatio(state.nextStandAt, settings.standInterval) : 0}
          disabled={!standEnabled}
          actionsDisabled={actionsDisabled || !standEnabled}
          doneLabel="已活动"
          onDone={() => void handleAction('done', 'stand')}
          onSnooze={() => void handleAction('snooze', 'stand')}
        />
      </div>
      <div className="activity-bar">
        <div className="activity-info">
          <h3>{activityTitle}</h3>
          <p>{activityBody}</p>
        </div>
        {state.activeBreakUntil ? (
          <div className="break-meter">
            <span>活动倒计时</span>
            <strong>{formatCountdown(state.activeBreakUntil, true)}</strong>
          </div>
        ) : null}
      </div>
    </section>
  )
}
