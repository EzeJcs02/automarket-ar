import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const COLORS = ['var(--accent)', '#1a7a4a', '#185FA5', '#c9a84c', '#7F77DD', '#D85A30']

function LogoConcesionaria({ c, i, size = 52, fontSize = 26, mb = '1rem' }) {
  if (c.logo_url) {
    return (
      <img src={c.logo_url} alt={c.nombre}
        style={{ width: size, height: size, borderRadius: 'var(--radius)', objectFit: 'cover', marginBottom: mb, flexShrink: 0 }} />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 'var(--radius)', background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize, marginBottom: mb, flexShrink: 0 }}>
      {c.nombre?.[0]?.toUpperCase()}
    </div>
  )
}

export function Concesionarias() {
  const navigate = useNavigate()
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('concesionarias').select('*').eq('aprobada', true).order('nombre').then(({ data }) => {
      setLista(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="page-wrapper">
      <div style={{ padding: '4rem 4rem 2rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', marginBottom: '.5rem' }}>CONCESIONARIAS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gray4)' }}>
          {loading ? 'Cargando...' : `${lista.length} concesionarias adheridas`}
        </div>
      </div>
      <div style={{ padding: '2rem 4rem' }}>
        {loading
          ? <div className="spinner" />
          : lista.length === 0
            ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no hay concesionarias registradas.</p>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1px', background: 'var(--gray2)' }}>
                {lista.map((c, i) => (
                  <div key={c.id} onClick={() => navigate(`/concesionaria/${c.id}`)}
                    style={{ background: 'var(--gray1)', padding: '1.5rem', cursor: 'pointer', transition: 'background .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#222'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--gray1)'}>
                    <LogoConcesionaria c={c} i={i} />
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{c.nombre}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '.5rem' }}>{c.ciudad}</div>
                    {c.telefono && <div style={{ fontSize: '12px', color: 'var(--gray4)' }}>{c.telefono}</div>}
                  </div>
                ))}
              </div>
        }
      </div>
    </div>
  )
}

export function ConcesionariaDetalle() {
  const navigate = useNavigate()
  const [c, setC] = useState(null)
  const [autos, setAutos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pathId = window.location.pathname.split('/').pop()
    supabase.from('concesionarias').select('*').eq('id', pathId).single().then(({ data }) => setC(data))
    supabase.from('autos').select('*').eq('concesionaria_id', pathId).eq('activo', true).then(({ data }) => {
      setAutos(data || [])
      setLoading(false)
    })
  }, [])

  function formatPrice(n) {
    if (!n) return 'Consultar'
    return '$' + Number(n).toLocaleString('es-AR')
  }

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>
  if (!c) return <div className="page-wrapper" style={{ padding: '4rem' }}><p style={{ color: 'var(--gray4)' }}>No encontrado.</p></div>

  return (
    <div className="page-wrapper">
      {/* VOLVER */}
      <div style={{ padding: '1.5rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
        <span onClick={() => navigate('/concesionarias')} style={{ fontSize: '13px', color: 'var(--gray4)', cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '.05em' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--gray4)'}>
          ← Volver a concesionarias
        </span>
      </div>

      {/* BANNER / COVER */}
      <div style={{ position: 'relative', height: '200px', background: 'linear-gradient(135deg, #1a0000 0%, #2e0a0a 40%, #0a0a0a 100%)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .06, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,var(--white) 40px,var(--white) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,var(--white) 40px,var(--white) 41px)' }} />
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.2) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '10%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.1) 0%, transparent 70%)' }} />
      </div>

      {/* HEADER CON LOGO SOBRE EL BANNER */}
      <div style={{ padding: '0 4rem 2rem', borderBottom: '1px solid var(--gray2)', position: 'relative' }}>
        {/* LOGO - mitad dentro del banner, mitad afuera */}
        <div style={{ marginTop: '-50px', marginBottom: '1.5rem', display: 'inline-block' }}>
          {c.logo_url
            ? <img src={c.logo_url} alt={c.nombre} style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-lg)', objectFit: 'cover', border: '3px solid var(--black)', display: 'block' }} />
            : <div style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-lg)', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '48px', border: '3px solid var(--black)' }}>
                {c.nombre?.[0]?.toUpperCase()}
              </div>
          }
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', lineHeight: 1, marginBottom: '.5rem' }}>{c.nombre.toUpperCase()}</div>
            {c.direccion && <div style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '.75rem' }}>📍 {c.direccion}{c.ciudad ? `, ${c.ciudad}` : ''}</div>}
            {c.descripcion && <p style={{ fontSize: '14px', color: 'var(--gray4)', maxWidth: '500px', lineHeight: 1.7 }}>{c.descripcion}</p>}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '.5rem' }}>
            {c.whatsapp && (
              <button onClick={() => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,'')}?text=Hola! Vi su concesionaria en AutoMarket AR`, '_blank')}
                style={{ background: '#25D366', border: 'none', borderRadius: '100px', padding: '10px 20px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                💬 WhatsApp
              </button>
            )}
            {c.telefono && (
              <button onClick={() => window.open(`tel:${c.telefono}`)}
                style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '10px 20px', fontSize: '13px', color: 'var(--gray5)', cursor: 'pointer' }}>
                📞 {c.telefono}
              </button>
            )}
            {c.email && (
              <button onClick={() => window.open(`mailto:${c.email}`)}
                style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '10px 20px', fontSize: '13px', color: 'var(--gray5)', cursor: 'pointer' }}>
                📧 {c.email}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', gap: '3rem', padding: '2rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
        <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.length}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Autos publicados</div></div>
        <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.filter(a => a.tipo === 'nuevo').length}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Nuevos</div></div>
        <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.filter(a => a.tipo === 'usado').length}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Usados</div></div>
      </div>

      {/* STOCK */}
      <div style={{ padding: '2rem 4rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Stock disponible</div>
        {autos.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Esta concesionaria no tiene autos publicados todavía.</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5rem' }}>
              {autos.map(a => (
                <div key={a.id} className="car-card" onClick={() => navigate(`/auto/${a.id}`)}>
                  {a.fotos?.[0]
                    ? <img className="car-img-real" src={a.fotos[0]} alt={a.modelo} />
                    : <div className="car-img-placeholder">🚗</div>
                  }
                  <span className={`car-badge ${a.tipo === 'nuevo' ? 'badge-new' : 'badge-used'}`}>{a.tipo === 'nuevo' ? 'Nuevo' : 'Usado'}</span>
                  <div className="car-body">
                    <div className="car-brand">{a.marca}</div>
                    <div className="car-name">{a.modelo}</div>
                    <div className="car-specs"><span>{a.anio}</span><span>{a.kilometraje === 0 ? '0 km' : `${Number(a.kilometraje).toLocaleString('es-AR')} km`}</span></div>
                    <div className="car-price">{formatPrice(a.precio_ars)}</div>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}