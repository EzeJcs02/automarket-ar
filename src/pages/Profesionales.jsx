import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { setPageMeta } from '../lib/seo'

const CATEGORIAS = [
  { id: 'gestores',     label: 'Gestores automotores',     color: '#e63329' },
  { id: 'escribanos',   label: 'Escribanos',               color: '#185FA5' },
  { id: 'mecanicos',    label: 'Mecánicos',                color: '#c9a84c' },
  { id: 'repuesteros',  label: 'Repuesteros',              color: '#D85A30' },
  { id: 'seguros',      label: 'Seguros',                  color: '#7F77DD' },
  { id: 'estetica',     label: 'Estética vehicular',       color: '#1a7a4a' },
  { id: 'verificacion', label: 'Verificación e inspección',color: '#2a8a6a' },
  { id: 'transporte',   label: 'Transporte y flete',       color: '#185FA5' },
]

const COLORS = ['#e63329', '#185FA5', '#c9a84c', '#D85A30', '#7F77DD', '#1a7a4a', '#2a8a6a', '#c94c4c']

function Avatar({ nombre, i, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '4px', flexShrink: 0,
      background: COLORS[i % COLORS.length],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: size * 0.5, color: '#fff',
      letterSpacing: '-1px'
    }}>
      {nombre?.[0]?.toUpperCase()}
    </div>
  )
}

function IconPhone() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}

