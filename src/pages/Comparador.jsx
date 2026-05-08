import { useNavigate } from 'react-router-dom'
import { useComparador } from '../context/ComparadorContext'

const SPECS = [
  ['Marca', a => a.marca],
  ['Modelo', a => a.modelo],
  ['Año', a => a.anio],
  ['Tipo', a => a.tipo === 'nuevo' ? 'Nuevo' : 'Usado'],
  ['Kilometraje', a => a.kilometraje === 0 ? '0 km' : `${Number(a.kilometraje).toLocaleString('es-AR')} km`],
  ['Combustible', a => a.combustible || '—'],
  ['Transmisión', a => a.transmision || '—'],
  ['Color', a => a.color || '—'],
  ['Precio ARS', a => a.precio_ars ? '$' + Number(a.precio_ars).toLocaleString('es-AR') : 'Consultar'],
  ['Precio USD', a => a.precio_usd ? 'USD ' + Number(a.precio_usd).toLocaleString('es-AR') : '—'],
]

export default function Comparador() {
  const navigate = useNavigate()
  const { lista, quitar, limpiar } = useComparador()

  if (lista.length === 0) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 58px)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', marginBottom: '1rem' }}>COMPARADOR</div>
        <p style={{ color: 'var(--gray4)', fontSize: '15px', marginBottom: '2rem' }}>Agregá vehículos desde el catálogo para compararlos.</p>
        <button className="btn-primary" onClick={() => navigate('/catalogo')}>Ir al catálogo →</button>
      </div>
    </div>
  )

  return (
    <div className="page-wrapper">
      <div className="responsive-section" style={{ padding: '3rem 4rem 2rem', borderBottom: '1px solid var(--gray2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', marginBottom: '.25rem' }}>COMPARADOR</div>
          <div style={{ fontSize: '14px', color: 'var(--gray4)' }}>{lista.length} vehículo{lista.length !== 1 ? 's' : ''} seleccionado{lista.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => navigate('/catalogo')} style={{ fontSize: '13px', padding: '8px 18px' }}>+ Agregar vehículo</button>
          <button className="btn-secondary" onClick={limpiar} style={{ fontSize: '13px', padding: '8px 18px', borderColor: 'rgba(230,51,41,0.4)', color: 'var(--accent)' }}>Limpiar</button>
        </div>
      </div>

      <div className="responsive-section" style={{ overflowX: 'auto', padding: '2rem 4rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr>
              <th style={{ width: '160px', padding: '16px 20px', textAlign: 'left', fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--gray2)' }}>Especificación</th>
              {lista.map(a => (
                <th key={a.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray2)', minWidth: '220px' }}>
                  <div style={{ position: 'relative' }}>
                    {a.fotos?.[0] && (
                      <img src={a.fotos[0]} alt={a.modelo} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: '12px', display: 'block' }} />
                    )}
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{a.marca}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', lineHeight: 1, marginBottom: '8px' }}>{a.modelo?.toUpperCase()}</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn-primary" onClick={() => navigate(`/auto/${a.id}`)} style={{ padding: '6px 14px', fontSize: '11px' }}>Ver detalle</button>
                      <button onClick={() => quitar(a.id)} style={{ padding: '6px 14px', fontSize: '11px', borderRadius: 'var(--radius)', border: '1px solid var(--gray3)', background: 'transparent', color: 'var(--gray4)', cursor: 'pointer' }}>Quitar</button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPECS.map(([label, getter]) => {
              const values = lista.map(a => getter(a))
              const allSame = values.every(v => v === values[0])
              return (
                <tr key={label} style={{ borderBottom: '1px solid var(--gray2)' }}>
                  <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</td>
                  {lista.map((a, i) => (
                    <td key={a.id} style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, color: !allSame && label === 'Precio ARS' ? 'var(--accent)' : 'var(--white)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      {getter(a)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
