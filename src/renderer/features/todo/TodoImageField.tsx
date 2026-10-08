import { useRef, type ChangeEvent, type DragEvent } from 'react'
import { TODO_IMAGE_MAX_COUNT } from '@shared/constants'
import type { DraftImage } from './image-helpers'

interface TodoImageFieldProps {
  images: DraftImage[]
  onAdd: (files: FileList | File[]) => void
  onRemove: (index: number) => void
  onOpen: (index: number) => void
}

export function TodoImageField({ images, onAdd, onRemove, onOpen }: TodoImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return
    onAdd(files)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    handleFiles(event.dataTransfer.files)
  }

  const onSelect = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
  }

  const canAdd = images.length < TODO_IMAGE_MAX_COUNT

  return (
    <div className="setting-item todo-image-field">
      <label>附件图片</label>
      <div
        className={`todo-image-dropzone${canAdd ? '' : ' is-full'}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        {images.map((image, index) => (
          <div key={image.key} className="todo-image-thumb-wrap">
            <button
              className="todo-image-thumb"
              type="button"
              title={`查看 ${image.name}`}
              onClick={() => onOpen(index)}
            >
              <img src={image.previewUrl} alt={image.name} />
            </button>
            <button
              className="todo-image-remove"
              type="button"
              aria-label={`移除 ${image.name}`}
              onClick={() => onRemove(index)}
            >
              ×
            </button>
          </div>
        ))}
        {canAdd ? (
          <button
            className="todo-image-add"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <span>+</span>
            上传图片
          </button>
        ) : null}
        <input
          ref={inputRef}
          className="todo-image-input"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,.jpg,.jpeg,.png,.gif,.webp,.bmp"
          multiple
          onChange={onSelect}
        />
      </div>
      <p className="todo-image-hint">
        截图或复制图片后按 Ctrl+V 即可粘贴。也可点击上传、拖拽到此处。支持 jpg / png / gif / webp，最多{' '}
        {TODO_IMAGE_MAX_COUNT} 张，单张不超过 8MB。
      </p>
    </div>
  )
}
