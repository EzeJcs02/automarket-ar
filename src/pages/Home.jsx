import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'
import CarCardSkeleton from '../components/CarCardSkeleton'
import { setPageMeta } from '../lib/seo'
import { GuiaBoton } from '../components/GuiaModal'

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
  const [loading, setLoading] = useState(true)
  const [configMissing] = useState(!import.meta.env.VITE_SUPABASE_URL)

  useEffect(() => {
    setPageMeta({ title: null, description: 'La plataforma de vehículos más avanzada de Argentina. Miles de autos, motos y náutica de concesionarias verificadas.', path: '/' })
    
    const fetchAll = async () => {
      try {
        const [rAutos, rConc, rBanners, rAds, rFijado] = await Promise.all([
          supabase.from('autos').select('*, concesionarias(nombre, ciudad)').eq('activo', true).limit(50).order('created_at', { ascending: false }),
          supabase.from('concesionarias').select('*').eq('aprobada', true).limit(6),
          supabase.from('concesionarias').select('id, nombre, portada_url').eq('banner_activo', true).limit(10),
          supabase.from('publicidades').select('id, nombre, imagen_url, link_url, fondo').eq('activo', true).order('created_at', { ascending: false }),
          supabase.from('autos').select('*, concesionarias(nombre, ciudad)').eq('fijado_home', true).limit(1)
        ])
        
        const planScore = { premium: 1000, pro: 100, basico: 10 }
        const sorted = (rAutos.data || []).sort((a, b) => {
          if (a.urgente !== b.urgente) return (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0)
          if (a.destacado !== b.destacado) return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0)
          const sa = planScore[a.concesionarias?.plan] || 0
          const sb = planScore[b.concesionarias?.plan] || 0
          if (sb !== sa) return sb - sa
          return new Date(b.created_at) - new Date(a.created_at)
        })
        setAutos(sorted.slice(0, 6))
        setConcesionarias(rConc.data || [])
        setBanners(rBanners.data || [])
        setRightAds(rAds.data || [])
        setAutoFijado(rFijado.data?.[0] || null)
      } catch (err) {
        console.error("Error fetching home data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  useEffect(() => {
    if (rightAds.length <= 1) return
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
      {configMissing && (
        <div style={{ background: 'var(--accent)', color: 'white', padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 600, position: 'sticky', top: '58px', zIndex: 1000 }}>
          ⚠️ Configuración de Supabase incompleta. Revisa tu archivo .env para ver los vehículos reales.
        </div>
      )}

      {/* HERO + ADS DERECHA */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
        {/* Backgrounds */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: .04, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px)' }} />
        <div style={{ position: 'absolute', top: '-100px', right: '200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.15) 0%, transparent 70%)' }} />

        {/* Hero content */}
        <div className="home-hero responsive-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', paddingTop: '6rem', position: 'relative' }}>
          <div className="animate-fade-in" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Plataforma N°1 de vehículos en Argentina
          </div>
          <h1 className="animate-fade-in delay-1" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(60px,8vw,130px)', lineHeight: 1.05, letterSpacing: '2px', marginBottom: '2rem' }}>
            ENCONTRÁ<br />TU PRÓXIMO<br /><span style={{ color: 'var(--accent)' }}>VEHÍCULO</span>
          </h1>
          <p className="animate-fade-in delay-2" style={{ fontSize: '17px', color: 'var(--gray4)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '3rem' }}>
            Miles de vehículos nuevos y usados de las mejores concesionarias de Argentina. Filtrá, compará y contactá directo.
          </p>
          <div className="animate-fade-in delay-3" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '15px', padding: '14px 32px' }} onClick={() => navigate('/catalogo')}>Ver catálogo completo</button>
            <button className="btn-secondary" style={{ fontSize: '15px', padding: '14px 32px' }} onClick={() => navigate('/concesionarias')}>Ver concesionarias</button>
          </div>
          <div className="home-stats" style={{ display: 'flex', gap: '3rem', marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--gray2)' }}>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.length > 0 ? `${autos.length}+` : '—'}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Vehículos publicados</div></div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{concesionarias.length > 0 ? concesionarias.length : '—'}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Concesionarias</div></div>
          </div>
        </div>

        {/* ADS DERECHA — cycling crossfade */}
        <div className="hero-ads-right" style={{ flex: '0 0 38%', minWidth: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--gray2)', position: 'relative', background: '#050505' }}>
          <div style={{ fontSize: '9px', color: 'var(--gray3)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em', textAlign: 'center', padding: '8px 0 4px', borderBottom: '1px solid var(--gray2)', textTransform: 'uppercase', flexShrink: 0 }}>Publicidad</div>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {rightAds.length > 0 ? rightAds.map((ad, i) => (
              <div key={ad.id}
                onClick={() => ad.link_url && window.open(ad.link_url, '_blank', 'noopener')}
                style={{
                  position: 'absolute', inset: 0,
                  opacity: i === rightIdx ? 1 : 0,
                  transition: 'opacity .8s ease-in-out',
                  pointerEvents: i === rightIdx ? 'auto' : 'none',
                  cursor: ad.link_url ? 'pointer' : 'default',
                  backgroundColor: ad.fondo === 'claro' ? '#fff' : '#0a0a0a',
                  backgroundImage: `url(${ad.imagen_url})`,
                  backgroundSize: '85%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }} />
            )) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '9px', color: '#2a2a2a', textTransform: 'uppercase', letterSpacing: '.12em', fontFamily: 'var(--font-mono)', textAlign: 'center', lineHeight: 1.8 }}>ESPACIO<br/>PUBLICITARIO</div>
              </div>
            )}
            {rightAds.length > 1 && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', height: '3px' }}>
                {rightAds.map((_, i) => (
                  <div key={i} onClick={() => setRightIdx(i)}
                    style={{ flex: 1, height: '100%', background: 'rgba(255,255,255,.12)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                    {i === rightIdx && (
                      <div key={`fill-${rightIdx}`} style={{ position: 'absolute', inset: 0, background: 'var(--accent)', transformOrigin: 'left', animation: 'progressFill 3.5s linear forwards' }} />
                    )}
                    {i < rightIdx && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.35)' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PUBLICIDAD INFERIOR — 1 banner dinámico cycling */}
      <div style={{ borderBottom: '1px solid var(--gray2)', background: '#050505' }}>
        <div style={{ fontSize: '10px', color: 'var(--gray3)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em', padding: '8px 2rem 6px', textTransform: 'uppercase' }}>Publicidad</div>
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
          {banners.length > 0 ? banners.map((b, i) => (
            <div key={b.id}
              onClick={() => navigate(`/concesionaria/${b.id}`)}
              style={{ position: 'absolute', inset: 0, opacity: i === bottomIdx ? 1 : 0, transition: 'opacity .8s ease-in-out', pointerEvents: i === bottomIdx ? 'auto' : 'none', cursor: 'pointer' }}>
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f0f0f 0%, #1a0a0a 50%, #0f0f0f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(230,51,41,.12) 0%, transparent 70%)' }} />
                <img src="/fiora_logo.png" alt="logo" style={{ height: '32px', opacity: 0.4, position: 'relative' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,3vw,32px)', color: 'var(--white)', letterSpacing: '.05em', textAlign: 'center', padding: '0 2rem', position: 'relative' }}>{b.nombre}</div>
                <div style={{ fontSize: '10px', color: 'var(--gray3)', fontFamily: 'var(--font-mono)', letterSpacing: '.15em', textTransform: 'uppercase', position: 'relative' }}>Concesionaria verificada</div>
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,.35) 0%, transparent 40%, transparent 60%, rgba(0,0,0,.35) 100%)' }} />
            </div>
          )) : (
            <div style={{ width: '100%', height: '100%', border: '1px dashed var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray3)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Espacio publicitario</div>
              <div style={{ fontSize: '10px', color: 'var(--gray2)', fontFamily: 'var(--font-mono)' }}>Hasta 10 banners · cycling automático</div>
            </div>
          )}
          {banners.length > 1 && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', height: '3px' }}>
              {banners.map((_, i) => (
                <div key={i} onClick={() => setBottomIdx(i)}
                  style={{ flex: 1, height: '100%', background: 'rgba(255,255,255,.12)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                  {i === bottomIdx && (
                    <div key={`fill-${bottomIdx}`} style={{ position: 'absolute', inset: 0, background: 'var(--white)', transformOrigin: 'left', animation: 'progressFill 4s linear forwards' }} />
                  )}
                  {i < bottomIdx && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.4)' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VEHÍCULO FIJADO */}
      {autoFijado && (
        <div className="home-section responsive-section" style={{ padding: '3rem 4rem', borderBottom: '1px solid var(--gray2)', background: 'rgba(230,51,41,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#c9a84c', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-block', width: '24px', height: '1px', background: '#c9a84c', flexShrink: 0 }} />
            Vehículo destacado del día
          </div>
          <div className="home-fijado-card" style={{ display: 'flex', gap: '2rem', alignItems: 'center', background: 'var(--gray1)', border: '1px solid rgba(230,51,41,0.3)', borderRadius: 'var(--radius-lg)', padding: '2rem', cursor: 'pointer', maxWidth: '700px', transition: 'border-color .25s, box-shadow .25s, transform .25s' }}
            onClick={() => navigate(`/auto/${autoFijado.id}`)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(230,51,41,0.8)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(230,51,41,0.18)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(230,51,41,0.3)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
            {autoFijado.fotos?.[0] && (
              <img src={autoFijado.fotos[0]} alt={autoFijado.modelo} className="home-fijado-img" style={{ width: '200px', height: '130px', objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0, transition: 'transform .25s' }} />
            )}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', marginBottom: '4px' }}>{autoFijado.marca}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', lineHeight: 1, marginBottom: '8px' }}>{autoFijado.modelo?.toUpperCase()}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray4)', marginBottom: '12px' }}>{autoFijado.anio} · {Number(autoFijado.kilometraje || 0).toLocaleString('es-AR')} km · {autoFijado.combustible}</div>
              {autoFijado.precio_ars && <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--white)' }}>${Number(autoFijado.precio_ars).toLocaleString('es-AR')}</div>}
              <div style={{ fontSize: '12px', color: 'var(--gray4)', marginTop: '4px' }}>{autoFijado.concesionarias?.nombre} · {autoFijado.concesionarias?.ciudad}</div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', letterSpacing: '.08em' }}>Ver detalle →</div>
            </div>
          </div>
        </div>
      )}

      {/* FEATURED CARS */}
      <div className="home-section responsive-section" style={{ padding: '4rem', borderTop: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Lo último</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, marginBottom: '2rem' }}>VEHÍCULOS DESTACADOS</h2>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => <CarCardSkeleton key={i} />)}
          </div>
        ) : autos.length === 0 ? (
          <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no hay autos publicados. ¡Sé el primero en publicar!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1px', background: 'var(--gray2)' }}>
            {autos.map(a => <CarCard key={a.id} auto={a} />)}
          </div>
        )}
        <div style={{ marginTop: '2rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/catalogo')}>Ver todos los vehículos →</button>
        </div>
      </div>

      {/* INSTRUCCIONES COMPRAR Y VENDER */}
      <div className="animate-fade-in home-section responsive-section" style={{ padding: '5rem 4rem', borderTop: '1px solid var(--gray2)', background: 'var(--black)' }}>

        {/* Header + tabs en misma fila */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Guía práctica</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,52px)', lineHeight: 1, margin: 0 }}>CÓMO FUNCIONA</h2>
          </div>
          {/* TABS underline */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--gray2)' }}>
            {['comprar', 'vender'].map(t => (
              <button key={t} onClick={() => setTabGuia(t)}
                style={{ padding: '10px 28px', background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: tabGuia === t ? 'var(--white)' : 'var(--gray4)',
                  borderBottom: `2px solid ${tabGuia === t ? 'var(--accent)' : 'transparent'}`,
                  marginBottom: '-1px', transition: 'all .2s' }}>
                {t === 'comprar' ? 'Comprar' : 'Vender'}
              </button>
            ))}
          </div>
        </div>

        <div key={tabGuia} className="animate-fade-in">
          {(() => {
            const isComprar = tabGuia === 'comprar'
            const steps = isComprar
              ? [
                  { num: '01', title: 'Explorá el catálogo', desc: 'Filtrá por marca, modelo, precio, año y ubicación para encontrar el vehículo ideal.' },
                  { num: '02', title: 'Elegí la concesionaria', desc: 'Revisá el perfil de la agencia, su reputación y el stock disponible.' },
                  { num: '03', title: 'Contactá y coordiná', desc: 'Escribí por WhatsApp o enviá una consulta directa. Sin intermediarios ni comisiones.' },
                ]
              : [
                  { num: '01', title: 'Ingresá los datos', desc: 'Completá los detalles de tu vehículo: marca, modelo, año, km y estado.' },
                  { num: '02', title: 'Publicá tu vehículo', desc: 'Sumá fotos y precio. Tu publicación llega a miles de compradores en minutos.' },
                  { num: '03', title: 'Coordiná la venta', desc: 'Respondé consultas y cerrá el trato directamente con el interesado.' },
                ]
            return (
              <div className="home-guide-inner" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1px', background: 'var(--gray2)' }}>
                {/* Panel izquierdo */}
                <div style={{ background: 'var(--gray1)', padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '2rem', borderLeft: '3px solid var(--accent)' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                      {isComprar ? 'Para compradores' : 'Para vendedores'}
                    </div>
                    <div style={{ fontSize: '21px', fontWeight: 700, color: 'var(--white)', lineHeight: 1.35 }}>
                      {isComprar
                        ? 'Encontrá el vehículo ideal al mejor precio del mercado'
                        : 'Publicá tu vehículo y llegá a miles de compradores'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn-primary hover-lift" style={{ fontSize: '14px', padding: '10px 24px' }}
                      onClick={() => isComprar ? navigate('/catalogo') : (concesionaria ? navigate('/panel') : user ? navigate('/mi-cuenta') : navigate('/registro'))}>
                      {isComprar ? 'Ver catálogo →' : 'Publicar vehículo →'}
                    </button>
                    <GuiaBoton seccion={isComprar ? 'compradores' : 'vendedores'} />
                  </div>
                </div>

                {/* Steps */}
                <div className="home-guide-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--gray2)' }}>
                  {steps.map((p, idx) => (
                    <div key={p.num} className="step-card" style={{ background: 'var(--gray1)', padding: '2.5rem 2rem', position: 'relative' }}>
                      {/* Conector horizontal entre steps */}
                      {idx < 2 && (
                        <div style={{ position: 'absolute', top: '2.5rem', right: 0, width: '1px', height: '28px', background: 'var(--gray2)' }} />
                      )}
                      {/* Número */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(230,51,41,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
                          {p.num}
                        </div>
                        {idx < 2 && <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(230,51,41,.3), transparent)' }} />}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--white)', marginBottom: '.75rem', lineHeight: 1.3 }}>{p.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.75 }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* DEALERS */}
      <div className="animate-fade-in home-section responsive-section" style={{ padding: '4rem', borderTop: '1px solid var(--gray2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Red de concesionarias</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, margin: 0 }}>QUIÉNES<br />PUBLICAN</h2>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/concesionarias')} style={{ flexShrink: 0 }}>Ver todas →</button>
        </div>
        {concesionarias.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no hay concesionarias registradas.</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
              {concesionarias.map((c, i) => {
                const isPremium = c.plan === 'premium'
                const isPro = c.plan === 'pro'
                const cardColor = colors[i % colors.length]
                return (
                  <div key={c.id} onClick={() => navigate(`/concesionaria/${c.id}`)}
                    className="dealer-card"
                    style={{ background: 'var(--gray1)', border: `1px solid ${isPremium ? 'rgba(230,51,41,.3)' : 'var(--gray2)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color .2s, transform .15s, box-shadow .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = isPremium ? 'rgba(230,51,41,.6)' : 'var(--gray3)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = isPremium ? 'rgba(230,51,41,.3)' : 'var(--gray2)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {/* Banner */}
                    <div style={{ height: '64px', background: c.portada_url ? `url(${c.portada_url}) center/cover` : `linear-gradient(135deg, ${isPremium ? 'rgba(230,51,41,.25)' : cardColor + '22'} 0%, #0d0d0d 100%)`, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: `radial-gradient(circle, ${isPremium ? 'rgba(230,51,41,.18)' : cardColor + '18'} 0%, transparent 70%)`, pointerEvents: 'none' }} />
                    </div>
                    {/* Body */}
                    <div style={{ padding: '0 1.25rem 1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-22px', marginBottom: '8px' }}>
                        <div style={{ padding: '2px', background: 'var(--gray1)', borderRadius: 'calc(var(--radius) + 3px)', border: '2px solid var(--gray1)', lineHeight: 0 }}>
                          <LogoConcesionaria c={c} i={i} size={44} fontSize={20} />
                        </div>
                        {(isPremium || isPro) && (
                          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '.12em', padding: '3px 8px', borderRadius: '100px', flexShrink: 0, marginBottom: '2px', background: isPremium ? 'rgba(230,51,41,.15)' : 'rgba(201,168,76,.15)', color: isPremium ? 'var(--accent)' : '#c9a84c', border: `1px solid ${isPremium ? 'rgba(230,51,41,.3)' : 'rgba(201,168,76,.3)'}` }}>
                            {isPremium ? 'PREMIUM' : 'PRO'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>{c.nombre}</div>
                      {c.ciudad && (
                        <div style={{ fontSize: '11px', color: 'var(--gray4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {c.ciudad}
                        </div>
                      )}
                    </div>
                    {/* Footer */}
                    <div style={{ padding: '0.625rem 1.25rem', borderTop: '1px solid var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '.06em', color: c.destacada ? '#c9a84c' : 'var(--gray4)' }}>
                        {c.destacada ? '✓ VERIFICADA' : 'AGENCIA'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Ver stock
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
        }
      </div>

      {/* EXPLORAR POR TIPO */}
      <div className="animate-fade-in home-section responsive-section" style={{ padding: '4rem', borderTop: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Catálogo</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1, marginBottom: '2.5rem' }}>EXPLORAR POR TIPO DE VEHÍCULO</h2>
        {/* Autos */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Autos</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { tipo: 'SUV',       img: '/assets/tipos/icon_suv.png' },
            { tipo: 'Hatchback', img: '/assets/tipos/icon_hatchback.png' },
            { tipo: 'Sedán',     img: '/assets/tipos/icon_sedan.png' },
            { tipo: 'Pickup',    img: '/assets/tipos/icon_pickup.png' },
            { tipo: 'Minivan',   img: '/assets/tipos/icon_minivan.png' },
            { tipo: 'Coupé',     img: '/assets/tipos/icon_coupe.png' },
          ].map(({ tipo, img }) => (
            <button key={tipo} onClick={() => navigate(`/catalogo?categoria=${encodeURIComponent(tipo)}`)}
              className="type-card"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem 2rem', background: 'var(--black)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', minWidth: '130px', color: 'var(--white)', flex: '1 1 130px' }}>
              <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={img} alt={tipo} style={{ maxWidth: '110px', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.8))', borderRadius: '8px' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{tipo}</span>
            </button>
          ))}
        </div>

        {/* Motos */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginTop: '2.5rem', marginBottom: '0.75rem' }}>Motos</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { tipo: 'Naked',     img: '/assets/tipos/icon_moto_naked.png' },
            { tipo: 'Deportiva', img: '/assets/tipos/icon_moto_deportiva.png' },
            { tipo: 'Touring',   img: '/assets/tipos/icon_moto_touring.png' },
            { tipo: 'Scooter',   img: '/assets/tipos/icon_moto_scooter.png' },
            { tipo: 'Enduro',    img: '/assets/tipos/icon_moto_enduro.png' },
            { tipo: 'Custom',    img: '/assets/tipos/icon_moto_custom.png' },
          ].map(({ tipo, img }) => (
            <button key={tipo} onClick={() => navigate(`/catalogo?categoria=${encodeURIComponent(tipo)}`)}
              className="type-card"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem 2rem', background: 'var(--black)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', minWidth: '130px', color: 'var(--white)', flex: '1 1 130px' }}>
              <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={img} alt={tipo} style={{ maxWidth: '110px', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.8))', borderRadius: '8px' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{tipo}</span>
            </button>
          ))}
        </div>

        {/* Náutica */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginTop: '2.5rem', marginBottom: '0.75rem' }}>Náutica</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { tipo: 'Lancha',       img: '/assets/tipos/icon_nautica_lancha.png' },
            { tipo: 'Velero',       img: '/assets/tipos/icon_nautica_velero.png' },
            { tipo: 'Yate',         img: '/assets/tipos/icon_nautica_yate.png' },
            { tipo: 'Moto de Agua', img: '/assets/tipos/icon_nautica_motoagua.png' },
            { tipo: 'Semi-rígido',  img: '/assets/tipos/icon_nautica_semirigido.png' },
          ].map(({ tipo, img }) => (
            <button key={tipo} onClick={() => navigate(`/catalogo?categoria=${encodeURIComponent(tipo)}`)}
              className="type-card"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem 2rem', background: 'var(--black)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', minWidth: '130px', color: 'var(--white)', flex: '1 1 130px' }}>
              <div style={{ height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={img} alt={tipo} style={{ maxWidth: '110px', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.8))', borderRadius: '8px' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{tipo}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}