interface ToggleProps {
  id?: string
  name?: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Toggle({ id, name, checked, onChange, label }: ToggleProps) {
  return (
    <label className="toggle">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-slider" />
      <span className="toggle-label">{label}</span>
    </label>
  )
}
