import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'

export interface LightboxImage {
  src: string
  name: string
  id?: string
}

interface ImageLightboxProps {
  images: LightboxImage[]
  index: number
  onClose: () => void
  onDownload?: (image: LightboxImage) => void
}

const MIN_SCALE = 1
const MAX_SCALE = 8
const ZOOM_IN = 1.12
const ZOOM_OUT = 1 / 1.12

interface Transform {
  scale: number
  x: number
  y: number
}

function clampScale(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

export function ImageLightbox({ images, index, onClose, onDownload }: ImageLightboxProps) {
  const [current, setCurrent] = useState(index)
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef(transform)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  const image = images[current]
  const hasPrev = current > 0
  const hasNext = current < images.length - 1
  const zoomed = transform.scale > 1

  const commit = (next: Transform) => {
    const scale = clampScale(next.scale)
    const value = scale === 1 ? { scale: 1, x: 0, y: 0 } : { scale, x: next.x, y: next.y }
    transformRef.current = value
    setTransform(value)
  }

  const resetZoom = () => commit({ scale: 1, x: 0, y: 0 })

  const zoomBy = (factor: number, clientX?: number, clientY?: number) => {
    const currentTransform = transformRef.current
    const nextScale = clampScale(currentTransform.scale * factor)
    if (nextScale === currentTransform.scale) return
    if (nextScale === 1) {
      resetZoom()
      return
    }

    const stage = stageRef.current
    if (!stage || clientX == null || clientY == null) {
      commit({ ...currentTransform, scale: nextScale })
      return
    }

    const rect = stage.getBoundingClientRect()
    const px = clientX - rect.left - rect.width / 2
    const py = clientY - rect.top - rect.height / 2
    const ratio = nextScale / currentTransform.scale
    commit({
      scale: nextScale,
      x: px - (px - currentTransform.x) * ratio,
      y: py - (py - currentTransform.y) * ratio
    })
  }

  const zoomByRef = useRef(zoomBy)
  zoomByRef.current = zoomBy

  useEffect(() => {
    setCurrent(index)
  }, [index, images])

  useEffect(() => {
    resetZoom()
  }, [current, image?.src])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const factor = event.deltaY < 0 ? ZOOM_IN : ZOOM_OUT
      zoomByRef.current(factor, event.clientX, event.clientY)
    }

    root.addEventListener('wheel', onWheel, { passive: false })
    return () => root.removeEventListener('wheel', onWheel)
  }, [image?.src])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && hasPrev) setCurrent((value) => value - 1)
      if (event.key === 'ArrowRight' && hasNext) setCurrent((value) => value + 1)
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        const stage = stageRef.current?.getBoundingClientRect()
        zoomByRef.current(ZOOM_IN, stage ? stage.left + stage.width / 2 : undefined, stage ? stage.top + stage.height / 2 : undefined)
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        const stage = stageRef.current?.getBoundingClientRect()
        zoomByRef.current(ZOOM_OUT, stage ? stage.left + stage.width / 2 : undefined, stage ? stage.top + stage.height / 2 : undefined)
      }
      if (event.key === '0') {
        event.preventDefault()
        transformRef.current = { scale: 1, x: 0, y: 0 }
        setTransform({ scale: 1, x: 0, y: 0 })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasPrev, hasNext, onClose])

  if (!image) return null

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || transformRef.current.scale <= 1) return
    if ((event.target as HTMLElement).closest('.image-lightbox-nav')) return
    dragRef.current = { x: event.clientX, y: event.clientY }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y
    dragRef.current = { x: event.clientX, y: event.clientY }
    const currentTransform = transformRef.current
    commit({ scale: currentTransform.scale, x: currentTransform.x + dx, y: currentTransform.y + dy })
  }

  const endDrag = () => {
    dragRef.current = null
    setDragging(false)
  }

  const onDoubleClick = (event: ReactMouseEvent<HTMLImageElement>) => {
    if (transformRef.current.scale > 1) {
      resetZoom()
      return
    }
    zoomBy(2, event.clientX, event.clientY)
  }

  return createPortal(
    <div
      ref={rootRef}
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="查看图片"
      onClick={onClose}
    >
      <div className="image-lightbox-card" onClick={(event) => event.stopPropagation()}>
        <div className="image-lightbox-toolbar">
          <span className="image-lightbox-name" title={image.name}>
            {image.name}
            {images.length > 1 ? `  ·  ${current + 1}/${images.length}` : ''}
            <span className="image-lightbox-hint">滚轮缩放 · 拖动查看</span>
          </span>
          <div className="image-lightbox-actions">
            <div className="image-lightbox-zoom">
              <button
                className="image-lightbox-btn"
                type="button"
                aria-label="缩小"
                onClick={() => {
                  const stage = stageRef.current?.getBoundingClientRect()
                  zoomBy(ZOOM_OUT, stage ? stage.left + stage.width / 2 : undefined, stage ? stage.top + stage.height / 2 : undefined)
                }}
              >
                −
              </button>
              <span className="image-lightbox-zoom-value">{Math.round(transform.scale * 100)}%</span>
              <button
                className="image-lightbox-btn"
                type="button"
                aria-label="放大"
                onClick={() => {
                  const stage = stageRef.current?.getBoundingClientRect()
                  zoomBy(ZOOM_IN, stage ? stage.left + stage.width / 2 : undefined, stage ? stage.top + stage.height / 2 : undefined)
                }}
              >
                +
              </button>
              <button className="image-lightbox-btn" type="button" disabled={!zoomed} onClick={resetZoom}>
                适应
              </button>
            </div>
            {onDownload ? (
              <button className="image-lightbox-btn" type="button" onClick={() => onDownload(image)}>
                下载
              </button>
            ) : null}
            <button className="image-lightbox-btn" type="button" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>
        <div
          ref={stageRef}
          className={`image-lightbox-stage${zoomed ? ' is-zoomed' : ''}${dragging ? ' is-dragging' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {hasPrev ? (
            <button
              className="image-lightbox-nav image-lightbox-nav-prev"
              type="button"
              aria-label="上一张"
              onClick={() => setCurrent((value) => value - 1)}
            >
              ‹
            </button>
          ) : null}
          <img
            className={`image-lightbox-photo${dragging ? '' : ' is-animated'}`}
            src={image.src}
            alt={image.name}
            draggable={false}
            onDoubleClick={onDoubleClick}
            style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
          />
          {hasNext ? (
            <button
              className="image-lightbox-nav image-lightbox-nav-next"
              type="button"
              aria-label="下一张"
              onClick={() => setCurrent((value) => value + 1)}
            >
              ›
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  )
}
