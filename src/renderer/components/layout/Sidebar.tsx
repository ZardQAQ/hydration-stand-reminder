import { useNavigation } from '../../contexts/NavigationContext'
import type { ToolId } from '../../lib/types'
import appIcon from '../../assets/icon.png'

const SECTIONS: { label: string; tools: { id: ToolId; label: string }[] }[] = [
  {
    label: '健康',
    tools: [
      { id: 'reminders', label: '提醒' },
      { id: 'todo', label: '待办提醒' },
      { id: 'work-tasks', label: '工作事项' },
      { id: 'stats', label: '统计' },
      { id: 'eye', label: '用眼休息' }
    ]
  },
  {
    label: '工具',
    tools: [
      { id: 'clipboard', label: '剪贴板' },
      { id: 'notes', label: '便签' },
      { id: 'monitor', label: '系统监控' },
      { id: 'shortcuts', label: '快捷键' }
    ]
  },
  {
    label: '系统',
    tools: [
      { id: 'settings', label: '设置' },
      { id: 'about', label: '关于' }
    ]
  }
]

export function Sidebar() {
  const { activeTool, switchTool } = useNavigation()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img className="logo-icon" src={appIcon} alt="" />
        <span>效率工具箱</span>
      </div>
      <nav className="sidebar-nav">
        {SECTIONS.map((section) => (
          <div key={section.label} className="sidebar-section">
            <span className="sidebar-section-label">{section.label}</span>
            {section.tools.map((tool) => (
              <button
                key={tool.id}
                className={`sidebar-item${activeTool === tool.id ? ' active' : ''}`}
                type="button"
                onClick={() => switchTool(tool.id)}
              >
                {tool.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
