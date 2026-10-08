import { useEffect, useState, type FormEvent } from 'react'
import type { Settings, SettingsInput } from '@shared/types'
import { api } from '../../api/client'
import { useAppStateContext } from '../../contexts/AppStateContext'
import { useToast } from '../../contexts/ToastContext'
import { applyDarkMode } from '../../lib/theme'
import { Toggle } from '../../components/common/Toggle'

function settingsToForm(settings: Settings) {
  return { ...settings }
}

export default function SettingsPage() {
  const { state, setState } = useAppStateContext()
  const { showToast } = useToast()
  const [form, setForm] = useState<Settings | null>(null)

  useEffect(() => {
    if (state?.settings) setForm(settingsToForm(state.settings))
  }, [state?.settings])

  if (!form) return null

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
    if (key === 'darkMode') applyDarkMode({ ...form, darkMode: value as boolean })
  }

  const toInput = (): SettingsInput => ({
    waterInterval: form.waterInterval,
    standInterval: form.standInterval,
    standDuration: form.standDuration,
    snoozeMinutes: form.snoozeMinutes,
    workdayStart: form.workdayStart,
    workdayEnd: form.workdayEnd,
    enableWater: form.enableWater,
    enableStand: form.enableStand,
    autoStart: form.autoStart,
    notifyBreakEnd: form.notifyBreakEnd,
    useWorkday: form.useWorkday,
    sound: form.sound,
    darkMode: form.darkMode,
    clipboardEnabled: form.clipboardEnabled,
    clipboardMaxItems: form.clipboardMaxItems,
    enableEyeBreak: form.enableEyeBreak,
    eyeInterval: form.eyeInterval,
    eyeDuration: form.eyeDuration,
    monitorAlertCpu: form.monitorAlertCpu,
    monitorAlertEnabled: form.monitorAlertEnabled,
    showFloatingBall: form.showFloatingBall,
    floatingBallSize: form.floatingBallSize
  })

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    const next = await api.updateSettings(toInput())
    setState(next)
    setForm(settingsToForm(next.settings))
    showToast('设置已保存', '新的设置已经生效。')
  }

  return (
    <section id="tab-settings" className="tab-page active">
      <form className="settings-area" onSubmit={(e) => void handleSave(e)}>
        <h3 className="settings-title">健康提醒</h3>
        <div className="settings-grid-3col">
          <div className="setting-item">
            <label htmlFor="waterInterval">喝水间隔（分钟）</label>
            <input
              id="waterInterval"
              name="waterInterval"
              type="number"
              min={5}
              max={240}
              value={form.waterInterval}
              onChange={(e) => update('waterInterval', Number(e.target.value))}
            />
          </div>
          <div className="setting-item">
            <label htmlFor="standInterval">站立间隔（分钟）</label>
            <input
              id="standInterval"
              name="standInterval"
              type="number"
              min={10}
              max={240}
              value={form.standInterval}
              onChange={(e) => update('standInterval', Number(e.target.value))}
            />
          </div>
          <div className="setting-item">
            <label htmlFor="standDuration">活动时长（分钟）</label>
            <input
              id="standDuration"
              name="standDuration"
              type="number"
              min={1}
              max={30}
              value={form.standDuration}
              onChange={(e) => update('standDuration', Number(e.target.value))}
            />
          </div>
          <div className="setting-item">
            <label htmlFor="snoozeMinutes">稍后提醒（分钟）</label>
            <input
              id="snoozeMinutes"
              name="snoozeMinutes"
              type="number"
              min={1}
              max={60}
              value={form.snoozeMinutes}
              onChange={(e) => update('snoozeMinutes', Number(e.target.value))}
            />
          </div>
          <div className="setting-item">
            <label htmlFor="workdayStart">工作开始</label>
            <input
              id="workdayStart"
              name="workdayStart"
              type="time"
              value={form.workdayStart}
              onChange={(e) => update('workdayStart', e.target.value)}
            />
          </div>
          <div className="setting-item">
            <label htmlFor="workdayEnd">工作结束</label>
            <input
              id="workdayEnd"
              name="workdayEnd"
              type="time"
              value={form.workdayEnd}
              onChange={(e) => update('workdayEnd', e.target.value)}
            />
          </div>
        </div>
        <div className="setting-toggles">
          <Toggle checked={form.enableWater} onChange={(v) => update('enableWater', v)} label="喝水提醒" />
          <Toggle checked={form.enableStand} onChange={(v) => update('enableStand', v)} label="站立提醒" />
          <Toggle checked={form.autoStart} onChange={(v) => update('autoStart', v)} label="启动时自动开始" />
          <Toggle checked={form.notifyBreakEnd} onChange={(v) => update('notifyBreakEnd', v)} label="活动结束提醒" />
          <Toggle checked={form.useWorkday} onChange={(v) => update('useWorkday', v)} label="仅工作时间" />
          <Toggle checked={form.sound} onChange={(v) => update('sound', v)} label="提示音" />
          <Toggle checked={form.darkMode} onChange={(v) => update('darkMode', v)} label="深色模式" />
          <Toggle checked={form.showFloatingBall} onChange={(v) => update('showFloatingBall', v)} label="显示桌面悬浮球" />
        </div>

        <h3 className="settings-title settings-group-title">剪贴板</h3>
        <div className="setting-toggles">
          <Toggle checked={form.clipboardEnabled} onChange={(v) => update('clipboardEnabled', v)} label="启用剪贴板监听" />
        </div>
        <div className="settings-grid-3col">
          <div className="setting-item">
            <label htmlFor="clipboardMaxItems">历史条数上限</label>
            <input
              id="clipboardMaxItems"
              name="clipboardMaxItems"
              type="number"
              min={20}
              max={200}
              value={form.clipboardMaxItems}
              onChange={(e) => update('clipboardMaxItems', Number(e.target.value))}
            />
          </div>
        </div>

        <h3 className="settings-title settings-group-title">用眼休息</h3>
        <div className="setting-toggles">
          <Toggle checked={form.enableEyeBreak} onChange={(v) => update('enableEyeBreak', v)} label="启用用眼休息" />
        </div>
        <div className="settings-grid-3col">
          <div className="setting-item">
            <label htmlFor="eyeInterval">提醒间隔（分钟）</label>
            <input
              id="eyeInterval"
              name="eyeInterval"
              type="number"
              min={5}
              max={120}
              value={form.eyeInterval}
              onChange={(e) => update('eyeInterval', Number(e.target.value))}
            />
          </div>
          <div className="setting-item">
            <label htmlFor="eyeDuration">休息时长（秒）</label>
            <input
              id="eyeDuration"
              name="eyeDuration"
              type="number"
              min={5}
              max={120}
              value={form.eyeDuration}
              onChange={(e) => update('eyeDuration', Number(e.target.value))}
            />
          </div>
        </div>

        <h3 className="settings-title settings-group-title">系统监控</h3>
        <div className="setting-toggles">
          <Toggle checked={form.monitorAlertEnabled} onChange={(v) => update('monitorAlertEnabled', v)} label="CPU 超阈值告警" />
        </div>
        <div className="settings-grid-3col">
          <div className="setting-item">
            <label htmlFor="monitorAlertCpu">告警阈值（%）</label>
            <input
              id="monitorAlertCpu"
              name="monitorAlertCpu"
              type="number"
              min={50}
              max={100}
              value={form.monitorAlertCpu}
              onChange={(e) => update('monitorAlertCpu', Number(e.target.value))}
            />
          </div>
        </div>

        <h3 className="settings-title settings-group-title">数据管理</h3>
        <p className="settings-warning-text">
          以下操作不可撤销，将删除便签、待办、剪贴板历史、统计记录，并恢复默认设置。
        </p>
        <div className="settings-actions settings-danger-actions">
          <button
            className="btn-danger"
            type="button"
            onClick={async () => {
              const confirmed = window.confirm(
                '确定要清除所有数据吗？\n\n将删除便签、待办、剪贴板历史、统计记录，并重置提醒状态与设置为默认值。此操作不可撤销。'
              )
              if (!confirmed) return
              const next = await api.clearAllData()
              setState(next)
              setForm(settingsToForm(next.settings))
              showToast('已清除', '所有数据已重置。')
            }}
          >
            清除所有数据
          </button>
        </div>

        <div className="settings-actions settings-main-actions">
          <button className="btn-save" type="submit">
            保存设置
          </button>
          <button
            className="btn-reset"
            type="button"
            onClick={async () => {
              const next = await api.resetSettings()
              setState(next)
              setForm(settingsToForm(next.settings))
              showToast('已恢复默认', '所有设置已恢复到初始状态。')
            }}
          >
            恢复默认
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={async () => {
              await api.testReminder()
              showToast('已发送测试提醒', '请查看系统通知或弹窗。')
            }}
          >
            测试提醒
          </button>
        </div>
      </form>
    </section>
  )
}
