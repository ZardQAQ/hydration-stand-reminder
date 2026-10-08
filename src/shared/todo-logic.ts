import { TODO_IMAGE_PROTOCOL } from './constants'
import type { TodoReminder } from './types'

export function isSameDay(a: number, b: number): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function isTodoDue(todo: TodoReminder, now: number): boolean {
  if (!todo.enabled) return false

  if (todo.repeat === 'once') {
    return now >= todo.at
  }

  const target = new Date(todo.at)
  const nowDate = new Date(now)
  if (
    nowDate.getHours() !== target.getHours() ||
    nowDate.getMinutes() !== target.getMinutes()
  ) {
    return false
  }

  if (todo.lastTriggeredAt && isSameDay(todo.lastTriggeredAt, now)) {
    return false
  }

  return true
}

export function applyTodoTrigger(todo: TodoReminder, now: number): TodoReminder {
  if (todo.repeat === 'once') {
    return { ...todo, enabled: false, lastTriggeredAt: now }
  }
  return { ...todo, lastTriggeredAt: now }
}

export function formatTodoTime(todo: TodoReminder): string {
  const date = new Date(todo.at)
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  if (todo.repeat === 'daily') {
    return `每天 ${time}`
  }
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day} ${time}`
}

export function nextDailyTrigger(todo: TodoReminder, now = Date.now()): number {
  const target = new Date(todo.at)
  const next = new Date(now)
  next.setHours(target.getHours(), target.getMinutes(), 0, 0)
  if (next.getTime() <= now) {
    next.setDate(next.getDate() + 1)
  }
  return next.getTime()
}

export function todoStatusLabel(todo: TodoReminder): string {
  if (!todo.enabled && todo.repeat === 'once') return '已完成'
  if (!todo.enabled) return '已禁用'
  return '待触发'
}

export function todoImageUrl(id: string): string {
  return `${TODO_IMAGE_PROTOCOL}://local/${encodeURIComponent(id)}`
}
