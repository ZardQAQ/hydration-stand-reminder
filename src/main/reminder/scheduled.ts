import type { Reminder, TodoInput, TodoReminder } from '../../shared/types'
import { TICK_INTERVAL_ACTIVE_MS } from '../../shared/constants'
import { applyTodoTrigger, isTodoDue } from '../../shared/todo-logic'
import { IPC } from '../../shared/ipc-channels'
import { sendToRenderer } from '../window'
import { presentReminderMessage } from './timer'
import {
  deleteTodo as deleteTodoFromDisk,
  loadTodos,
  replaceTodos,
  upsertTodo
} from '../storage/todos'
import { deleteTodoImageFiles } from '../storage/todo-images'

let todos: TodoReminder[] = []
let timer: ReturnType<typeof setInterval> | null = null

function broadcastTodos(): void {
  sendToRenderer(IPC.TODO_CHANGED, [...todos])
}

function buildTodoReminder(todo: TodoReminder, at: number): Reminder {
  return {
    type: 'todo',
    title: todo.title,
    body: todo.body,
    at,
    images: todo.images ?? []
  }
}

function checkDueTodos(now = Date.now()): void {
  let changed = false

  for (let i = 0; i < todos.length; i++) {
    const todo = todos[i]
    if (!isTodoDue(todo, now)) continue

    presentReminderMessage(buildTodoReminder(todo, now))
    todos[i] = applyTodoTrigger(todo, now)
    changed = true
    break
  }

  if (changed) {
    replaceTodos(todos)
    broadcastTodos()
  }
}

export function initScheduledReminders(): void {
  todos = loadTodos()
}

export function startScheduledReminders(): void {
  if (timer) clearInterval(timer)
  timer = setInterval(() => checkDueTodos(), TICK_INTERVAL_ACTIVE_MS)
}

export function getTodos(): TodoReminder[] {
  return [...todos]
}

export function saveTodo(input: TodoInput): TodoReminder[] {
  todos = upsertTodo(input)
  broadcastTodos()
  return [...todos]
}

export function deleteTodo(id: string): TodoReminder[] {
  todos = deleteTodoFromDisk(id)
  broadcastTodos()
  return [...todos]
}

export function clearAllTodos(): void {
  const images = todos.flatMap((todo) => todo.images ?? [])
  todos = replaceTodos([])
  deleteTodoImageFiles(images)
  broadcastTodos()
}
