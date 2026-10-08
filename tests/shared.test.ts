import { describe, expect, it } from 'vitest'
import { formatCountdown, clampNumber, addMinutes } from '../src/shared/format'
import { isInsideWorkday, normalizeSettings } from '../src/shared/workday'
import { applyTimerAction, scheduleFromNow } from '../src/shared/timer-logic'
import {
  applyTodoTrigger,
  formatTodoTime,
  isSameDay,
  isTodoDue,
  nextDailyTrigger,
  todoImageUrl,
  todoStatusLabel
} from '../src/shared/todo-logic'
import {
  countPending,
  filterWorkTasks,
  formatTaskTime,
  normalizePriority,
  priorityLabel,
  sortWorkTasks
} from '../src/shared/work-task-logic'
import { isEyeBreakDue } from '../src/shared/eye-logic'
import { DEFAULT_SETTINGS } from '../src/shared/constants'
import type { AppState, TodoReminder, WorkTask } from '../src/shared/types'

describe('formatCountdown', () => {
  it('returns placeholder for null target', () => {
    expect(formatCountdown(null)).toBe('--:--')
  })

  it('formats remaining time with optional minute padding', () => {
    const now = 1_000_000
    const target = now + 5 * 60_000 + 3_000
    expect(formatCountdown(target, false, now)).toBe('5:03')
    expect(formatCountdown(target, true, now)).toBe('05:03')
  })
})

describe('clampNumber', () => {
  it('clamps invalid and out-of-range values', () => {
    expect(clampNumber('abc', 5, 10)).toBe(5)
    expect(clampNumber(999, 5, 10)).toBe(10)
    expect(clampNumber(7.6, 5, 10)).toBe(8)
  })
})

describe('isInsideWorkday', () => {
  it('returns true when workday filter is disabled', () => {
    expect(isInsideWorkday(DEFAULT_SETTINGS, new Date('2026-06-18T12:00:00'))).toBe(true)
  })

  it('respects configured workday window', () => {
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      useWorkday: true,
      workdayStart: '09:00',
      workdayEnd: '18:00'
    })
    expect(isInsideWorkday(settings, new Date('2026-06-18T10:00:00'))).toBe(true)
    expect(isInsideWorkday(settings, new Date('2026-06-18T20:00:00'))).toBe(false)
  })
})

describe('applyTimerAction', () => {
  const baseState: AppState = {
    running: false,
    settings: { ...DEFAULT_SETTINGS },
    nextWaterAt: null,
    nextStandAt: null,
    activeBreakUntil: null,
    lastReminder: null,
    nextEyeBreakAt: null
  }

  it('starts and schedules reminders', () => {
    const now = 2_000_000
    const started = applyTimerAction(baseState, 'start', {}, now)
    expect(started.running).toBe(true)
    expect(started.nextWaterAt).toBe(addMinutes(DEFAULT_SETTINGS.waterInterval, now))
    expect(started.nextStandAt).toBe(addMinutes(DEFAULT_SETTINGS.standInterval, now))
  })

  it('snoozes a reminder type', () => {
    const running = scheduleFromNow({ ...baseState, running: true }, 1_000_000)
    const snoozed = applyTimerAction(running, 'snooze', { type: 'water', minutes: 15 }, 1_000_000)
    expect(snoozed.nextWaterAt).toBe(addMinutes(15, 1_000_000))
  })
})

function makeTodo(overrides: Partial<TodoReminder> = {}): TodoReminder {
  return {
    id: '1',
    title: '测试',
    body: '做某事',
    repeat: 'once',
    at: new Date('2026-06-18T15:00:00').getTime(),
    enabled: true,
    createdAt: Date.now(),
    lastTriggeredAt: null,
    images: [],
    ...overrides
  }
}

describe('isTodoDue', () => {
  it('triggers once reminder when time has passed', () => {
    const todo = makeTodo({ repeat: 'once' })
    const now = new Date('2026-06-18T15:00:01').getTime()
    expect(isTodoDue(todo, now)).toBe(true)
  })

  it('does not trigger disabled or future once reminders', () => {
    const future = makeTodo({ repeat: 'once' })
    const before = new Date('2026-06-18T14:59:00').getTime()
    expect(isTodoDue(future, before)).toBe(false)
    expect(isTodoDue({ ...future, enabled: false }, before)).toBe(false)
  })

  it('triggers daily reminder at matching time once per day', () => {
    const todo = makeTodo({
      repeat: 'daily',
      at: new Date('2026-01-01T09:30:00').getTime()
    })
    const now = new Date('2026-06-18T09:30:00').getTime()
    expect(isTodoDue(todo, now)).toBe(true)
    expect(isTodoDue({ ...todo, lastTriggeredAt: now }, now)).toBe(false)
  })

  it('does not trigger daily reminder at wrong time', () => {
    const todo = makeTodo({
      repeat: 'daily',
      at: new Date('2026-01-01T09:30:00').getTime()
    })
    const now = new Date('2026-06-18T10:30:00').getTime()
    expect(isTodoDue(todo, now)).toBe(false)
  })
})

