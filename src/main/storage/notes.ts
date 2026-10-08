import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { NoteInput, QuickNote } from '../../shared/types'

function notesPath(): string {
  return path.join(app.getPath('userData'), 'notes.json')
}

export function loadNotes(): QuickNote[] {
  try {
    return JSON.parse(fs.readFileSync(notesPath(), 'utf8')) as QuickNote[]
  } catch {
    return []
  }
}

export function saveNotes(notes: QuickNote[]): QuickNote[] {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  fs.writeFileSync(notesPath(), JSON.stringify(notes, null, 2))
  return notes
}

export function upsertNote(input: NoteInput): QuickNote[] {
  const notes = loadNotes()
  const now = Date.now()
  const idx = input.id ? notes.findIndex((n) => n.id === input.id) : -1

  if (idx >= 0) {
    notes[idx] = {
      ...notes[idx],
      title: input.title.trim() || '无标题',
      content: input.content,
      pinned: input.pinned,
      color: input.color,
      updatedAt: now
    }
  } else {
    notes.unshift({
      id: crypto.randomUUID(),
      title: input.title.trim() || '无标题',
      content: input.content,
      pinned: input.pinned,
      color: input.color,
      updatedAt: now
    })
  }

  return saveNotes(notes)
}

export function deleteNote(id: string): QuickNote[] {
  return saveNotes(loadNotes().filter((n) => n.id !== id))
}
