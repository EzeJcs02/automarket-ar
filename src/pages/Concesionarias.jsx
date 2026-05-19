import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { setPageMeta, resetMeta } from '../lib/seo'
import { GuiaBoton } from '../components/GuiaModal'

const COLORS = ['var(--accent)', '#1a7a4a', '#185FA5', '#c9a84c', '#7F77DD', '#D85A30']

const PLAN_BADGE = {
  premium: { label: 'PREMIUM', bg: 'rgba(230,51,41,.15)', color: 'var(--accent)', border: 'rgba(230,51,41,.3)' },
  pro:     { label: 'PRO',     bg: 'rgba(201,168,76,.12)', color: '#c9a84c',        border: 'rgba(201,168,76,.3)' },
  basico:  { label: 'BÁSICO',  bg: 'rgba(74,222,128,.1)',  color: '#4ade80',        border: 'rgba(74,222,128,.25)' },
}

function LogoConc({ c, i, size = 64 }) {
  if (c.logo_url) {
    return <img src={c.logo_url} alt={c.nombre} style={{ width: size, height: size, borderRadius: 'var(--radius)', objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 'var(--radius)', background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: size * 0.44, flexShrink: 0, color: '#fff' }}>
      {c.nombre?.[0]?.toUpperCase()}
    </div>
  )
}

