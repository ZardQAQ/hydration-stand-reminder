import { api } from '../../api/client'
import { useAppStateContext } from '../../contexts/AppStateContext'
import { useNavigation } from '../../contexts/NavigationContext'
import { PAGE_TITLES } from '../../lib/types'

export function AppHeader() {
  const { activeTool } = useNavigation()
  const { state, setState } = useAppStateContext()
  const showReminderControls = activeTool === 'reminders'
  const running = state?.running ?? false

  const handleToggle = async () => {
    const action = running ? 'pause' : 'start'
    const next = await api.action(action)
    setState(next)
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>{PAGE_TITLES[activeTool]}</h1>
      </div>
      <div className={`header-right${showReminderControls ? '' : ' hidden'}`}>
        <span className={`status-dot${running ? ' is-running' : ''}`} />
        <span className="status-text">{running ? '提醒运行中' : '提醒已暂停'}</span>
        <button
          className={`btn-start${running ? ' is-paused' : ''}`}
          type="button"
          onClick={() => void handleToggle()}
          aria-label={running ? '暂停提醒' : '开始提醒'}
        >
          {running ? (
            <span className="btn-start-pause" aria-hidden="true">
              <span />
              <span />
            </span>
          ) : (
            <span className="btn-start-play" aria-hidden="true">
              ▶
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
