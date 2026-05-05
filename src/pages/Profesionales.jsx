import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { setPageMeta } from '../lib/seo'

const CATEGORIAS = [
  { id: 'gestores', label: 'Gestores automotores', icon: '📋' },
  { id: 'escribanos', label: 'Escribanos', icon: '✍️' },
  { id: 'mecanicos', label: 'Mecánicos', icon: '🔧' },
  { id: 'repuesteros', label: 'Repuesteros', icon: '🏪' },
  { id: 'seguros', label: 'Seguros', icon: '🛡️' },
  { id: 'estetica', label: 'Estética vehicular', icon: '✨' },
  { id: 'verificacion', label: 'Verificación / inspección', icon: '🔍' },
  { id: 'transporte', label: 'Transporte / flete', icon: '🚛' },
]

const COLORS = ['var(--accent)', '#1a7a4a', '#185FA5', '#c9a84c', '#7F77DD', '#D85A30', '#2a8a6a', '#c94c4c']

function Avatar({ nombre, i, size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: COLORS[i % COLORS.length],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.45, color: '#fff'
    }}>
      {nombre?.[0]?.toUpperCase()}
    </div>
  )
}

function ProfesionalCard({ p, i }) {
  const categoria = CATEGORIAS.find(c => c.id === p.categoria)
  const waLink = p.whatsapp
    ? `https://wa.me/${p.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, te contacto desde Fiora Market.')}`
    : null

  return (
    <div style={{
      background: 'var(--gray1)', border: `1px solid ${p.destacado ? 'var(--gold)' : 'var(--gray2)'}`,
      borderRadius: 'var(--radius-lg)', padding: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '1rem',
      position: 'relative', transition: 'border-color .2s'
    }}
      onMouseEnter={e => !p.destacado && (e.currentTarget.style.borderColor = 'var(--gray3)')}
      onMouseLeave={e => !p.destacado && (e.currentTarget.style.borderColor = 'var(--gray2)')}>

      {p.destacado && (
        <div style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'var(--gold)', color: '#000', fontSize: '10px',
          fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '.08em',
          padding: '3px 8px', borderRadius: '100px', textTransform: 'uppercase'
        }}>
          RECOMENDADO
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Avatar nombre={p.nombre} i={i} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--white)' }}>{p.nombre}</span>
            {p.verificado && (
              <span title="Verificado" style={{ color: '#1a7a4a', fontSize: '14px', lineHeight: 1 }}>✔</span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gray4)', marginTop: '2px' }}>
            {categoria ? `${categoria.icon} ${categoria.label}` : p.categoria}
          </div>
        </div>
      </div>

      {/* Ubicación */}
      {p.ciudad && (
        <div style={{ fontSize: '12px', color: 'var(--gray4)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {p.ciudad}
        </div>
      )}

      {/* Descripción */}
      {p.descripcion && (
        <p style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.6, margin: 0 }}>
          {p.descripcion}
        </p>
      )}

      {/* Precio aproximado */}
      {p.precio_aproximado && (
        <div style={{ fontSize: '12px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)' }}>
          Desde {p.precio_aproximado}
        </div>
      )}

      {/* Contacto */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: '#25D366', color: '#fff', borderRadius: 'var(--radius)',
              padding: '9px 16px', fontSize: '13px', fontWeight: 600,
              textDecoration: 'none', transition: 'opacity .15s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            WhatsApp
          </a>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          {p.telefono && (
            <a href={`tel:${p.telefono}`}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                border: '1px solid var(--gray3)', color: 'var(--gray4)', borderRadius: 'var(--radius)',
                padding: '8px 12px', fontSize: '12px', textDecoration: 'none', transition: 'color .15s, border-color .15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--gray4)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--gray4)'; e.currentTarget.style.borderColor = 'var(--gray3)' }}>
              📞 {p.telefono}
            </a>
          )}
          {p.email && (
            <a href={`mailto:${p.email}`}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                border: '1px solid var(--gray3)', color: 'var(--gray4)', borderRadius: 'var(--radius)',
                padding: '8px 12px', fontSize: '12px', textDecoration: 'none', transition: 'color .15s, border-color .15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--gray4)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--gray4)'; e.currentTarget.style.borderColor = 'var(--gray3)' }}>
              ✉ Email
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Profesionales() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    setPageMeta({
      title: 'Profesionales',
      description: 'Encontrá gestores, escribanos, mecánicos, seguros y más profesionales del ecosistema automotor en Argentina.',
      path: '/profesionales'
    })
    supabase.from('profesionales')
      .select('*')
      .eq('activo', true)
      .order('destacado', { ascending: false })
      .order('nombre')
      .then(({ data }) => {
        setLista(data || [])
        setLoading(false)
      })
  }, [])

  const filtrados = lista.filter(p => {
    const matchCategoria = !categoriaActiva || p.categoria === categoriaActiva
    const q = busqueda.toLowerCase().trim()
    const matchBusqueda = !q ||
      p.nombre?.toLowerCase().includes(q) ||
      p.ciudad?.toLowerCase().includes(q) ||
      p.descripcion?.toLowerCase().includes(q)
    return matchCategoria && matchBusqueda
  })

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ padding: '4rem 4rem 2rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '.75rem' }}>
          Ecosistema automotor
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', marginBottom: '.5rem', lineHeight: 1 }}>
          PROFESIONALES
        </div>
        <p style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '1.5rem', maxWidth: '480px' }}>
          Gestores, escribanos, mecánicos, seguros y más. Todo lo que necesitás para comprar, vender o mantener tu vehículo.
        </p>

        {/* Buscador */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '8px 18px', maxWidth: '380px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gray4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Buscar por nombre, ciudad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '13px', outline: 'none', width: '100%', marginLeft: '10px', fontFamily: 'var(--font-body)' }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', color: 'var(--gray4)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 0 0 6px' }}>×</button>
          )}
        </div>
      </div>

      {/* Filtros de categoría */}
      <div style={{ padding: '1.25rem 4rem', borderBottom: '1px solid var(--gray2)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setCategoriaActiva(null)}
          style={{
            padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            background: !categoriaActiva ? 'var(--white)' : 'transparent',
            color: !categoriaActiva ? 'var(--black)' : 'var(--gray4)',
            border: `1px solid ${!categoriaActiva ? 'var(--white)' : 'var(--gray3)'}`,
            transition: 'all .15s'
          }}>
          Todos
        </button>
        {CATEGORIAS.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoriaActiva(categoriaActiva === cat.id ? null : cat.id)}
            style={{
              padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              background: categoriaActiva === cat.id ? 'var(--accent)' : 'transparent',
              color: categoriaActiva === cat.id ? '#fff' : 'var(--gray4)',
              border: `1px solid ${categoriaActiva === cat.id ? 'var(--accent)' : 'var(--gray3)'}`,
              transition: 'all .15s'
            }}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ padding: '2rem 4rem' }}>
        {loading ? (
          <div className="spinner" />
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            {lista.length === 0 ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔧</div>
                <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '.5rem' }}>Próximamente</div>
                <p style={{ color: 'var(--gray4)', fontSize: '14px', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
                  Estamos sumando profesionales del ecosistema automotor. ¿Sos uno de ellos?
                </p>
                <a href="mailto:contacto@fioramarket.store?subject=Quiero registrarme como profesional"
                  className="btn-primary" style={{ display: 'inline-block', padding: '10px 24px', fontSize: '13px', textDecoration: 'none' }}>
                  Contactanos para registrarte
                </a>
              </>
            ) : (
              <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>
                No hay profesionales que coincidan con la búsqueda.
              </p>
            )}
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray4)', marginBottom: '1.5rem', letterSpacing: '.05em' }}>
              {filtrados.length} {filtrados.length === 1 ? 'profesional' : 'profesionales'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {filtrados.map((p, i) => (
                <ProfesionalCard key={p.id} p={p} i={i} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* CTA registrarse */}
      {lista.length > 0 && (
        <div style={{ margin: '0 4rem 4rem', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '.5rem' }}>
            ¿SOS UN PROFESIONAL?
          </div>
          <p style={{ color: 'var(--gray4)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Sumá tu perfil y llegá a compradores y vendedores de toda Argentina.
          </p>
          <a href="mailto:contacto@fioramarket.store?subject=Quiero registrarme como profesional"
            className="btn-primary" style={{ display: 'inline-block', padding: '10px 24px', fontSize: '13px', textDecoration: 'none' }}>
            Registrarme como profesional
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .page-wrapper > div { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
        }
      `}</style>
    </div>
  )
}