export function Concesionarias() {
  const navigate = useNavigate()
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    setPageMeta({ title: 'Concesionarias', description: 'Encontrá la concesionaria ideal. Red de agencias verificadas en toda Argentina con catálogo online, reseñas y contacto directo.', path: '/concesionarias' })
    supabase
      .from('concesionarias')
      .select('*, autos(count)')
      .eq('aprobada', true)
      .order('destacada', { ascending: false })
      .order('nombre')
      .then(({ data }) => { setLista(data || []); setLoading(false) })
  }, [])

  const filtradas = busqueda.trim()
    ? lista.filter(c =>
        c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.ciudad?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : lista

  const destacadas = filtradas.filter(c => c.destacada)
  const resto = filtradas.filter(c => !c.destacada)

  return (
    <div className="page-wrapper">

      {/* HERO HEADER */}
      <div className="responsive-section" style={{ padding: '4rem 4rem 3rem', borderBottom: '1px solid var(--gray2)', background: 'linear-gradient(180deg, rgba(230,51,41,.04) 0%, transparent 100%)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Red oficial de agencias
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,6vw,64px)', lineHeight: .95, marginBottom: '1.25rem' }}>
          CONCESIONARIAS
        </div>
        <p style={{ fontSize: '15px', color: 'var(--gray4)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '2rem' }}>
          Agencias verificadas con catálogo online, reseñas reales y contacto directo.
        </p>

        {/* BARRA BÚSQUEDA + STAT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '10px 20px', width: '100%', maxWidth: '320px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar por nombre o ciudad..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '14px', outline: 'none', width: '100%', marginLeft: '10px', fontFamily: 'var(--font-body)' }} />
            {busqueda && <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', color: 'var(--gray4)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 0 0 6px' }}>×</button>}
          </div>
          {!loading && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gray4)' }}>
              {busqueda.trim() ? `${filtradas.length} resultado${filtradas.length !== 1 ? 's' : ''}` : `${lista.length} agencia${lista.length !== 1 ? 's' : ''} activa${lista.length !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>
        <GuiaBoton seccion="agencias" style={{ marginTop: '0.25rem' }} />
      </div>

      <div className="responsive-section" style={{ padding: '3rem 4rem' }}>
        {loading ? (
          <div className="spinner" />
        ) : filtradas.length === 0 ? (
          <div style={{ padding: '5rem 0', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '1rem', opacity: .3 }}>🏢</div>
            <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>
              {lista.length === 0 ? 'Todavía no hay concesionarias registradas.' : 'No hay resultados para esa búsqueda.'}
            </p>
          </div>
        ) : (
          <>
            {/* SECCIÓN DESTACADAS */}
            {destacadas.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase' }}>Agencias destacadas</div>
                  <div style={{ flex: 1, height: '1px', background: 'var(--gray2)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(340px,100%),1fr))', gap: '1rem' }}>
                  {destacadas.map((c, i) => <ConcCard key={c.id} c={c} i={i} navigate={navigate} featured />)}
                </div>
              </div>
            )}

            {/* SECCIÓN RESTO */}
            {resto.length > 0 && (
              <div>
                {destacadas.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray4)', letterSpacing: '.15em', textTransform: 'uppercase' }}>Todas las agencias</div>
                    <div style={{ flex: 1, height: '1px', background: 'var(--gray2)' }} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: '1rem' }}>
                  {resto.map((c, i) => <ConcCard key={c.id} c={c} i={i + destacadas.length} navigate={navigate} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ConcCard({ c, i, navigate, featured = false }) {
  const badge = PLAN_BADGE[c.plan]
  const autoCount = c.autos?.[0]?.count ?? 0
  const accentColor = COLORS[i % COLORS.length]

  return (
    <div
      onClick={() => navigate(`/concesionaria/${c.id}`)}
      style={{
        background: 'var(--gray1)',
        border: `1px solid ${featured ? 'rgba(230,51,41,.3)' : 'var(--gray2)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'border-color .2s, transform .15s, box-shadow .2s',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = featured ? 'rgba(230,51,41,.6)' : 'var(--gray3)'
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,.5)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = featured ? 'rgba(230,51,41,.3)' : 'var(--gray2)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* BANNER */}
      <div style={{
        height: '72px',
        background: c.portada_url
          ? `url(${c.portada_url}) center/cover`
          : `linear-gradient(135deg, ${featured ? 'rgba(230,51,41,.25)' : accentColor + '22'} 0%, #0d0d0d 100%)`,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: `radial-gradient(circle, ${featured ? 'rgba(230,51,41,.18)' : accentColor + '18'} 0%, transparent 70%)`, pointerEvents: 'none' }} />
        {featured && (
          <div style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '.12em', padding: '3px 9px', borderRadius: '2px', background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', color: 'var(--accent)', border: '1px solid rgba(230,51,41,.45)' }}>
            DESTACADA
          </div>
        )}
      </div>

      {/* BODY */}
      <div style={{ padding: '0 1.25rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-26px', marginBottom: '10px' }}>
          <div style={{ padding: '3px', background: 'var(--gray1)', borderRadius: 'calc(var(--radius) + 4px)', border: '2px solid var(--gray1)', lineHeight: 0 }}>
            <LogoConc c={c} i={i} size={50} />
          </div>
          {badge && (
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '100px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
              {badge.label}
            </span>
          )}
        </div>

        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--white)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {c.nombre}
        </div>
        {c.ciudad && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--gray4)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {c.ciudad}
          </div>
        )}
        {c.descripcion && (
          <p style={{ fontSize: '12px', color: 'var(--gray4)', lineHeight: 1.6, margin: '0.6rem 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {c.descripcion}
          </p>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderTop: '1px solid var(--gray2)' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--white)' }}>{autoCount}</span>
            <span style={{ fontSize: '11px', color: 'var(--gray4)', marginLeft: '5px', textTransform: 'uppercase', letterSpacing: '.06em' }}>autos</span>
          </div>
          {c.whatsapp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#25D366' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M11.99 0C5.37 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.83L.057 23.998l6.306-1.654A11.954 11.954 0 0011.99 24C18.627 24 24 18.627 24 12S18.627 0 11.99 0zm.01 21.818a9.818 9.818 0 01-5.002-1.368l-.36-.214-3.733.979 1-3.64-.234-.374a9.818 9.818 0 119.33 4.617z"/></svg>
              WhatsApp
            </div>
          )}
        </div>
        <div style={{ fontSize: '12px', color: featured ? 'var(--accent)' : 'var(--gray4)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Ver stock
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
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
    supabase.from('concesionarias').select('*').eq('id', pathId).single().then(({ data }) => {
      setC(data)
      if (data) {
        setPageMeta({
          title: data.nombre,
          description: `${data.nombre} en ${data.ciudad || 'Argentina'}. ${data.descripcion?.slice(0, 120) || 'Catálogo online de vehículos nuevos y usados.'}`,
          image: data.logo_url || data.portada_url || undefined,
          path: `/concesionaria/${data.id}`,
        })
      }
    })
    supabase.from('autos').select('*').eq('concesionaria_id', pathId).eq('activo', true).then(({ data }) => {
      setAutos(data || [])
      setLoading(false)
    })
    supabase.from('resenas').select('*').eq('concesionaria_id', pathId).order('created_at', { ascending: false }).then(({ data }) => setResenas(data || []))
    return () => resetMeta()
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
      <div className="responsive-section" style={{ padding: '1.5rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
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
      <div className="responsive-section" style={{ padding: '0 4rem 2rem', borderBottom: '1px solid var(--gray2)', position: 'relative' }}>
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
              <button onClick={() => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,'')}?text=Hola! Vi su concesionaria en FIORA MARKET`, '_blank')}
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
      <div className="responsive-section" style={{ display: 'flex', gap: '3rem', padding: '2rem 4rem', borderBottom: '1px solid var(--gray2)', flexWrap: 'wrap' }}>
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
      <div className="responsive-section" style={{ padding: '2rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Stock disponible</div>
        {autos.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Esta concesionaria no tiene autos publicados todavía.</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: '1.5rem' }}>
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
      <div className="responsive-section" style={{ padding: '3rem 4rem' }}>
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