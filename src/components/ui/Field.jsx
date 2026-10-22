import { cloneElement, useId } from 'react'
import Icon from './Icon'

// Etiqueta + control + error, con la asociación accesible armada:
// el control recibe id, aria-invalid y aria-describedby automáticamente.
export default function Field({ label, hint, error, children, className = '' }) {
  const id = useId()
  const descId = error || hint ? `${id}-desc` : undefined
  const control = cloneElement(children, {
    id,
    className: `input ${children.props.className || ''}`.trim(),
    'aria-invalid': error ? true : undefined,
    'aria-describedby': descId,
  })
  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>{label}</label>
      {control}
      {error
        ? <span className="field__error" id={descId} role="alert"><Icon name="alert" size={13} />{error}</span>
        : hint && <span className="field__hint" id={descId}>{hint}</span>}
    </div>
  )
}
