import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'

export default function Home() {
  const navigate = useNavigate()
  const { user, concesionaria } = useAuth()
  const [autos, setAutos] = useState([])
  const [concesionarias, setConcesionarias] = useState([])
  const [tabGuia, setTabGuia] = useState('comprar')
  const [banners, setBanners] = useState([])
  const [rightAds, setRightAds] = useState([])
  const [autoFijado, setAutoFijado] = useState(null)
  const [rightIdx, setRightIdx] = useState(0)
  const [bottomIdx, setBottomIdx] = useState(0)

  useEffect(() => {
    document.title = 'FIORA.MARKET — Vehículos nuevos y usados en Argentina'
    supabase.from('autos').select('*, concesionarias(nombre, ciudad)').eq('activo', true).limit(6).order('created_at', { ascending: false }).then(({ data }) => setAutos(data || []))
    supabase.from('concesionarias').select('*').eq('aprobada', true).limit(6).then(({ data }) => setConcesionarias(data || []))
    supabase.from('concesionarias').select('id, nombre, portada_url').eq('banner_activo', true).limit(10).then(({ data }) => setBanners(data || []))
    supabase.from('publicidades').select('id, nombre, imagen_url, link_url').eq('activo', true).order('created_at', { ascending: false }).then(({ data }) => setRightAds(data || []))
    supabase.from('autos').select('*, concesionarias(nombre, ciudad)').eq('fijado_home', true).limit(1).then(({ data }) => setAutoFijado(data?.[0] || null))
  }, [])

  useEffect(() => {
    if (rightAds.length === 0) return
    const t = setInterval(() => setRightIdx(i => (i + 1) % rightAds.length), 3500)
    return () => clearInterval(t)
  }, [rightAds.length])

  useEffect(() => {
    if (banners.length === 0) return
    const t = setInterval(() => setBottomIdx(i => (i + 1) % Math.max(banners.length, 1)), 4000)
    return () => clearInterval(t)
  }, [banners.length])

  const colors = ['var(--accent)', '#1a7a4a', '#185FA5', '#c9a84c', '#7F77DD', '#D85A30']

  function LogoConcesionaria({ c, i, size = 52, fontSize = 26 }) {
    if (c.logo_url) {
      return (
        <img src={c.logo_url} alt={c.nombre}
          style={{ width: size, height: size, borderRadius: 'var(--radius)', objectFit: 'cover', marginBottom: '1rem', flexShrink: 0 }} />
      )
    }
    return (
      <div style={{ width: size, height: size, borderRadius: 'var(--radius)', background: colors[i % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize, marginBottom: '1rem', flexShrink: 0 }}>
        {c.nombre?.[0]?.toUpperCase()}
      </div>
    )
  }

  return (
    <div>
      {/* HERO + ADS DERECHA */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
        {/* Backgrounds */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: .04, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px)' }} />
        <div style={{ position: 'absolute', top: '-100px', right: '200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.15) 0%, transparent 70%)' }} />

        {/* Hero content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '4rem', position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Plataforma N°1 de vehículos en Argentina
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(60px,8vw,130px)', lineHeight: 1.05, letterSpacing: '2px', marginBottom: '2rem' }}>
            ENCONTRÁ<br />TU PRÓXIMO<br /><span style={{ color: 'var(--accent)' }}>VEHÍCULO</span>
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--gray4)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '3rem' }}>
            Miles de vehículos nuevos y usados de las mejores concesionarias de Argentina. Filtrá, compará y contactá directo.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '15px', padding: '14px 32px' }} onClick={() => navigate('/catalogo')}>Ver catálogo completo</button>
            <button className="btn-secondary" style={{ fontSize: '15px', padding: '14px 32px' }} onClick={() => navigate('/concesionarias')}>Ver concesionarias</button>
          </div>
          <div style={{ display: 'flex', gap: '3rem', marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--gray2)' }}>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.length > 0 ? `${autos.length}+` : '—'}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Vehículos publicados</div></div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{concesionarias.length > 0 ? concesionarias.length : '—'}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Concesionarias</div></div>
          </div>
        </div>

        {/* ADS DERECHA — 6 slots integrados */}
        <div className="hero-ads-right" style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--gray2)', position: 'relative', background: '#050505' }}>
          <div style={{ fontSize: '9px', color: 'var(--gray3)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em', textAlign: 'center', padding: '8px 0 4px', borderBottom: '1px solid var(--gray2)', textTransform: 'uppercase' }}>Publicidad</div>
          {Array.from({ length: 6 }, (_, i) => {
            const idx = rightAds.length > 0 ? (rightIdx + i) % rightAds.length : -1
            const ad = idx >= 0 ? rightAds[idx] : null
            return (
              <div key={i} style={{ flex: 1, overflow: 'hidden', borderBottom: i < 5 ? '1px solid var(--gray2)' : 'none', position: 'relative', cursor: ad?.link_url ? 'pointer' : 'default' }}
                onClick={() => ad?.link_url && window.open(ad.link_url, '_blank', 'noopener')}>
                {ad?.imagen_url
                  ? <img src={ad.imagen_url} alt={ad.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '.1em', textAlign: 'center', lineHeight: 1.8 }}>ESPACIO<br/>PUBLICITARIO</div>
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* PUBLICIDAD INFERIOR — 1 banner dinámico cycling */}
      <div style={{ borderBottom: '1px solid var(--gray2)', background: '#050505' }}>
        <div style={{ fontSize: '10px', color: 'var(--gray3)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em', padding: '8px 2rem 6px', textTransform: 'uppercase' }}>Publicidad</div>
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
          {banners.length > 0 ? banners.map((b, i) => (
            <div key={b.id} style={{ position: 'absolute', inset: 0, opacity: i === bottomIdx ? 1 : 0, transition: 'opacity .8s ease-in-out', pointerEvents: i === bottomIdx ? 'auto' : 'none' }}>
              {b.portada_url
                ? <img src={b.portada_url} alt={b.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: 'var(--gray1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--gray3)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{b.nombre}</div>
              }
            </div>
          )) : (
            <div style={{ width: '100%', height: '100%', border: '1px dashed var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray3)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Espacio publicitario</div>
              <div style={{ fontSize: '10px', color: 'var(--gray2)', fontFamily: 'var(--font-mono)' }}>Hasta 10 banners · cycling automático</div>
            </div>
          )}
          {/* dots */}
          {banners.length > 1 && (
            <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
              {banners.map((_, i) => (
                <div key={i} onClick={() => setBottomIdx(i)} style={{ width: i === bottomIdx ? '18px' : '6px', height: '6px', borderRadius: '100px', background: i === bottomIdx ? 'var(--white)' : 'rgba(255,255,255,.3)', cursor: 'pointer', transition: 'all .3s' }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VEHÍCULO FIJADO */}
      {autoFijado && (
        <div style={{ padding: '3rem 4rem', borderBottom: '1px solid var(--gray2)', background: 'rgba(230,51,41,0.03)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>⭐ Vehículo destacado del día</div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', background: 'var(--gray1)', border: '1px solid rgba(230,51,41,0.3)', borderRadius: 'var(--radius-lg)', padding: '2rem', cursor: 'pointer', maxWidth: '700px' }}
            onClick={() => navigate(`/auto/${autoFijado.id}`)}>
            {autoFijado.fotos?.[0] && (
              <img src={autoFijado.fotos[0]} alt={autoFijado.modelo} style={{ width: '200px', height: '130px', objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', marginBottom: '4px' }}>{autoFijado.marca}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', lineHeight: 1, marginBottom: '8px' }}>{autoFijado.modelo?.toUpperCase()}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray4)', marginBottom: '12px' }}>{autoFijado.anio} · {Number(autoFijado.kilometraje || 0).toLocaleString('es-AR')} km · {autoFijado.combustible}</div>
              {autoFijado.precio_ars && <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--white)' }}>${Number(autoFijado.precio_ars).toLocaleString('es-AR')}</div>}
              <div style={{ fontSize: '12px', color: 'var(--gray4)', marginTop: '4px' }}>{autoFijado.concesionarias?.nombre} · {autoFijado.concesionarias?.ciudad}</div>
            </div>
          </div>
        </div>
      )}

      {/* FEATURED CARS */}
      <div style={{ padding: '4rem', borderTop: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Lo último</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, marginBottom: '2rem' }}>VEHÍCULOS DESTACADOS</h2>
        {autos.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no hay autos publicados. ¡Sé el primero en publicar!</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
              {autos.map(a => <CarCard key={a.id} auto={a} />)}
            </div>
        }
        <div style={{ marginTop: '2rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/catalogo')}>Ver todos los vehículos →</button>
        </div>
      </div>

      {/* INSTRUCCIONES COMPRAR Y VENDER */}
      <div style={{ padding: '5rem 4rem', borderTop: '1px solid var(--gray2)', background: 'var(--black)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Guía práctica</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,52px)', lineHeight: 1, marginBottom: '2.5rem' }}>INSTRUCCIONES COMPRAR Y VENDER</h2>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '3rem', background: 'var(--gray1)', padding: '4px', borderRadius: 'var(--radius)', width: 'fit-content', border: '1px solid var(--gray2)' }}>
          {['comprar', 'vender'].map(t => (
            <button key={t} onClick={() => setTabGuia(t)}
              style={{ padding: '8px 24px', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', textTransform: 'capitalize',
                background: tabGuia === t ? 'var(--accent)' : 'transparent',
                color: tabGuia === t ? 'var(--white)' : 'var(--gray4)',
                transition: 'all .2s' }}>
              {t === 'comprar' ? 'Comprar' : 'Vender'}
            </button>
          ))}
        </div>

        {tabGuia === 'comprar' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1px', background: 'var(--gray2)' }}>
            <div style={{ background: 'var(--gray1)', padding: '2.5rem' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--white)', lineHeight: 1.3, marginBottom: '1.5rem' }}>
                Encontrá el vehículo ideal al mejor precio del mercado
              </div>
              <button className="btn-primary" style={{ fontSize: '14px', padding: '10px 24px' }} onClick={() => navigate('/catalogo')}>
                Ver catálogo →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--gray2)' }}>
              {[
                { num: '1', title: 'Explorá el catálogo', desc: 'Filtrá por marca, modelo, precio, año y ubicación para encontrar el vehículo ideal.' },
                { num: '2', title: 'Elegí la concesionaria', desc: 'Revisá el perfil de la agencia, su reputación y el stock disponible.' },
                { num: '3', title: 'Contactá y coordiná', desc: 'Escribí por WhatsApp o enviá una consulta directa. Sin intermediarios ni comisiones.' },
              ].map(p => (
                <div key={p.num} style={{ background: 'var(--gray1)', padding: '2rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', color: 'var(--accent)', opacity: .35, lineHeight: 1, marginBottom: '1.5rem' }}>{p.num}</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--white)', marginBottom: '.75rem' }}>{p.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.7 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tabGuia === 'vender' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1px', background: 'var(--gray2)' }}>
            <div style={{ background: 'var(--gray1)', padding: '2.5rem' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--white)', lineHeight: 1.3, marginBottom: '1.5rem' }}>
                Descubrí cuánto vale tu vehículo y elegí el mejor momento para vender
              </div>
              <button className="btn-primary" style={{ fontSize: '14px', padding: '10px 24px' }}
                onClick={() => concesionaria ? navigate('/panel') : user ? navigate('/mi-cuenta') : navigate('/registro')}>
                Publicar mi vehículo →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--gray2)' }}>
              {[
                { num: '1', title: 'Ingresá los datos', desc: 'Proporcioná los detalles de tu vehículo y recibí una cotización al instante.' },
                { num: '2', title: 'Elegí una oferta', desc: 'Conocé nuestras opciones y elegí la que mejor se adapte a vos.' },
                { num: '3', title: 'Agendá la inspección', desc: 'Programá la hora y el lugar que más te convenga para recibir tu pago.' },
              ].map(p => (
                <div key={p.num} style={{ background: 'var(--gray1)', padding: '2rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', color: 'var(--accent)', opacity: .35, lineHeight: 1, marginBottom: '1.5rem' }}>{p.num}</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--white)', marginBottom: '.75rem' }}>{p.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.7 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DEALERS */}
      <div style={{ padding: '4rem', borderTop: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Red de concesionarias</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, marginBottom: '2rem' }}>QUIÉNES<br />PUBLICAN</h2>
        {concesionarias.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no hay concesionarias registradas.</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1px', background: 'var(--gray2)' }}>
              {concesionarias.map((c, i) => (
                <div key={c.id} onClick={() => navigate(`/concesionaria/${c.id}`)}
                  style={{ background: 'var(--gray1)', padding: '1.5rem', cursor: 'pointer', transition: 'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#222'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--gray1)'}>
                  <LogoConcesionaria c={c} i={i} />
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{c.nombre}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '.75rem' }}>{c.ciudad}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)' }}>Ver stock →</div>
                </div>
              ))}
            </div>
        }
        <div style={{ marginTop: '2rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/concesionarias')}>Ver todas las concesionarias →</button>
        </div>
      </div>

      {/* EXPLORAR POR TIPO */}
      <div style={{ padding: '4rem', borderTop: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Catálogo</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1, marginBottom: '2.5rem' }}>EXPLORAR POR TIPO DE VEHÍCULO</h2>
        {/* Autos */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Autos</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { tipo: 'SUV',       svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="2" y="14" width="60" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M5 14 L12 5 L52 5 L59 14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="13" y="6" width="38" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'Hatchback', svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="4" y="15" width="56" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 15 L18 6 L46 6 L56 15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="19" y="7" width="26" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="16" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="48" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'Sedán',     svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="3" y="15" width="58" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M6 15 L14 7 L50 7 L58 15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="16" y="8" width="22" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="49" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'Pickup',    svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="2" y="14" width="60" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M4 14 L10 6 L32 6 L36 14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="10" y="7" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><line x1="36" y1="14" x2="36" y2="26" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'Minivan',   svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="2" y="12" width="60" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M4 12 L8 4 L56 4 L60 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="9" y="5" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="30" y="5" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'Coupé',     svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="3" y="16" width="58" height="10" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M6 16 L20 7 L44 7 L58 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="21" y="8" width="18" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="49" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
          ].map(({ tipo, svg }) => (
            <button key={tipo} onClick={() => navigate(`/catalogo?categoria=${encodeURIComponent(tipo)}`)}
              className="tipo-card"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem 2rem', background: 'var(--black)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'border-color .2s, background .2s, color .2s', minWidth: '110px', color: 'var(--gray4)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#110000'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray2)'; e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.color = 'var(--gray4)' }}>
              {svg}
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--white)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{tipo}</span>
            </button>
          ))}
        </div>

        {/* Motos */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginTop: '2.5rem', marginBottom: '0.75rem' }}>Motos</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { tipo: 'Naked',     svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><circle cx="14" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><path d="M14 20 L20 10 L36 10 L44 20 L50 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M20 10 L26 20" stroke="currentColor" strokeWidth="1.5"/><path d="M44 20 L40 12" stroke="currentColor" strokeWidth="1.5"/><path d="M26 20 L50 20" stroke="currentColor" strokeWidth="2"/><rect x="36" y="7" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> },
            { tipo: 'Deportiva', svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><circle cx="14" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><path d="M14 20 L18 8 L38 8 L48 20 L50 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M18 8 L22 20" stroke="currentColor" strokeWidth="1.5"/><path d="M38 8 L46 14" stroke="currentColor" strokeWidth="1.5"/><path d="M22 20 L50 20" stroke="currentColor" strokeWidth="2"/><path d="M38 8 L42 5 L50 8 L46 14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
            { tipo: 'Touring',   svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><circle cx="14" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><path d="M14 20 L20 9 L36 9 L44 20 L50 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M20 9 L26 20" stroke="currentColor" strokeWidth="1.5"/><path d="M26 20 L50 20" stroke="currentColor" strokeWidth="2"/><rect x="36" y="6" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="44" y="18" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="13" y="18" width="7" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> },
            { tipo: 'Scooter',   svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><circle cx="12" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><path d="M12 20 L16 12 L28 10 L36 12 L44 20 L50 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M28 10 L30 20" stroke="currentColor" strokeWidth="1.5"/><path d="M30 20 L44 20" stroke="currentColor" strokeWidth="2"/><path d="M16 12 L12 20" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="28" cy="10" rx="6" ry="3" stroke="currentColor" strokeWidth="1.5"/></svg> },
            { tipo: 'Enduro',    svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><circle cx="14" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><path d="M14 20 L22 7 L34 7 L44 20 L50 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M22 7 L26 20" stroke="currentColor" strokeWidth="1.5"/><path d="M26 20 L50 20" stroke="currentColor" strokeWidth="2"/><path d="M34 7 L42 11" stroke="currentColor" strokeWidth="1.5"/><rect x="34" y="4" width="10" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> },
            { tipo: 'Custom',    svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><circle cx="14" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><circle cx="52" cy="27" r="7" stroke="currentColor" strokeWidth="2"/><path d="M14 20 L22 14 L38 14 L48 20 L52 20" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M22 14 L20 20" stroke="currentColor" strokeWidth="1.5"/><path d="M20 20 L48 20" stroke="currentColor" strokeWidth="2"/><path d="M38 14 L44 10" stroke="currentColor" strokeWidth="2"/><path d="M44 10 L50 12" stroke="currentColor" strokeWidth="2"/></svg> },
          ].map(({ tipo, svg }) => (
            <button key={tipo} onClick={() => navigate(`/catalogo?categoria=${encodeURIComponent(tipo)}`)}
              className="tipo-card"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem 2rem', background: 'var(--black)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'border-color .2s, background .2s, color .2s', minWidth: '110px', color: 'var(--gray4)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#110000'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray2)'; e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.color = 'var(--gray4)' }}>
              {svg}
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--white)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{tipo}</span>
            </button>
          ))}
        </div>

        {/* Náutica */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginTop: '2.5rem', marginBottom: '0.75rem' }}>Náutica</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { tipo: 'Lancha',     svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><path d="M4 24 L10 14 L52 14 L60 24 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M4 24 Q32 30 60 24" stroke="currentColor" strokeWidth="2"/><rect x="14" y="9" width="22" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><line x1="44" y1="14" x2="44" y2="8" stroke="currentColor" strokeWidth="1.5"/><path d="M44 8 L52 14" stroke="currentColor" strokeWidth="1.5"/></svg> },
            { tipo: 'Velero',     svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><path d="M8 28 Q32 32 56 28" stroke="currentColor" strokeWidth="2"/><path d="M8 28 L16 22 L56 28" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><line x1="32" y1="28" x2="32" y2="4" stroke="currentColor" strokeWidth="2"/><path d="M32 4 L32 24 L10 18 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M32 6 L32 22 L50 14 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
            { tipo: 'Yate',       svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><path d="M4 26 L10 16 L54 16 L60 26 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M4 26 Q32 32 60 26" stroke="currentColor" strokeWidth="2"/><rect x="10" y="10" width="30" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="42" y="12" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><line x1="18" y1="10" x2="18" y2="5" stroke="currentColor" strokeWidth="1.5"/><line x1="30" y1="10" x2="30" y2="5" stroke="currentColor" strokeWidth="1.5"/></svg> },
            { tipo: 'Moto de Agua', svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><path d="M6 24 L14 16 L46 16 L58 24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M6 24 Q32 30 58 24" stroke="currentColor" strokeWidth="2"/><path d="M20 16 L24 10 L40 10 L44 16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="28" cy="13" r="2" stroke="currentColor" strokeWidth="1.5"/></svg> },
            { tipo: 'Semi-rígido', svg: <svg viewBox="0 0 64 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:36}}><path d="M6 26 L12 18 L52 18 L58 26" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M6 26 Q32 32 58 26" stroke="currentColor" strokeWidth="2"/><ellipse cx="10" cy="23" rx="4" ry="5" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="54" cy="23" rx="4" ry="5" stroke="currentColor" strokeWidth="1.5"/><rect x="22" y="13" width="20" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg> },
          ].map(({ tipo, svg }) => (
            <button key={tipo} onClick={() => navigate(`/catalogo?categoria=${encodeURIComponent(tipo)}`)}
              className="tipo-card"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem 2rem', background: 'var(--black)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'border-color .2s, background .2s, color .2s', minWidth: '110px', color: 'var(--gray4)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#110000'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray2)'; e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.color = 'var(--gray4)' }}>
              {svg}
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--white)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{tipo}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* FOOTER ÚNICO Y PROFESIONAL */}
      <footer style={{ background: '#050505', borderTop: '1px solid var(--gray2)', padding: '5rem 4rem 2rem', color: 'var(--gray4)', fontSize: '13px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: 'var(--white)', marginBottom: '1rem' }}>
              FIORA.<span style={{ color: 'var(--accent)' }}>MARKET</span>
            </div>
            <p style={{ lineHeight: 1.6, marginBottom: '1.5rem' }}>
              La plataforma más avanzada para encontrar y publicar vehículos de agencias verificadas en Argentina.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Explorar</div>
            <Link to="/catalogo" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Catálogo de Vehículos</Link>
            <Link to="/concesionarias" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Red de Concesionarias</Link>
            <Link to="/planes" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Planes y Precios</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Legales</div>
            <Link to="/legales" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Términos y Condiciones</Link>
            <Link to="/legales" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Políticas de Privacidad</Link>
            <Link to="/arrepentimiento" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Botón de Arrepentimiento</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Contacto</div>
            <div style={{ color: 'var(--gray4)', fontSize: '14px' }}>Salta, Argentina</div>
            <div style={{ color: 'var(--gray4)', fontSize: '14px' }}>contacto@fioramarket.store</div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <a href="https://www.instagram.com/fiora.market" target="_blank" rel="noopener noreferrer" 
                 style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', textDecoration: 'none', transition: 'background .2s' }}
                 onMouseEnter={e => e.currentTarget.style.background = '#E1306C'} 
                 onMouseLeave={e => e.currentTarget.style.background = 'var(--gray2)'}>
                <i className="fab fa-instagram"></i> ig
              </a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>© 2026 FIORA.MARKET — Salta, Argentina</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="#" style={{ color: 'var(--gray4)', textDecoration: 'none', fontSize: '11px' }}>Defensa del Consumidor</a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '30px', height: '40px', background: 'var(--gray2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', textAlign: 'center', lineHeight: 1 }}>DATA<br/>FISCAL</div>
              <span style={{ fontSize: '11px' }}>Sitio Seguro</span>
            </div>
          </div>
        </div>
      </footer>