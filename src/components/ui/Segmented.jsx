import { useId } from 'react'
import { motion as Motion } from 'motion/react'

// Selector tipo píldora (Comprar/Vender, Autos/Motos/Náutica).
// La píldora activa se desliza entre opciones con una animación de layout.
export default function Segmented({ options, value, onChange, label }) {
  const layoutId = useId()
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" className="segmented__btn" aria-pressed={value === key} onClick={() => onChange(key)}>
          {value === key && (
            <Motion.span layoutId={layoutId} className="segmented__pill" transition={{ type: 'tween', duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }} />
          )}
          {text}
        </button>
      ))}
    </div>
  )
}
