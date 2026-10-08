import type { NoteInput, QuickNote } from '../../shared/types'
import { IPC } from '../../shared/ipc-channels'
import { sendToRenderer } from '../window'
import { deleteNote as deleteNoteFromDisk, loadNotes, saveNotes, upsertNote } from '../storage/notes'

let notes: QuickNote[] = []

function broadcast(): void {
  sendToRenderer(IPC.NOTE_CHANGED, [...notes])
}

export function initNotes(): void {
  notes = loadNotes()
}

export function getNotes(): QuickNote[] {
  return [...notes]
}

export function saveNote(input: NoteInput): QuickNote[] {
  notes = upsertNote(input)
  broadcast()
  return [...notes]
}

export function deleteNote(id: string): QuickNote[] {
  notes = deleteNoteFromDisk(id)
  broadcast()
  return [...notes]
}

export function createEmptyNote(): QuickNote[] {
  return saveNote({
    title: '',
    content: '',
    pinned: false,
    color: 'default'
  })
}

export function clearAllNotes(): void {
  notes = saveNotes([])
  broadcast()
}
