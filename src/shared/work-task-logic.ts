import type { WorkTask, WorkTaskFilter, WorkTaskPriority } from './types'

const PRIORITY_ORDER: Record<WorkTaskPriority, number> = {
  high: 0,
  normal: 1,
  low: 2
}

export function normalizePriority(value: unknown): WorkTaskPriority {
  if (value === 'high' || value === 'low' || value === 'normal') return value
  return 'normal'
}

export function priorityLabel(priority: WorkTaskPriority): string {
  if (priority === 'high') return '高'
  if (priority === 'low') return '低'
  return '中'
}

export function filterWorkTasks(tasks: WorkTask[], filter: WorkTaskFilter): WorkTask[] {
  if (filter === 'pending') return tasks.filter((t) => !t.done)
  if (filter === 'done') return tasks.filter((t) => t.done)
  return tasks
}

export function sortWorkTasks(tasks: WorkTask[]): WorkTask[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (a.priority !== b.priority) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    return b.createdAt - a.createdAt
  })
}

export function countPending(tasks: WorkTask[]): number {
  return tasks.filter((t) => !t.done).length
}

export function formatTaskTime(timestamp: number): string {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}
