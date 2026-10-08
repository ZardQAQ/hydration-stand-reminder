import type { WorkTask, WorkTaskInput } from '../../shared/types'
import { IPC } from '../../shared/ipc-channels'
import { sendToRenderer } from '../window'
import {
  clearDoneWorkTasks as clearDoneFromDisk,
  clearAllWorkTaskRecords,
  deleteWorkTask as deleteFromDisk,
  loadWorkTasks,
  toggleWorkTaskDone,
  upsertWorkTask
} from '../storage/work-tasks'

let tasks: WorkTask[] = []

function broadcast(): void {
  sendToRenderer(IPC.WORK_TASK_CHANGED, [...tasks])
}

export function initWorkTasks(): void {
  tasks = loadWorkTasks()
}

export function getWorkTasks(): WorkTask[] {
  return [...tasks]
}

export function saveWorkTask(input: WorkTaskInput): WorkTask[] {
  tasks = upsertWorkTask(input)
  broadcast()
  return [...tasks]
}

export function toggleWorkTask(id: string): WorkTask[] {
  tasks = toggleWorkTaskDone(id)
  broadcast()
  return [...tasks]
}

export function deleteWorkTask(id: string): WorkTask[] {
  tasks = deleteFromDisk(id)
  broadcast()
  return [...tasks]
}

export function clearDoneWorkTasks(): WorkTask[] {
  tasks = clearDoneFromDisk()
  broadcast()
  return [...tasks]
}

export function clearAllWorkTasks(): void {
  tasks = clearAllWorkTaskRecords()
  broadcast()
}
