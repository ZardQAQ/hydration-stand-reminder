import { useCallback, useEffect, useState } from 'react'
import type { ShortcutActionId, ShortcutBinding } from '@shared/types'
import { api } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'

function formatAccelerator(acc: string): string {
  return acc.replace(/CommandOrControl/g, 'Ctrl')
}

function acceleratorFromEvent(e: KeyboardEvent): string | null {
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    const parts: string[] = []
    if (e.ctrlKey || e.metaKey) parts.push('CommandOrControl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
    return parts.join('+')
  }
  return null
}

export default function ShortcutsPage() {
  const { showToast } = useToast()
  const [bindings, setBindings] = useState<ShortcutBinding[]>([])
  const [recordingId, setRecordingId] = useState<ShortcutActionId | null>(null)

  const refresh = useCallback(async () => {
    setBindings(await api.getShortcuts())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (!recordingId) return
      e.preventDefault()
      const acc = acceleratorFromEvent(e)
      if (!acc) return
      try {
        await api.updateShortcut(recordingId, acc)
        showToast('已保存', `快捷键设为 ${formatAccelerator(acc)}`)
      } catch {
        showToast('注册失败', '该快捷键可能已被占用。')
      }
      setRecordingId(null)
      void refresh()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [recordingId, refresh, showToast])

  return (
    <section id="tab-shortcuts" className="tab-page active">
      <div className="tool-page settings-area">
        <div className="tool-page-head">
          <h3 className="settings-title">全局快捷键</h3>
          <button
            className="btn-secondary"
            type="button"
            onClick={async () => {
              await api.resetShortcuts()
              showToast('已恢复', '快捷键已恢复默认。')
              void refresh()
            }}
          >
            恢复默认
          </button>
        </div>
        <table className="shortcuts-table">
          <thead>
            <tr>
              <th>功能</th>
              <th>快捷键</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {bindings.map((b) => (
              <tr key={b.id}>
                <td>{b.label}</td>
                <td>
                  <kbd className="shortcut-kbd">{formatAccelerator(b.accelerator)}</kbd>
                </td>
                <td>
                  <button
                    className="btn-secondary shortcut-record-btn"
                    type="button"
                    onClick={() => {
                      setRecordingId(b.id)
                      showToast('录制快捷键', '请按下你想要的组合键。')
                    }}
                  >
                    {recordingId === b.id ? '按下新快捷键…' : '录制'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
