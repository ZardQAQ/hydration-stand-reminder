import { useToast } from '../../contexts/ToastContext'

export function Toast() {
  const { toast } = useToast()
  if (!toast) return null

  return (
    <div className={`app-toast visible`}>
      <strong>{toast.title}</strong>
      <span>{toast.body}</span>
    </div>
  )
}
