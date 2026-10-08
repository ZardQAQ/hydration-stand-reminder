import { useCallback, useEffect, useState } from 'react'
import type { NoteColor, NoteInput, QuickNote } from '@shared/types'
import { api } from '../../api/client'
import { useNavigation } from '../../contexts/NavigationContext'
import { useToast } from '../../contexts/ToastContext'

export default function NotesPage() {
  const { showToast } = useToast()
  const { pendingNoteAction, clearPendingNoteAction } = useNavigation()
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState<NoteColor>('default')
  const [pinned, setPinned] = useState(false)

  const refresh = useCallback(async () => {
    const next = await api.getNotes()
    setNotes(next)
    if (next.length === 0) {
      setActiveId(null)
    } else if (!activeId || !next.some((n) => n.id === activeId)) {
      setActiveId(next[0].id)
      loadNote(next[0])
    }
  }, [activeId])

  const loadNote = (note: QuickNote) => {
    setTitle(note.title)
    setContent(note.content)
    setColor(note.color)
    setPinned(note.pinned)
  }

  useEffect(() => {
    void refresh()
    api.onNotesChanged((next) => {
      setNotes(next)
      if (activeId && !next.find((n) => n.id === activeId)) {
        const id = next[0]?.id ?? null
        setActiveId(id)
        if (next[0]) loadNote(next[0])
      }
      if (next.length === 0) setActiveId(null)
    })
  }, [])

  useEffect(() => {
    if (pendingNoteAction === 'new') {
      void createNewNote()
      clearPendingNoteAction()
    }
  }, [pendingNoteAction])

  const createNewNote = async () => {
    const next = await api.saveNote({ title: '', content: '', pinned: false, color: 'default' })
    setNotes(next)
    const id = next[0]?.id ?? null
    setActiveId(id)
    if (next[0]) loadNote(next[0])
  }

  const selectNote = (id: string) => {
    const note = notes.find((n) => n.id === id)
    if (!note) return
    setActiveId(id)
    loadNote(note)
  }

  const saveActive = async () => {
    if (!activeId) return
    const input: NoteInput = { id: activeId, title, content, color, pinned }
    const next = await api.saveNote(input)
    setNotes(next)
  }

  const q = search.trim().toLowerCase()
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt - a.updatedAt
  })
  const filtered = sorted.filter(
    (n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  )
  const hasNote = activeId !== null && notes.some((n) => n.id === activeId)

  return (
    <section id="tab-notes" className="tab-page active">
      <div className="notes-layout">
        <aside className="notes-sidebar">
          <div className="notes-sidebar-head">
            <h3 className="settings-title">便签</h3>
            <button className="btn-save" type="button" onClick={() => void createNewNote()}>
              新建
            </button>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="搜索便签…"
            className="tool-search"
          />
          <div className="notes-list">
            {filtered.length === 0 && q ? (
              <p className="tool-empty">没有匹配的便签。</p>
            ) : (
              filtered.map((n) => (
                <button
                  key={n.id}
                  className={`notes-list-item note-color-${n.color}${n.id === activeId ? ' active' : ''}`}
                  type="button"
                  onClick={() => selectNote(n.id)}
                >
                  <span className="notes-list-title">{n.title || '无标题'}</span>
                  <span className="notes-list-preview">{n.content.slice(0, 40) || '空内容'}</span>
                </button>
              ))
            )}
          </div>
        </aside>
        <div className="notes-panel">
          {!hasNote ? (
            <div className="notes-empty">
              <div className="notes-empty-card">
                <div className="notes-empty-icon" aria-hidden="true">
                  <svg viewBox="0 0 48 48" width="48" height="48">
                    <rect x="10" y="6" width="28" height="36" rx="4" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
                    <path d="M16 16h16M16 24h16M16 32h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                  </svg>
                </div>
                <h4>还没有便签</h4>
                <p>点击新建，记录灵感、链接或临时待办</p>
                <button className="btn-save" type="button" onClick={() => void createNewNote()}>
                  新建便签
                </button>
                <span className="notes-empty-shortcut">快捷键 Ctrl+Shift+N</span>
              </div>
            </div>
          ) : (
            <div className="notes-editor">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => void saveActive()}
                type="text"
                placeholder="标题"
                className="notes-title-input"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={() => void saveActive()}
                rows={12}
                placeholder="写点什么…"
                className="notes-content-input"
              />
              <div className="notes-editor-footer">
                <select
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value as NoteColor)
                    void saveActive()
                  }}
                >
                  <option value="default">默认</option>
                  <option value="yellow">黄色</option>
                  <option value="blue">蓝色</option>
                  <option value="green">绿色</option>
                </select>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => {
                      setPinned(e.target.checked)
                      void saveActive()
                    }}
                  />
                  <span className="toggle-slider" />
                  <span className="toggle-label">置顶</span>
                </label>
                <div className="notes-editor-actions">
                  <button
                    className="tool-action-btn tool-action-btn--copy"
                    type="button"
                    title="复制内容"
                    onClick={async () => {
                      await navigator.clipboard.writeText(content)
                      showToast('已复制', '便签内容已复制到剪贴板。')
                    }}
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                      <rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    复制
                  </button>
                  <button
                    className="tool-action-btn tool-action-btn--danger"
                    type="button"
                    title="删除便签"
                    onClick={async () => {
                      if (!activeId) return
                      const next = await api.deleteNote(activeId)
                      setNotes(next)
                      const id = next[0]?.id ?? null
                      setActiveId(id)
                      if (next[0]) loadNote(next[0])
                      else {
                        setTitle('')
                        setContent('')
                      }
                      showToast('已删除', '便签已移除。')
                    }}
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                      <path d="M3 4.5h10M6 4.5V3.5h4v1M5 4.5v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    删除
                  </button>
                  <button className="btn-save" type="button" onClick={() => void saveActive()}>
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
