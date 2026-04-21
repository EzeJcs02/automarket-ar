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
      <div style={{ padding: '1.5rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
        <span onClick={() => navigate('/concesionarias')} style={{ fontSize: '13px', color: 'var(--gray4)', cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '.05em' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--gray4)'}>
          ← Volver a concesionarias
        </span>
      </div>
      <div style={{ padding: '4rem', borderBottom: '1px solid var(--gray2)', display: 'flex', gap: '3rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <LogoConcesionaria c={c} i={0} size={80} fontSize={40} mb="0" />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,56px)', lineHeight: 1, marginBottom: '.5rem' }}>{c.nombre.toUpperCase()}</div>
          {c.direccion && <div style={{ fontSize: '15px', color: 'var(--gray4)', marginBottom: '1rem' }}>📍 {c.direccion}{c.ciudad ? `, ${c.ciudad}` : ''}</div>}
          {c.descripcion && <p style={{ fontSize: '14px', color: 'var(--gray4)', maxWidth: '500px', lineHeight: 1.7, marginBottom: '1rem' }}>{c.descripcion}</p>}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {c.whatsapp && (
              <button onClick={() => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,'')}?text=Hola! Vi su concesionaria en AutoMarket AR`, '_blank')}
                style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '8px 18px', fontSize: '13px', color: 'var(--gray5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💬 WhatsApp
              </button>
            )}
            {c.telefono && (
              <button onClick={() => window.open(`tel:${c.telefono}`)}
                style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '8px 18px', fontSize: '13px', color: 'var(--gray5)', cursor: 'pointer' }}>
                📞 {c.telefono}
              </button>
            )}
            {c.email && (
              <button onClick={() => window.open(`mailto:${c.email}`)}
                style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '8px 18px', fontSize: '13px', color: 'var(--gray5)', cursor: 'pointer' }}>
                📧 {c.email}
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '3rem', padding: '2rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
        <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.length}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Autos publicados</div></div>
        <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.filter(a => a.tipo === 'nuevo').length}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Nuevos</div></div>
        <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.filter(a => a.tipo === 'usado').length}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Usados</div></div>
      </div>
      <div style={{ padding: '2rem 4rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Stock disponible</div>
        {autos.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Esta concesionaria no tiene autos publicados todavía.</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
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
 