function ProfesionalCard({ p, i }) {
  const categoria = CATEGORIAS.find(c => c.id === p.categoria)
  const catColor = categoria?.color || COLORS[i % COLORS.length]
  const waLink = p.whatsapp
    ? `https://wa.me/${p.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, te contacto desde Fiora Market.')}`
    : null

  return (
    <div style={{
      background: 'var(--gray1)',
      border: `1px solid ${p.destacado ? 'rgba(201,168,76,.5)' : 'var(--gray2)'}`,
      borderRadius: 'var(--radius-lg)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      transition: 'border-color .2s, transform .2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = p.destacado ? 'rgba(201,168,76,.7)' : 'var(--gray3)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = p.destacado ? 'rgba(201,168,76,.5)' : 'var(--gray2)'; e.currentTarget.style.transform = 'none' }}>

      {/* Barra de color superior por categoría */}
      <div style={{ height: '3px', background: catColor, flexShrink: 0 }} />

      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.875rem', flex: 1 }}>

        {p.destacado && (
          <div style={{
            position: 'absolute', top: '16px', right: '14px',
            background: 'rgba(201,168,76,.15)', color: '#c9a84c',
            fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700,
            letterSpacing: '.1em', padding: '3px 8px', borderRadius: '2px',
            textTransform: 'uppercase', border: '1px solid rgba(201,168,76,.3)'
          }}>
            RECOMENDADO
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Avatar nombre={p.nombre} i={i} />
          <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)', lineHeight: 1.3 }}>{p.nombre}</span>
              {p.verificado && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" title="Verificado">
                  <circle cx="12" cy="12" r="10" fill="#1a7a4a" opacity=".2"/>
                  <path d="M9 12l2 2 4-4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div style={{ fontSize: '11px', color: catColor, marginTop: '3px', fontWeight: 500, letterSpacing: '.02em' }}>
              {categoria?.label || p.categoria}
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
          <p style={{ fontSize: '12.5px', color: 'var(--gray4)', lineHeight: 1.65, margin: 0 }}>
            {p.descripcion.length > 120 ? p.descripcion.slice(0, 117) + '...' : p.descripcion}
          </p>
        )}

        {/* Precio */}
        {p.precio_aproximado && (
          <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', letterSpacing: '.03em' }}>
            Desde {p.precio_aproximado}
          </div>
        )}

        {/* Contacto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: 'auto', paddingTop: '.25rem' }}>
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: '#25D366', color: '#fff', borderRadius: 'var(--radius)',
                padding: '9px 16px', fontSize: '13px', fontWeight: 600,
                textDecoration: 'none', transition: 'opacity .15s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              Contactar por WhatsApp
            </a>
          )}
          <div style={{ display: 'flex', gap: '7px' }}>
            {p.telefono && (
              <a href={`tel:${p.telefono}`}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  border: '1px solid var(--gray2)', color: 'var(--gray4)', borderRadius: 'var(--radius)',
                  padding: '8px 10px', fontSize: '12px', textDecoration: 'none', transition: 'all .15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--gray3)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--gray4)'; e.currentTarget.style.borderColor = 'var(--gray2)' }}>
                <IconPhone /> {p.telefono}
              </a>
            )}
            {p.email && (
              <a href={`mailto:${p.email}`}
                style={{
                  flex: p.telefono ? '0 0 auto' : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  border: '1px solid var(--gray2)', color: 'var(--gray4)', borderRadius: 'var(--radius)',
                  padding: '8px 14px', fontSize: '12px', textDecoration: 'none', transition: 'all .15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--gray3)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--gray4)'; e.currentTarget.style.borderColor = 'var(--gray2)' }}>
                <IconMail /> Email
              </a>
            )}
          </div>
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
      <div className="responsive-section" style={{ padding: '4rem 4rem 2.5rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Ecosistema automotor
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', marginBottom: '.75rem', lineHeight: 1 }}>
          PROFESIONALES
        </div>
        <p style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '2rem', maxWidth: '520px', lineHeight: 1.7 }}>
          Gestores, escribanos, mecánicos, seguros y más. Todo lo que necesitás para comprar, vender o mantener tu vehículo.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '8px 18px', maxWidth: '360px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gray4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Buscar por nombre o ciudad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '13px', outline: 'none', width: '100%', marginLeft: '10px', fontFamily: 'var(--font-body)' }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', color: 'var(--gray4)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 0 0 6px' }}>×</button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="responsive-section" style={{ padding: '1rem 4rem', borderBottom: '1px solid var(--gray2)', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setCategoriaActiva(null)}
          style={{
            padding: '5px 14px', borderRadius: '2px', fontSize: '11px', fontWeight: 600,
            cursor: 'pointer', letterSpacing: '.04em', textTransform: 'uppercase',
            background: !categoriaActiva ? 'var(--white)' : 'transparent',
            color: !categoriaActiva ? 'var(--black)' : 'var(--gray4)',
            border: `1px solid ${!categoriaActiva ? 'var(--white)' : 'var(--gray2)'}`,
            transition: 'all .15s'
          }}>
          Todos
        </button>
        {CATEGORIAS.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoriaActiva(categoriaActiva === cat.id ? null : cat.id)}
            style={{
              padding: '5px 14px', borderRadius: '2px', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', letterSpacing: '.04em', textTransform: 'uppercase',
              background: categoriaActiva === cat.id ? cat.color : 'transparent',
              color: categoriaActiva === cat.id ? '#fff' : 'var(--gray4)',
              border: `1px solid ${categoriaActiva === cat.id ? cat.color : 'var(--gray2)'}`,
              transition: 'all .15s'
            }}
            onMouseEnter={e => { if (categoriaActiva !== cat.id) { e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--gray3)' } }}
            onMouseLeave={e => { if (categoriaActiva !== cat.id) { e.currentTarget.style.color = 'var(--gray4)'; e.currentTarget.style.borderColor = 'var(--gray2)' } }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="responsive-section" style={{ padding: '2.5rem 4rem' }}>
        {loading ? (
          <div className="spinner" />
        ) : filtrados.length === 0 ? (
          <div style={{ padding: '6rem 0', textAlign: 'center' }}>
            {lista.length === 0 ? (
              <>
                <div style={{ width: '48px', height: '2px', background: 'var(--accent)', margin: '0 auto 2rem' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '.75rem', letterSpacing: '.05em' }}>
                  PRÓXIMAMENTE
                </div>
                <p style={{ color: 'var(--gray4)', fontSize: '14px', maxWidth: '340px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
                  Estamos sumando profesionales del ecosistema automotor. ¿Sos uno de ellos?
                </p>
                <a href="mailto:contacto@fioramarket.store?subject=Quiero registrarme como profesional"
                  className="btn-primary" style={{ display: 'inline-block', padding: '10px 24px', fontSize: '13px', textDecoration: 'none' }}>
                  Registrarme como profesional
                </a>
              </>
            ) : (
              <p style={{ color: 'var(--gray4)', fontSize: '14px' }}>
                No hay resultados para esa búsqueda.
              </p>
            )}
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray4)', marginBottom: '1.5rem', letterSpacing: '.05em' }}>
              {filtrados.length} {filtrados.length === 1 ? 'profesional' : 'profesionales'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1px', background: 'var(--gray2)' }}>
              {filtrados.map((p, i) => (
                <div key={p.id} style={{ background: 'var(--black)' }}>
                  <ProfesionalCard p={p} i={i} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {lista.length > 0 && (
        <div className="responsive-section" style={{ margin: '0 4rem 4rem', borderTop: '1px solid var(--gray2)', paddingTop: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '.5rem' }}>
              SOS UN PROFESIONAL?
            </div>
            <p style={{ color: 'var(--gray4)', fontSize: '13px', margin: 0 }}>
              Sumá tu perfil y llegá a compradores y vendedores de toda Argentina.
            </p>
          </div>
          <a href="/registro" className="btn-primary" style={{ display: 'inline-block', padding: '10px 24px', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Registrarme →
          </a>
        </div>
      )}

    </div>
  )
}
