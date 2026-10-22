import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './SearchCombobox.css'

// Campo de búsqueda con sugerencias (patrón ARIA combobox + listbox).
// No arma su propio <form>: Enter sin sugerencia elegida envía el form del
// padre; Enter/click sobre una sugerencia va directo a ese vehículo.
export default function SearchCombobox({ value, onChange, placeholder, label = 'Buscar vehículos', className = '', inputClassName = '' }) {
  const navigate = useNavigate()
  const listId = useId()
  const debounceRef = useRef(null)
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  function handleChange(v) {
    onChange(v)
    setActive(-1)
    clearTimeout(debounceRef.current)
    if (v.trim().length < 2) { setItems([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      const safe = v.replace(/[%_,()]/g, '\\$&')
      const { data } = await supabase.from('autos')
        .select('id, marca, modelo, anio, tipo')
        .eq('activo', true)
        .or(`marca.ilike.%${safe}%,modelo.ilike.%${safe}%`)
        .limit(6)
      setItems(data || [])
      setOpen(true)
    }, 280)
  }

  function elegir(a) {
    setOpen(false)
    setActive(-1)
    onChange('')
    navigate(`/auto/${a.id}`)
  }

  const expanded = open && items.length > 0

  function onKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); setActive(-1); return }
    if (!expanded) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % items.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i <= 0 ? items.length : i) - 1) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); elegir(items[active]) }
  }

  return (
    <div className={`combo ${className}`.trim()}>
      <input
        type="search"
        role="combobox"
        aria-label={label}
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        className={inputClassName}
        value={value}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => items.length > 0 && setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {expanded && (
        <ul id={listId} role="listbox" aria-label="Sugerencias" className="combo__list">
          {items.map((a, i) => (
            <li key={a.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              className="combo__option"
              onMouseDown={e => { e.preventDefault(); elegir(a) }}
              onMouseEnter={() => setActive(i)}>
              <span className="combo__name">{a.marca} {a.modelo}</span>
              <span className="combo__meta tabular">{[a.anio, a.tipo].filter(Boolean).join(' · ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