describe('applyTodoTrigger', () => {
  it('disables once reminders after trigger', () => {
    const todo = makeTodo({ repeat: 'once' })
    const now = Date.now()
    const next = applyTodoTrigger(todo, now)
    expect(next.enabled).toBe(false)
    expect(next.lastTriggeredAt).toBe(now)
  })

  it('keeps daily reminders enabled after trigger', () => {
    const todo = makeTodo({ repeat: 'daily' })
    const now = Date.now()
    const next = applyTodoTrigger(todo, now)
    expect(next.enabled).toBe(true)
    expect(next.lastTriggeredAt).toBe(now)
  })

  it('preserves attached images after a reminder fires', () => {
    const todo = makeTodo({
      images: [{ id: 'img-1', name: '白板.png', mimeType: 'image/png' }]
    })
    expect(applyTodoTrigger(todo, Date.now()).images).toEqual(todo.images)
  })
})

describe('eye break logic', () => {
  it('detects due eye break', () => {
    const now = 1_000_000
    expect(isEyeBreakDue(now - 1, now)).toBe(true)
    expect(isEyeBreakDue(now + 1000, now)).toBe(false)
    expect(isEyeBreakDue(null, now)).toBe(false)
  })
})

describe('todo helpers', () => {
  it('formats todo time labels', () => {
    const once = makeTodo({ repeat: 'once', at: new Date('2026-06-18T15:00:00').getTime() })
    const daily = makeTodo({ repeat: 'daily', at: new Date('2026-01-01T09:30:00').getTime() })
    expect(formatTodoTime(once)).toBe('2026-06-18 15:00')
    expect(formatTodoTime(daily)).toBe('每天 09:30')
  })

  it('computes next daily trigger', () => {
    const todo = makeTodo({
      repeat: 'daily',
      at: new Date('2026-01-01T09:30:00').getTime()
    })
    const now = new Date('2026-06-18T10:00:00').getTime()
    expect(nextDailyTrigger(todo, now)).toBe(new Date('2026-06-19T09:30:00').getTime())
  })

  it('detects same calendar day', () => {
    const a = new Date('2026-06-18T08:00:00').getTime()
    const b = new Date('2026-06-18T20:00:00').getTime()
    const c = new Date('2026-06-19T08:00:00').getTime()
    expect(isSameDay(a, b)).toBe(true)
    expect(isSameDay(a, c)).toBe(false)
  })

  it('returns status labels', () => {
    expect(todoStatusLabel(makeTodo({ repeat: 'once', enabled: false }))).toBe('已完成')
    expect(todoStatusLabel(makeTodo({ repeat: 'daily', enabled: false }))).toBe('已禁用')
    expect(todoStatusLabel(makeTodo({ enabled: true }))).toBe('待触发')
  })

  it('builds local image preview urls', () => {
    expect(todoImageUrl('11111111-2222-3333-4444-555555555555')).toBe(
      'todo-img://local/11111111-2222-3333-4444-555555555555'
    )
  })
})

function makeWorkTask(overrides: Partial<WorkTask> = {}): WorkTask {
  return {
    id: '1',
    title: '写周报',
    note: '',
    priority: 'normal',
    done: false,
    createdAt: 1_000,
    updatedAt: 1_000,
    completedAt: null,
    images: [],
    ...overrides
  }
}

describe('work task helpers', () => {
  it('normalizes priority values', () => {
    expect(normalizePriority('high')).toBe('high')
    expect(normalizePriority('bad')).toBe('normal')
    expect(priorityLabel('high')).toBe('高')
    expect(priorityLabel('low')).toBe('低')
  })

  it('filters and counts pending tasks', () => {
    const tasks = [
      makeWorkTask({ id: 'a', done: false }),
      makeWorkTask({ id: 'b', done: true }),
      makeWorkTask({ id: 'c', done: false })
    ]
    expect(countPending(tasks)).toBe(2)
    expect(filterWorkTasks(tasks, 'pending')).toHaveLength(2)
    expect(filterWorkTasks(tasks, 'done')).toHaveLength(1)
    expect(filterWorkTasks(tasks, 'all')).toHaveLength(3)
  })

  it('sorts pending high priority first', () => {
    const tasks = [
      makeWorkTask({ id: 'low', priority: 'low', createdAt: 3 }),
      makeWorkTask({ id: 'done', priority: 'high', done: true, createdAt: 4 }),
      makeWorkTask({ id: 'high', priority: 'high', createdAt: 1 }),
      makeWorkTask({ id: 'normal', priority: 'normal', createdAt: 2 })
    ]
    expect(sortWorkTasks(tasks).map((t) => t.id)).toEqual(['high', 'normal', 'low', 'done'])
  })

  it('formats task timestamps', () => {
    expect(formatTaskTime(new Date('2026-07-24T09:05:00').getTime())).toBe('07-24 09:05')
  })
})
