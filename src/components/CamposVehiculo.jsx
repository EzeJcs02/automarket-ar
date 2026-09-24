import { useId } from 'react'

const MARCAS = [
  // Autos
  'Audi', 'BMW', 'BYD', 'Chery', 'Chevrolet', 'Citroën', 'DS', 'Fiat', 'Ford', 'Haval', 'Honda', 'Hyundai',
  'Jeep', 'Kia', 'Land Rover', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'RAM',
  'Renault', 'Subaru', 'Suzuki', 'Toyota', 'Volkswagen', 'Volvo',
  // Motos
  'Bajaj', 'Benelli', 'Corven', 'Ducati', 'Gilera', 'Harley-Davidson', 'Kawasaki', 'KTM', 'Motomel', 'Royal Enfield',
  'RVM', 'Triumph', 'Yamaha', 'Zanella',
  // Náutica
  'Bayliner', 'Bermuda', 'Genesis', 'Klase A', 'Mercury', 'Quicksilver', 'Sea-Doo', 'Tracker', 'Yamaha Marine',
]

// Input de marca con sugerencias nativas (datalist): se puede elegir o escribir cualquier otra.
export function MarcaInput(props) {
  const id = useId()
  return (
    <>
      <input type="text" list={id} autoComplete="off" {...props} />
      <datalist id={id}>
        {MARCAS.map(m => <option key={m} value={m} />)}
      </datalist>
    </>
  )
}

const soloDigitos = v => String(v ?? '').replace(/\D/g, '')

// Número entero con separador de miles mientras se escribe ("25.000.000").
// value/onChange trabajan con el número limpio como string ("25000000").
export function NumeroInput({ value, onChange, prefijo, sufijo, style, ...props }) {
  const digitos = soloDigitos(value)
  const mostrado = digitos ? Number(digitos).toLocaleString('es-AR') : ''
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {prefijo && <span aria-hidden="true" style={{ position: 'absolute', left: '12px', color: 'var(--gray4)', fontSize: '14px', pointerEvents: 'none' }}>{prefijo}</span>}
      <input
        type="text" inputMode="numeric" autoComplete="off"
        value={mostrado}
        onChange={e => onChange(soloDigitos(e.target.value).slice(0, 12))}
        style={{ ...style, paddingLeft: prefijo ? `${20 + prefijo.length * 8}px` : undefined, paddingRight: sufijo ? '44px' : undefined }}
        {...props}
      />
      {sufijo && <span aria-hidden="true" style={{ position: 'absolute', right: '12px', color: 'var(--gray4)', fontSize: '13px', pointerEvents: 'none' }}>{sufijo}</span>}
    </div>
  )
}
