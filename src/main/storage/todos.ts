import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { TodoInput, TodoReminder } from '../../shared/types'
import { deleteTodoImageFiles, persistTodoImages } from './todo-images'

function todosPath(): string {
  return path.join(app.getPath('userData'), 'scheduled-reminders.json')
}

function normalizeTodo(todo: TodoReminder): TodoReminder {
  return {
    ...todo,
    images: Array.isArray(todo.images) ? todo.images : []
  }
}

export function loadTodos(): TodoReminder[] {
  try {
    const raw = JSON.parse(fs.readFileSync(todosPath(), 'utf8')) as TodoReminder[]
    return raw.map(normalizeTodo)
  } catch {
    return []
  }
}

export function saveTodos(todos: TodoReminder[]): TodoReminder[] {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(todosPath(), JSON.stringify(todos, null, 2))
  return todos
}

export function upsertTodo(input: TodoInput): TodoReminder[] {
  const todos = loadTodos()
  const now = Date.now()
  const existingIndex = input.id ? todos.findIndex((t) => t.id === input.id) : -1
  const previousImages = existingIndex >= 0 ? todos[existingIndex].images : []
  const images = persistTodoImages(input.images, previousImages)

  if (existingIndex >= 0) {
    todos[existingIndex] = {
      ...todos[existingIndex],
      title: input.title.trim(),
      body: input.body.trim(),
      repeat: input.repeat,
      at: input.at,
      enabled: input.enabled,
      images
    }
  } else {
    todos.push({
      id: crypto.randomUUID(),
      title: input.title.trim(),
      body: input.body.trim(),
      repeat: input.repeat,
      at: input.at,
      enabled: input.enabled,
      createdAt: now,
      lastTriggeredAt: null,
      images
    })
  }

  return saveTodos(todos)
}

export function deleteTodo(id: string): TodoReminder[] {
  const todos = loadTodos()
  const target = todos.find((todo) => todo.id === id)
  deleteTodoImageFiles(target?.images)
  return saveTodos(todos.filter((todo) => todo.id !== id))
}

export function replaceTodos(todos: TodoReminder[]): TodoReminder[] {
  return saveTodos(todos)
}
