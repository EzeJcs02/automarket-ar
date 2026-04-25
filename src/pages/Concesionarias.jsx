import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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
  const { user } = useAuth()
  const [c, setC] = useState(null)
  const [autos, setAutos] = useState([])
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [resenaForm, setResenaForm] = useState({ nombre: '', rating: 5, comentario: '' })
  const [resenaEnviando, setResenaEnviando] = useState(false)
  const [resenaOk, setResenaOk] = useState(false)

  const pathId = window.location.pathname.split('/').pop()

  useEffect(() => {
    supabase.from('concesionarias').select('*').eq('id', pathId).single().then(({ data }) => setC(data))
    supabase.from('autos').select('*').eq('concesionaria_id', pathId).eq('activo', true).then(({ data }) => {
      setAutos(data || [])
      setLoading(false)
    })
    supabase.from('resenas').select('*').eq('concesionaria_id', pathId).order('created_at', { ascending: false }).then(({ data }) => setResenas(data || []))
  }, [])

  async function enviarResena() {
    if (!resenaForm.nombre.trim() || !resenaForm.comentario.trim()) return
    setResenaEnviando(true)
    await supabase.from('resenas').insert({
      concesionaria_id: pathId,
      user_id: user?.id || null,
      nombre: resenaForm.nombre.trim(),
      rating: resenaForm.rating,
      comentario: resenaForm.comentario.trim(),
    })
    setResenaOk(true)
    setResenaEnviando(false)
    setResenaForm({ nombre: '', rating: 5, comentario: '' })
    const { data } = await supabase.from('resenas').select('*').eq('concesionaria_id', pathId).order('created_at', { ascending: false })
    setResenas(data || [])
  }

  const promedioRating = resenas.length > 0 ? (resenas.reduce((s, r) => s + r.rating, 0) / resenas.length).toFixed(1) : null

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
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: 'linear-gradient(135deg, #1a0000 0%, #2e0a0a 40%, #0a0a0a 100%)' }}>
        {c.portada_url
          ? <img src={c.portada_url} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <>
              <div style={{ position: 'absolute', inset: 0, opacity: .06, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,var(--white) 40px,var(--white) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,var(--white) 40px,var(--white) 41px)' }} />
              <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.2) 0%, transparent 70%)' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '10%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.1) 0%, transparent 70%)' }} />
            </>
        }
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
            {c.direccion && <div style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '.75rem' }}>{c.direccion}{c.ciudad ? `, ${c.ciudad}` : ''}</div>}
            {c.descripcion && <p style={{ fontSize: '14px', color: 'var(--gray4)', maxWidth: '500px', lineHeight: 1.7 }}>{c.descripcion}</p>}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '.5rem' }}>
            {c.whatsapp && (
              <button onClick={() => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,'')}?text=Hola! Vi su concesionaria en FIORA.MARKET`, '_blank')}
                style={{ background: '#25D366', border: 'none', borderRadius: '100px', padding: '10px 20px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.99 0C5.37 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.83L.057 23.998l6.306-1.654A11.954 11.954 0 0011.99 24C18.627 24 24 18.627 24 12S18.627 0 11.99 0zm.01 21.818a9.818 9.818 0 01-5.002-1.368l-.36-.214-3.733.979 1-3.64-.234-.374a9.818 9.818 0 119.33 4.617z"/></svg>
                WhatsApp
              </button>
            )}
            {c.telefono && (
              <button onClick={() => window.open(`tel:${c.telefono}`)}
                style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '10px 20px', fontSize: '13px', color: 'var(--gray5)', cursor: 'pointer' }}>
                {c.telefono}
              </button>
            )}
            {c.email && (
              <button onClick={() => window.open(`mailto:${c.email}`)}
                style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '10px 20px', fontSize: '13px', color: 'var(--gray5)', cursor: 'pointer' }}>
                {c.email}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', gap: '3rem', padding: '2rem 4rem', borderBottom: '1px solid var(--gray2)', flexWrap: 'wrap' }}>
        <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.length}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Autos publicados</div></div>
        <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.filter(a => a.tipo === 'nuevo').length}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Nuevos</div></div>
        <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.filter(a => a.tipo === 'usado').length}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Usados</div></div>
        {promedioRating && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', color: '#c9a84c' }}>
              {promedioRating} <span style={{ fontSize: '24px' }}>★</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>{resenas.length} reseña{resenas.length !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* STOCK */}
      <div style={{ padding: '2rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
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

      {/* RESEÑAS */}
      <div style={{ padding: '3rem 4rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '2rem' }}>
          Reseñas{resenas.length > 0 ? ` · ${resenas.length}` : ''}
        </div>

        {/* FORM */}
        <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem', maxWidth: '560px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '1.5rem' }}>{resenaOk ? '¡Gracias por tu reseña!' : 'Dejá tu reseña'}</div>
          {!resenaOk ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '6px' }}>Tu nombre</div>
                <input value={resenaForm.nombre} onChange={e => setResenaForm(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Juan Pérez" style={{ width: '100%', background: 'var(--gray2)', border: '1px solid var(--gray3)', color: 'var(--white)', padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '6px' }}>Puntuación</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setResenaForm(p => ({ ...p, rating: n }))}
                      style={{ fontSize: '22px', background: 'none', border: 'none', cursor: 'pointer', opacity: n <= resenaForm.rating ? 1 : 0.3, transition: 'opacity .15s' }}>★</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '6px' }}>Comentario</div>
                <textarea value={resenaForm.comentario} onChange={e => setResenaForm(p => ({ ...p, comentario: e.target.value }))}
                  placeholder="Contá tu experiencia..." rows={3}
                  style={{ width: '100%', background: 'var(--gray2)', border: '1px solid var(--gray3)', color: 'var(--white)', padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-body)' }} />
              </div>
              <button className="btn-primary" onClick={enviarResena} disabled={resenaEnviando || !resenaForm.nombre.trim() || !resenaForm.comentario.trim()} style={{ padding: '10px 24px', fontSize: '13px' }}>
                {resenaEnviando ? 'Enviando...' : 'Publicar reseña'}
              </button>
            </>
          ) : (
            <p style={{ color: 'var(--gray4)', fontSize: '14px' }}>Tu reseña fue publicada. ¡Gracias!</p>
          )}
        </div>

        {/* LISTADO */}
        {resenas.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '14px' }}>Todavía no hay reseñas. ¡Sé el primero!</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '680px' }}>
              {resenas.map(r => (
                <div key={r.id} style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{r.nombre}</div>
                      <div style={{ color: '#c9a84c', fontSize: '14px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)' }}>{new Date(r.created_at).toLocaleDateString('es-AR')}</div>
                  </div>
                  {r.comentario && <p style={{ fontSize: '14px', color: 'var(--gray5)', lineHeight: 1.7, margin: 0 }}>{r.comentario}</p>}
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}