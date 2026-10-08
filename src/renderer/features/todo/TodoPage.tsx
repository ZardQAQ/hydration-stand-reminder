import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import type { TodoInput, TodoReminder, TodoRepeat } from '@shared/types'
import { formatTodoTime, todoImageUrl, todoStatusLabel } from '@shared/todo-logic'
import { api } from '../../api/client'
import { ImageLightbox, type LightboxImage } from '../../components/common/ImageLightbox'
import { useToast } from '../../contexts/ToastContext'
import {
  filesFromPasteEvent,
  filesToDraftImages,
  imagesFromTodo,
  revokeDraftImages,
  toTodoImageInputs,
  type DraftImage
} from './image-helpers'
import { TodoImageField } from './TodoImageField'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toDatetimeLocalValue(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toTimeValue(timestamp: number): string {
  const date = new Date(timestamp)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultDatetime(): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 5, 0, 0)
  return toDatetimeLocalValue(now.getTime())
}

function toLightboxImages(images: DraftImage[] | TodoReminder['images']): LightboxImage[] {
  return images.map((image) => ({
    id: 'id' in image ? image.id : undefined,
    name: image.name,
    src: 'previewUrl' in image ? image.previewUrl : todoImageUrl(image.id)
  }))
}

export default function TodoPage() {
  const { showToast } = useToast()
  const [todos, setTodos] = useState<TodoReminder[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [repeat, setRepeat] = useState<TodoRepeat>('once')
  const [datetime, setDatetime] = useState(defaultDatetime)
  const [time, setTime] = useState(toTimeValue(Date.now()))
  const [enabled, setEnabled] = useState(true)
  const [images, setImages] = useState<DraftImage[]>([])
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null)
  const imagesRef = useRef(images)
  imagesRef.current = images

  const refresh = useCallback(async () => {
    setTodos(await api.getTodos())
  }, [])

  useEffect(() => {
    void refresh()
    api.onTodosChanged(setTodos)
  }, [refresh])

  useEffect(() => {
    return () => revokeDraftImages(imagesRef.current)
  }, [])

  const handleAddImages = useCallback(
    async (files: FileList | File[]) => {
      const { images: added, error } = await filesToDraftImages(files, imagesRef.current.length)
      if (added.length > 0) {
        const next = [...imagesRef.current, ...added]
        imagesRef.current = next
        setImages(next)
      }
      if (error) {
        showToast('无法添加图片', error)
      }
    },
    [showToast]
  )

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('.reminder-dialog, .image-lightbox')) {
        return
      }
      const files = filesFromPasteEvent(event)
      if (files.length === 0) return
      event.preventDefault()
      void handleAddImages(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleAddImages])

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setBody('')
    setRepeat('once')
    setDatetime(defaultDatetime())
    setTime(toTimeValue(Date.now()))
    setEnabled(true)
    setImages((current) => {
      revokeDraftImages(current)
      imagesRef.current = []
      return []
    })
  }

  const readForm = (): TodoInput | null => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      showToast('请填写标题', '待办提醒需要有一个标题。')
      return null
    }

    let at: number
    if (repeat === 'once') {
      if (!datetime) {
        showToast('请选择时间', '一次性提醒需要指定日期和时间。')
        return null
      }
      at = new Date(datetime).getTime()
      if (at <= Date.now()) {
        showToast('时间无效', '一次性提醒的时间必须晚于当前时间。')
        return null
      }
    } else {
      if (!time) {
        showToast('请选择时间', '每日提醒需要指定时间。')
        return null
      }
      const [hours, minutes] = time.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      at = date.getTime()
    }

    return {
      id: editingId ?? undefined,
      title: trimmedTitle,
      body: body.trim() || trimmedTitle,
      repeat,
      at,
      enabled,
      images: toTodoImageInputs(images)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const input = readForm()
    if (!input) return
    const wasEditing = !!editingId
    await api.saveTodo(input)
    resetForm()
    showToast(wasEditing ? '已保存' : '已添加', '待办提醒已更新。')
  }

  const startEdit = (todo: TodoReminder) => {
    setImages((current) => {
      revokeDraftImages(current)
      const next = imagesFromTodo(todo.images)
      imagesRef.current = next
      return next
    })
    setEditingId(todo.id)
    setTitle(todo.title)
    setBody(todo.body)
    setRepeat(todo.repeat)
    setEnabled(todo.enabled)
    setDatetime(toDatetimeLocalValue(todo.at))
    setTime(toTimeValue(todo.at))
  }

  const handleDelete = async (id: string) => {
    await api.deleteTodo(id)
    if (editingId === id) resetForm()
    showToast('已删除', '待办提醒已移除。')
  }

  const handleRemoveImage = (index: number) => {
    setImages((current) => {
      const next = [...current]
      const [removed] = next.splice(index, 1)
      if (removed) revokeDraftImages([removed])
      imagesRef.current = next
      return next
    })
  }

  const handleDownload = async (image: LightboxImage) => {
    if (image.id) {
      const saved = await api.downloadTodoImage(image.id, image.name)
      if (saved) showToast('已保存', '图片已下载到本地。')
      return
    }

    const link = document.createElement('a')
    link.href = image.src
    link.download = image.name || '待办图片'
    link.click()
    showToast('已保存', '图片已开始下载。')
  }

  const sorted = [...todos].sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
    return a.at - b.at
  })

  const isDaily = repeat === 'daily'

  return (
    <section id="tab-todo" className="tab-page active">
      <div className="todo-area settings-area">
        <form className="todo-form" onSubmit={(e) => void handleSubmit(e)}>
          <h3 className="settings-title">{editingId ? '编辑待办提醒' : '新建待办提醒'}</h3>
          <div className="settings-grid-3col">
            <div className="setting-item">
              <label htmlFor="todoTitle">事项标题</label>
              <input
                id="todoTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="例如：开会"
                required
              />
            </div>
            <div className="setting-item">
              <label htmlFor="todoRepeat">重复方式</label>
              <select
                id="todoRepeat"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as TodoRepeat)}
              >
                <option value="once">一次性</option>
                <option value="daily">每天</option>
              </select>
            </div>
            <div className="setting-item">
              <label htmlFor={isDaily ? 'todoTime' : 'todoDatetime'}>
                {isDaily ? '每天提醒时间' : '提醒时间'}
              </label>
              {isDaily ? (
                <input
                  id="todoTime"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  type="time"
                />
              ) : (
                <input
                  id="todoDatetime"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  type="datetime-local"
                />
              )}
            </div>
          </div>
          <div className="setting-item todo-body-field">
            <label htmlFor="todoBody">提醒内容</label>
            <textarea
              id="todoBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="要做什么事情…"
            />
          </div>
          <TodoImageField
            images={images}
            onAdd={(files) => void handleAddImages(files)}
            onRemove={handleRemoveImage}
            onOpen={(index) => setLightbox({ images: toLightboxImages(images), index })}
          />
          <div className="setting-toggles">
            <label className="toggle">
              <input
                id="todoEnabled"
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span className="toggle-slider" />
              <span className="toggle-label">启用提醒</span>
            </label>
          </div>
          <div className="settings-actions">
            {editingId ? (
              <button className="btn-secondary" type="button" onClick={resetForm}>
                取消编辑
              </button>
            ) : null}
            <button className="btn-save" type="submit">
              {editingId ? '保存修改' : '添加提醒'}
            </button>
          </div>
        </form>
        <div className="todo-list-section">
          <h3 className="settings-title">我的待办</h3>
          <div className="todo-list">
            {sorted.length === 0 ? (
              <p className="todo-empty">暂无待办提醒，在上方表单中添加一条吧。</p>
            ) : (
              sorted.map((todo) => (
                <article
                  key={todo.id}
                  className={`todo-item${todo.enabled ? '' : ' todo-item-disabled'}`}
                >
                  <div className="todo-item-main">
                    <div className="todo-item-head">
                      <h4 className="todo-item-title">{todo.title}</h4>
                      <span className={`todo-tag ${todo.enabled ? 'todo-tag-active' : 'todo-tag-done'}`}>
                        {todoStatusLabel(todo)}
                      </span>
                    </div>
                    <p className="todo-item-body">{todo.body}</p>
                    {(todo.images ?? []).length > 0 ? (
                      <div className="todo-item-images">
                        {todo.images.map((image, index) => (
                          <button
                            key={image.id}
                            className="todo-image-thumb"
                            type="button"
                            title={`查看 ${image.name}`}
                            onClick={() =>
                              setLightbox({ images: toLightboxImages(todo.images), index })
                            }
                          >
                            <img src={todoImageUrl(image.id)} alt={image.name} />
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <div className="todo-item-meta">
                      <span className="todo-meta-chip">{formatTodoTime(todo)}</span>
                      <span className="todo-meta-chip">
                        {todo.repeat === 'daily' ? '每天' : '一次性'}
                      </span>
                      {(todo.images ?? []).length > 0 ? (
                        <span className="todo-meta-chip">{todo.images.length} 张图片</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="todo-item-actions">
                    <button
                      className="btn-secondary todo-edit-btn"
                      type="button"
                      onClick={() => startEdit(todo)}
                    >
                      编辑
                    </button>
                    <button
                      className="btn-secondary todo-delete-btn"
                      type="button"
                      onClick={() => void handleDelete(todo.id)}
                    >
                      删除
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
      {lightbox ? (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onDownload={(image) => void handleDownload(image)}
        />
      ) : null}
    </section>
  )
}
