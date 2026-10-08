export type ToolId =
  | 'reminders'
  | 'todo'
  | 'work-tasks'
  | 'stats'
  | 'eye'
  | 'clipboard'
  | 'notes'
  | 'monitor'
  | 'shortcuts'
  | 'settings'
  | 'about'

export const PAGE_TITLES: Record<ToolId, string> = {
  reminders: '健康提醒',
  todo: '待办提醒',
  'work-tasks': '工作事项',
  stats: '统计',
  eye: '用眼休息',
  clipboard: '剪贴板',
  notes: '便签',
  monitor: '系统监控',
  shortcuts: '快捷键',
  settings: '设置',
  about: '关于'
}
