import { useCallback, useEffect, useState } from 'react'
import type { ClipboardItem } from '@shared/types'
import { api } from '../../api/client'
import { useToast } from '../../contexts/ToastContext'

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const copyIcon = (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)
const pinIcon = (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M8 2v9M5.5 11h5l-1 3h-3l-1-3Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
)
const deleteIcon = (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M3 4.5h10M6 4.5V3.5h4v1M5 4.5v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

export default function ClipboardPage() {
  const { showToast } = useToast()
  const [items, setItems] = useState<ClipboardItem[]>([])
  const [search, setSearch] = useState('')

  const refresh = useCallback(async () => {
    setItems(await api.getClipboard())
  }, [])

  useEffect(() => {
    void refresh()
    api.onClipboardChanged(setItems)
  }, [refresh])

  const q = search.trim().toLowerCase()
  const filtered = items.filter((i) => !q || i.preview.toLowerCase().includes(q))

  return (
    <section id="tab-clipboard" className="tab-page active">
      <div className="tool-page settings-area">
        <div className="tool-page-head">
          <h3 className="settings-title">剪贴板历史</h3>
          <div className="tool-page-actions">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="搜索…"
              className="tool-search"
            />
            <button
              className="tool-action-btn tool-action-btn--danger"
              type="button"
              title="清空全部历史"
              onClick={async () => {
                setItems(await api.clearClipboard())
                showToast('已清空', '剪贴板历史已清除。')
              }}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M2 4.5h12M5.5 4.5V3.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1M6 4.5l.5 8.5h3L10 4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              清空
            </button>
          </div>
        </div>
        <div className="clipboard-list">
          {filtered.length === 0 ? (
            <p className="tool-empty">暂无剪贴板记录，复制内容后会自动出现在这里。</p>
          ) : (
            filtered.map((item) => (
              <article key={item.id} className={`clipboard-item${item.pinned ? ' is-pinned' : ''}`}>
                <div className="clipboard-item-main">
                  <p className="clipboard-preview">{item.preview}</p>
                  <span className="clipboard-meta">
                    {item.kind === 'image' ? '图片' : '文本'} · {formatTime(item.createdAt)}
                    {item.pinned ? ' · 已置顶' : ''}
                  </span>
                </div>
                <div className="clipboard-item-actions">
                  <button
                    className="tool-action-btn tool-action-btn--copy"
                    type="button"
                    title="复制到剪贴板"
                    onClick={async () => {
                      await api.copyClipboardItem(item.id)
                      showToast('已复制', '内容已写回剪贴板。')
                    }}
                  >
                    {copyIcon}复制
                  </button>
                  <button
                    className="tool-action-btn tool-action-btn--pin"
                    type="button"
                    title={item.pinned ? '取消置顶' : '置顶'}
                    onClick={async () => {
                      setItems(await api.pinClipboardItem(item.id))
                    }}
                  >
                    {pinIcon}
                    {item.pinned ? '取消' : '置顶'}
                  </button>
                  <button
                    className="tool-action-btn tool-action-btn--danger"
                    type="button"
                    title="删除"
                    onClick={async () => {
                      setItems(await api.deleteClipboardItem(item.id))
                    }}
                  >
                    {deleteIcon}删除
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
