import { useEffect, useRef, useState } from 'react'
import type { Reminder } from '@shared/types'
import { isActionableReminder } from '@shared/timer-logic'
import { todoImageUrl } from '@shared/todo-logic'
import { api } from '../../api/client'
import { useAppStateContext } from '../../contexts/AppStateContext'
import { useToast } from '../../contexts/ToastContext'
import { ImageLightbox, type LightboxImage } from './ImageLightbox'

interface ReminderDialogProps {
  reminder: Reminder | null
  onClose: () => void
}

export function ReminderDialog({ reminder, onClose }: ReminderDialogProps) {
  const { setState } = useAppStateContext()
  const { showToast } = useToast()
  const countdownRef = useRef<HTMLParagraphElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    setLightboxIndex(null)
  }, [reminder])

  useEffect(() => {
    if (!reminder || reminder.type !== 'eye' || !reminder.durationSec) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    let left = reminder.durationSec
    if (countdownRef.current) {
      countdownRef.current.hidden = false
      countdownRef.current.textContent = `剩余 ${left} 秒`
    }

    timerRef.current = setInterval(() => {
      left -= 1
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = null
        void api.dismissReminder()
        onClose()
        return
      }
      if (countdownRef.current) {
        countdownRef.current.textContent = `剩余 ${left} 秒`
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [reminder, onClose])

  if (!reminder) return null

  const actionable = isActionableReminder(reminder.type)
  const images: LightboxImage[] = (reminder.images ?? []).map((image) => ({
    id: image.id,
    name: image.name,
    src: todoImageUrl(image.id)
  }))

  const handleClose = async () => {
    await api.dismissReminder()
    onClose()
  }

  const handleConfirm = async () => {
    if (actionable) {
      const next = await api.action('done', { type: reminder.type as 'water' | 'stand' })
      setState(next)
    }
    await handleClose()
  }

  const handleSnooze = async () => {
    if (actionable) {
      const next = await api.action('snooze', { type: reminder.type as 'water' | 'stand' })
      setState(next)
    }
    await handleClose()
  }

  const handleDownload = async (image: LightboxImage) => {
    if (!image.id) return
    const saved = await api.downloadTodoImage(image.id, image.name)
    if (saved) showToast('已保存', '图片已下载到本地。')
  }

  return (
    <div className="reminder-dialog">
      <div className={`dialog-card${images.length > 0 ? ' dialog-card-wide' : ''}`}>
        <button className="dialog-close" type="button" onClick={() => void handleClose()}>
          &times;
        </button>
        <h2>{reminder.title}</h2>
        <p className="dialog-body">{reminder.body}</p>
        {images.length > 0 ? (
          <div className="todo-item-images dialog-images">
            {images.map((image, index) => (
              <button
                key={image.id ?? image.src}
                className="todo-image-thumb"
                type="button"
                title={`查看 ${image.name}`}
                onClick={() => setLightboxIndex(index)}
              >
                <img src={image.src} alt={image.name} />
              </button>
            ))}
          </div>
        ) : null}
        <p
          ref={countdownRef}
          className="dialog-countdown"
          hidden={reminder.type !== 'eye' || !reminder.durationSec}
        />
        <div className={`dialog-actions${actionable ? '' : ' dialog-actions-single'}`}>
          <button className="btn-primary" type="button" onClick={() => void handleConfirm()}>
            {actionable ? '确认' : '知道了'}
          </button>
          <button
            className="btn-secondary"
            type="button"
            hidden={!actionable}
            onClick={() => void handleSnooze()}
          >
            稍后提醒
          </button>
        </div>
      </div>
      {lightboxIndex !== null ? (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDownload={(image) => void handleDownload(image)}
        />
      ) : null}
    </div>
  )
}
