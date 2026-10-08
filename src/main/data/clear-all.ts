import { handleAction, resetSettings, getState } from '../reminder/timer'
import { clearAllClipboard, reloadClipboardFromSettings } from '../clipboard/watcher'
import { clearAllNotes } from '../notes/index'
import { clearAllWorkTasks } from '../work-tasks/index'
import { clearAllTodos } from '../reminder/scheduled'
import { clearAllTodoImages } from '../storage/todo-images'
import { saveHistory } from '../storage/history'
import { onEyeSettingsChanged } from '../reminder/eye-break'
import { resetShortcutBindings } from '../shortcuts/registry'

export function clearAllUserData() {
  saveHistory([])
  clearAllNotes()
  clearAllWorkTasks()
  clearAllTodos()
  clearAllTodoImages()
  clearAllClipboard()
  handleAction('reset')
  const state = resetSettings()
  resetShortcutBindings()
  onEyeSettingsChanged(state.settings.enableEyeBreak, state.settings.eyeInterval)
  reloadClipboardFromSettings()
  return getState()
}
