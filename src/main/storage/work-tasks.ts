import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { WorkTask, WorkTaskInput } from '../../shared/types'
import { normalizePriority } from '../../shared/work-task-logic'
import { deleteTodoImageFiles, persistTodoImages } from './todo-images'

function workTasksPath(): string {
  return path.join(app.getPath('userData'), 'work-tasks.json')
}

function normalizeTask(task: WorkTask): WorkTask {
  return {
    ...task,
    images: Array.isArray(task.images) ? task.images : []
  }
}

export function loadWorkTasks(): WorkTask[] {
  try {
    const raw = JSON.parse(fs.readFileSync(workTasksPath(), 'utf8')) as WorkTask[]
    return raw.map(normalizeTask)
  } catch {
    return []
  }
}

export function saveWorkTasks(tasks: WorkTask[]): WorkTask[] {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(workTasksPath(), JSON.stringify(tasks, null, 2))
  return tasks
}

export function upsertWorkTask(input: WorkTaskInput): WorkTask[] {
  const tasks = loadWorkTasks()
  const now = Date.now()
  const title = input.title.trim()
  if (!title) return tasks

  const idx = input.id ? tasks.findIndex((t) => t.id === input.id) : -1

  if (idx >= 0) {
    const prev = tasks[idx]
    const done = input.done ?? prev.done
    tasks[idx] = {
      ...prev,
      title,
      note: (input.note ?? prev.note).trim(),
      priority: normalizePriority(input.priority ?? prev.priority),
      done,
      updatedAt: now,
      completedAt: done ? (prev.completedAt ?? now) : null,
      images: persistTodoImages(input.images, prev.images)
    }
  } else {
    const done = input.done ?? false
    tasks.unshift({
      id: crypto.randomUUID(),
      title,
      note: (input.note ?? '').trim(),
      priority: normalizePriority(input.priority),
      done,
      createdAt: now,
      updatedAt: now,
      completedAt: done ? now : null,
      images: persistTodoImages(input.images, [])
    })
  }

  return saveWorkTasks(tasks)
}

export function toggleWorkTaskDone(id: string): WorkTask[] {
  const tasks = loadWorkTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx < 0) return tasks

  const now = Date.now()
  const done = !tasks[idx].done
  tasks[idx] = {
    ...tasks[idx],
    done,
    updatedAt: now,
    completedAt: done ? now : null
  }
  return saveWorkTasks(tasks)
}

export function deleteWorkTask(id: string): WorkTask[] {
  const tasks = loadWorkTasks()
  const target = tasks.find((task) => task.id === id)
  deleteTodoImageFiles(target?.images)
  return saveWorkTasks(tasks.filter((task) => task.id !== id))
}

export function clearDoneWorkTasks(): WorkTask[] {
  const tasks = loadWorkTasks()
  const remaining: WorkTask[] = []
  for (const task of tasks) {
    if (task.done) {
      deleteTodoImageFiles(task.images)
    } else {
      remaining.push(task)
    }
  }
  return saveWorkTasks(remaining)
}

export function clearAllWorkTaskRecords(): WorkTask[] {
  const tasks = loadWorkTasks()
  for (const task of tasks) {
    deleteTodoImageFiles(task.images)
  }
  return saveWorkTasks([])
}
