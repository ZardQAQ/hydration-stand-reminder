import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { WorkTask, WorkTaskFilter, WorkTaskPriority } from '@shared/types'
import { todoImageUrl } from '@shared/todo-logic'
import {
  countPending,
  filterWorkTasks,
  formatTaskTime,
  priorityLabel,
  sortWorkTasks
} from '@shared/work-task-logic'
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
} from '../todo/image-helpers'

function toLightboxImages(images: DraftImage[] | WorkTask['images']): LightboxImage[] {
  return images.map((image) => ({
    id: 'id' in image ? image.id : undefined,
    name: image.name,
    src: 'previewUrl' in image ? image.previewUrl : todoImageUrl(image.id)
  }))
}

export default function WorkTasksPage() {
  const { showToast } = useToast()
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [priority, setPriority] = useState<WorkTaskPriority>('normal')
  const [filter, setFilter] = useState<WorkTaskFilter>('pending')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [images, setImages] = useState<DraftImage[]>([])
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null)
  const imagesRef = useRef(images)
  imagesRef.current = images

  const refresh = useCallback(async () => {
    setTasks(await api.getWorkTasks())
  }, [])

  useEffect(() => {
    void refresh()
    api.onWorkTasksChanged(setTasks)
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
    setNote('')
    setPriority('normal')
    setImages((current) => {
      revokeDraftImages(current)
      imagesRef.current = []
      return []
    })
  }

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      showToast('请填写事项', '先写一下要记住的工作内容。')
      return
    }

    const wasEditing = !!editingId
    await api.saveWorkTask({
      id: editingId ?? undefined,
      title: trimmed,
      note,
      priority,
      images: toTodoImageInputs(images)
    })
    resetForm()
    showToast(wasEditing ? '已更新' : '已记下', wasEditing ? '工作事项已保存。' : '又多记一件，不会忘了。')
  }

  const handleQuickKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  const startEdit = (task: WorkTask) => {
    setImages((current) => {
      revokeDraftImages(current)
      const next = imagesFromTodo(task.images)
      imagesRef.current = next
      return next
    })
    setEditingId(task.id)
    setTitle(task.title)
    setNote(task.note)
    setPriority(task.priority)
  }

  const handleToggle = async (id: string) => {
    await api.toggleWorkTask(id)
  }

  const handleDelete = async (id: string) => {
    await api.deleteWorkTask(id)
    if (editingId === id) resetForm()
    showToast('已删除', '工作事项已移除。')
  }

  const handleClearDone = async () => {
    const doneCount = tasks.filter((t) => t.done).length
    if (doneCount === 0) {
      showToast('没有已完成项', '当前没有可清理的已完成事项。')
      return
    }
    await api.clearDoneWorkTasks()
    showToast('已清理', `已清除 ${doneCount} 条完成事项。`)
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
    link.download = image.name || '工作图片'
    link.click()
    showToast('已保存', '图片已开始下载。')
  }

  const pendingCount = countPending(tasks)
  const visible = useMemo(
    () => sortWorkTasks(filterWorkTasks(tasks, filter)),
    [tasks, filter]
  )

  return (
    <section id="tab-work-tasks" className="tab-page active">
      <div className="work-tasks-area">
        <form className="work-tasks-capture" onSubmit={(e) => void handleSubmit(e)}>
          <div className="work-tasks-capture-row">
            <input
              className="work-tasks-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleQuickKey}
              type="text"
              placeholder="工作一件接一件？先记下来…"
              autoFocus
            />
            <select
              className="work-tasks-priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as WorkTaskPriority)}
              aria-label="优先级"
            >
              <option value="high">高优先</option>
              <option value="normal">普通</option>
              <option value="low">低优先</option>
            </select>
            <button className="btn-save" type="submit">
              {editingId ? '保存' : '记下'}
            </button>
            {editingId ? (
              <button className="btn-secondary" type="button" onClick={resetForm}>
                取消
              </button>
            ) : null}
          </div>
          <textarea
            className="work-tasks-note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="补充说明（可选），Ctrl+V 可粘贴图片"
          />
          {images.length > 0 ? (
            <div className="work-task-draft-images">
              {images.map((image, index) => (
                <div key={image.key} className="todo-image-thumb-wrap">
                  <button
                    className="todo-image-thumb"
                    type="button"
                    title={`查看 ${image.name}`}
                    onClick={() => setLightbox({ images: toLightboxImages(images), index })}
                  >
                    <img src={image.previewUrl} alt={image.name} />
                  </button>
                  <button
                    className="todo-image-remove"
                    type="button"
                    aria-label={`移除 ${image.name}`}
                    onClick={() => handleRemoveImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </form>

        <div className="work-tasks-toolbar">
          <div className="work-tasks-filters">
            {(
              [
                { id: 'pending', label: '进行中' },
                { id: 'done', label: '已完成' },
                { id: 'all', label: '全部' }
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`work-tasks-filter${filter === item.id ? ' active' : ''}`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="work-tasks-toolbar-meta">
            <span className="work-tasks-count">{pendingCount} 件待办</span>
            <button className="btn-secondary work-tasks-clear-btn" type="button" onClick={() => void handleClearDone()}>
              清理已完成
            </button>
          </div>
        </div>

        <div className="work-tasks-list">
          {visible.length === 0 ? (
            <p className="work-tasks-empty">
              {filter === 'done'
                ? '还没有完成的事项。'
                : filter === 'pending'
                  ? '目前没有进行中的工作，来一件就记一件。'
                  : '暂无工作事项，上方输入后回车即可记下。'}
            </p>
          ) : (
            visible.map((task) => (
              <article
                key={task.id}
                className={`work-task-item${task.done ? ' work-task-item-done' : ''}`}
              >
                <button
                  type="button"
                  className={`work-task-check${task.done ? ' checked' : ''}`}
                  aria-label={task.done ? '标记为未完成' : '标记为已完成'}
                  onClick={() => void handleToggle(task.id)}
                >
                  {task.done ? '✓' : ''}
                </button>
                <div className="work-task-main">
                  <div className="work-task-head">
                    <h4 className="work-task-title">{task.title}</h4>
                    <span className={`work-task-priority priority-${task.priority}`}>
                      {priorityLabel(task.priority)}
                    </span>
                  </div>
                  {task.note ? <p className="work-task-note">{task.note}</p> : null}
                  {(task.images ?? []).length > 0 ? (
                    <div className="todo-item-images">
                      {task.images.map((image, index) => (
                        <button
                          key={image.id}
                          className="todo-image-thumb"
                          type="button"
                          title={`查看 ${image.name}`}
                          onClick={() =>
                            setLightbox({ images: toLightboxImages(task.images), index })
                          }
                        >
                          <img src={todoImageUrl(image.id)} alt={image.name} />
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="work-task-meta">
                    <span>{formatTaskTime(task.createdAt)} 记下</span>
                    {task.done && task.completedAt ? (
                      <span>{formatTaskTime(task.completedAt)} 完成</span>
                    ) : null}
                  </div>
                </div>
                <div className="work-task-actions">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => startEdit(task)}
                    disabled={task.done}
                  >
                    编辑
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => void handleDelete(task.id)}
                  >
                    删除
                  </button>
                </div>
              </article>
            ))
          )}
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
