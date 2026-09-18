import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'
import HomeHero from '../components/HomeHero'
import './Home.css'
import CarCardSkeleton from '../components/CarCardSkeleton'
import { setPageMeta } from '../lib/seo'
import { GuiaBoton } from '../components/GuiaModal'

const TIPOS = {
  autos: [
    { tipo: 'SUV', img: '/assets/tipos/icon_suv.png' },
    { tipo: 'Hatchback', img: '/assets/tipos/icon_hatchback.png' },
    { tipo: 'Sedán', img: '/assets/tipos/icon_sedan.png' },
    { tipo: 'Pickup', img: '/assets/tipos/icon_pickup.png' },
    { tipo: 'Minivan', img: '/assets/tipos/icon_minivan.png' },
    { tipo: 'Coupé', img: '/assets/tipos/icon_coupe.png' },
  ],
  motos: [
    { tipo: 'Naked', img: '/assets/tipos/icon_moto_naked.png' },
    { tipo: 'Deportiva', img: '/assets/tipos/icon_moto_deportiva.png' },
    { tipo: 'Touring', img: '/assets/tipos/icon_moto_touring.png' },
    { tipo: 'Scooter', img: '/assets/tipos/icon_moto_scooter.png' },
    { tipo: 'Enduro', img: '/assets/tipos/icon_moto_enduro.png' },
    { tipo: 'Custom', img: '/assets/tipos/icon_moto_custom.png' },
  ],
  nautica: [
    { tipo: 'Lancha', img: '/assets/tipos/icon_nautica_lancha.png' },
    { tipo: 'Velero', img: '/assets/tipos/icon_nautica_velero.png' },
    { tipo: 'Yate', img: '/assets/tipos/icon_nautica_yate.png' },
    { tipo: 'Moto de Agua', img: '/assets/tipos/icon_nautica_motoagua.png' },
    { tipo: 'Semi-rígido', img: '/assets/tipos/icon_nautica_semirigido.png' },
  ],
}

export default function Home() {
  const navigate = useNavigate()
  const { user, concesionaria } = useAuth()
  const [autos, setAutos] = useState([])
  const [concesionarias, setConcesionarias] = useState([])
  const [tabGuia, setTabGuia] = useState('comprar')
  const [tipoCategoria, setTipoCategoria] = useState('autos')
  const [banners, setBanners] = useState([])
  const [rightAds, setRightAds] = useState([])
  const [autoFijado, setAutoFijado] = useState(null)
  const [rightIdx, setRightIdx] = useState(0)
  const [bottomIdx, setBottomIdx] = useState(0)
  const [adsPaused, setAdsPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [loading, setLoading] = useState(true)
  const [configMissing] = useState(!import.meta.env.VITE_SUPABASE_URL)

  useEffect(() => {
    setPageMeta({ title: null, description: 'La plataforma de vehículos más avanzada de Argentina. Miles de autos, motos y náutica de concesionarias verificadas.', path: '/' })

    const fetchAll = async () => {
      try {
        const [rAutos, rConc, rBanners, rAds, rFijado] = await Promise.all([
          supabase.from('autos').select('*, concesionarias(nombre, ciudad)').eq('activo', true).or('urgente.eq.true,destacado.eq.true').limit(6).order('created_at', { ascending: false }),
          supabase.from('concesionarias').select('*').eq('aprobada', true).limit(6),
          supabase.from('concesionarias').select('id, nombre, portada_url').eq('banner_activo', true).limit(10),
          supabase.from('publicidades').select('id, nombre, imagen_url, link_url, fondo').eq('activo', true).order('created_at', { ascending: false }),
          supabase.from('autos').select('*, concesionarias(nombre, ciudad)').eq('fijado_home', true).limit(1)
        ])

        const sorted = (rAutos.data || []).sort((a, b) => {
          if (a.urgente !== b.urgente) return (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0)
          return new Date(b.created_at) - new Date(a.created_at)
        })
        setAutos(sorted)
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
    if (rightAds.length <= 1 || adsPaused) return
    const t = setInterval(() => setRightIdx(i => (i + 1) % rightAds.length), 3500)
    return () => clearInterval(t)
  }, [rightAds.length, adsPaused])

  useEffect(() => {
    if (banners.length <= 1 || adsPaused) return
    const t = setInterval(() => setBottomIdx(i => (i + 1) % Math.max(banners.length, 1)), 4000)
    return () => clearInterval(t)
  }, [banners.length, adsPaused])

  const colors = ['var(--accent)', '#1a7a4a', '#185FA5', '#c9a84c', '#7F77DD', '#D85A30']

  function LogoConcesionaria({ c, i, size = 46, fontSize = 22 }) {
    if (c.logo_url) {
      return (
        <img src={c.logo_url} alt={c.nombre}
          style={{ width: size, height: size, borderRadius: 'var(--radius)', objectFit: 'cover', flexShrink: 0 }} />
      )
    }
    return (
      <div style={{ width: size, height: size, borderRadius: 'var(--radius)', background: colors[i % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize, flexShrink: 0 }}>
        {c.nombre?.[0]?.toUpperCase()}
      </div>
    )
  }

  const guiaData = {
    comprar: {
      para: 'Para compradores',
      headline: 'Encontrá el vehículo ideal al mejor precio del mercado',
      cta: 'Ver catálogo →',
      steps: [
        { num: '01', title: 'Explorá el catálogo', desc: 'Filtrá por marca, modelo, precio, año y ubicación para encontrar el vehículo ideal.' },
        { num: '02', title: 'Elegí la concesionaria', desc: 'Revisá el perfil de la agencia, su reputación y el stock disponible.' },
        { num: '03', title: 'Contactá y coordiná', desc: 'Escribí por WhatsApp o enviá una consulta directa. Sin intermediarios ni comisiones.' },
      ],
    },
    vender: {
      para: 'Para vendedores',
      headline: 'Publicá tu vehículo y llegá a miles de compradores',
      cta: 'Publicar vehículo →',
      steps: [
        { num: '01', title: 'Ingresá los datos', desc: 'Completá los detalles de tu vehículo: marca, modelo, año, km y estado.' },
        { num: '02', title: 'Publicá tu vehículo', desc: 'Sumá fotos y precio. Tu publicación llega a miles de compradores en minutos.' },
        { num: '03', title: 'Coordiná la venta', desc: 'Respondé consultas y cerrá el trato directamente con el interesado.' },
      ],
    },
  }
  const guiaActual = guiaData[tabGuia]
  const isComprar = tabGuia === 'comprar'

  return (
    <div className="market-home">
      {configMissing && (
        <div style={{ background: 'var(--accent)', color: 'white', padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: 600, position: 'sticky', top: '58px', zIndex: 1000 }}>
          ⚠️ Configuración de Supabase incompleta. Revisa tu archivo .env para ver los vehículos reales.
        </div>
      )}

      <HomeHero />

      {(rightAds.length > 0 || banners.length > 0) && (
        <aside className="market-partners" aria-label="Publicidad">
          <div className="market-partners-label"><span>ESPACIO PUBLICITARIO</span><strong>Conectá con los que <br />conocen el camino.</strong><Link to="/publicitate">Tu marca, acá ↗</Link>
            {(rightAds.length > 1 || banners.length > 1) && <button className="market-ad-pause" onClick={() => setAdsPaused(!adsPaused)}>{adsPaused ? 'Reanudar publicidad' : 'Pausar publicidad'}</button>}
          </div>
          {rightAds.length > 0 && (
            <div className="market-ad">
              {rightAds.map((ad, i) => (
                <a key={ad.id} href={ad.link_url || undefined} target="_blank" rel="noopener noreferrer" tabIndex={i === rightIdx ? 0 : -1} aria-hidden={i !== rightIdx} className={i === rightIdx ? 'is-active' : ''} style={{ background: ad.fondo === 'claro' ? '#fff' : '#101113' }}>
                  <img src={ad.imagen_url} alt={ad.nombre} loading="lazy" />
                </a>
              ))}
              {rightAds.length > 1 && <div className="market-ad-dots">{rightAds.map((ad, i) => <button key={ad.id} aria-label={`Ver publicidad de ${ad.nombre}`} aria-pressed={i === rightIdx} onClick={() => setRightIdx(i)} />)}</div>}
            </div>
          )}
          {banners.length > 0 && (
            <div className="market-banner">
              <span>CONCESIONARIA DESTACADA</span>
              <Link to={`/concesionaria/${banners[bottomIdx]?.id}`}><strong>{banners[bottomIdx]?.nombre}</strong><span>Conocé sus vehículos →</span></Link>
            </div>
          )}
        </aside>
      )}

      {/* VEHÍCULO FIJADO */}
      {autoFijado && (
        <div className="home-section responsive-section" style={{ padding: '3rem 4rem', borderBottom: '1px solid var(--gray2)', background: 'rgba(230,51,41,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#c9a84c', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-block', width: '24px', height: '1px', background: '#c9a84c', flexShrink: 0 }} />
            Vehículo destacado del día
          </div>
          <div className="home-fijado-card" onClick={() => navigate(`/auto/${autoFijado.id}`)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/auto/${autoFijado.id}`) } }}
            role="link" tabIndex={0} aria-label={`Ver ${autoFijado.marca} ${autoFijado.modelo}`}>
            <div className="home-fijado-card__media">
              {autoFijado.fotos?.[0]
                ? <img src={autoFijado.fotos[0]} alt={autoFijado.modelo} />
                : <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--gray3)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2v-4l2.5-6h13L19 11v4a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>}
            </div>
            <div className="home-fijado-card__body">
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
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Lo último</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3vw,40px)', lineHeight: 1.1, margin: 0 }}>Encontrá tu próximo vehículo</h2>
          </div>
        </div>
        {loading ? (
          <div className="market-vehicle-grid">
            {[1, 2, 3, 4, 5, 6].map(i => <CarCardSkeleton key={i} />)}
          </div>
        ) : autos.length === 0 ? (
          <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no hay autos publicados. ¡Sé el primero en publicar!</p>
        ) : (
          <div className="market-vehicle-grid">
            {autos.map(a => <CarCard key={a.id} auto={a} />)}
          </div>
        )}
        <div style={{ marginTop: '2rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/catalogo')}>Ver todos los vehículos →</button>
        </div>
      </div>

      {/* INSTRUCCIONES COMPRAR Y VENDER */}
      <div className="animate-fade-in home-section responsive-section" style={{ padding: '5rem 4rem', borderTop: '1px solid var(--gray2)', background: 'var(--black)' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Guía práctica</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3vw,36px)', lineHeight: 1.1, margin: 0 }}>CÓMO FUNCIONA</h2>
          </div>
          <div className="market-pill-tabs">
            {['comprar', 'vender'].map(t => (
              <button key={t} onClick={() => setTabGuia(t)} className={tabGuia === t ? 'is-active' : ''}>
                {t === 'comprar' ? 'Comprar' : 'Vender'}
              </button>
            ))}
          </div>
        </div>

        <div key={tabGuia} className="animate-fade-in">
          <div className="home-guide-inner" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1px', background: 'var(--gray2)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gray1)', padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '2rem', borderLeft: '3px solid var(--accent)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  {guiaActual.para}
                </div>
                <div style={{ fontSize: '21px', fontWeight: 700, color: 'var(--white)', lineHeight: 1.35 }}>
                  {guiaActual.headline}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn-primary hover-lift" style={{ fontSize: '14px', padding: '10px 24px' }}
                  onClick={() => isComprar ? navigate('/catalogo') : (concesionaria ? navigate('/panel') : user ? navigate('/mi-cuenta') : navigate('/registro'))}>
                  {guiaActual.cta}
                </button>
                <GuiaBoton seccion={isComprar ? 'compradores' : 'vendedores'} />
              </div>
            </div>

            <div className="home-guide-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--gray2)' }}>
              {guiaActual.steps.map((p) => (
                <div key={p.num} className="step-card" style={{ background: 'var(--gray1)', padding: '2.5rem 2rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(230,51,41,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--accent)', marginBottom: '1.75rem' }}>
                    {p.num}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--white)', marginBottom: '.75rem', lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.75 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DEALERS */}
      <div className="animate-fade-in home-section responsive-section" style={{ padding: '4rem', borderTop: '1px solid var(--gray2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Red de concesionarias</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3vw,40px)', lineHeight: 1.1, margin: 0 }}>Conocé a tu próxima<br />concesionaria</h2>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/concesionarias')} style={{ flexShrink: 0 }}>Ver todas →</button>
        </div>
        {concesionarias.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no hay concesionarias registradas.</p>
          : <div className="market-dealer-rail">
              {concesionarias.map((c, i) => {
                const isPremium = c.plan === 'premium'
                const isPro = c.plan === 'pro'
                const cardColor = colors[i % colors.length]
                return (
                  <div key={c.id} onClick={() => navigate(`/concesionaria/${c.id}`)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/concesionaria/${c.id}`) } }}
                    role="link" tabIndex={0} aria-label={`Ver ${c.nombre}`}
                    className="dealer-card market-dealer-card"
                    style={{ borderColor: isPremium ? 'rgba(230,51,41,.3)' : 'var(--gray2)' }}>
                    <div style={{ height: '70px', background: c.portada_url ? `url(${c.portada_url}) center/cover` : `linear-gradient(135deg, ${isPremium ? 'rgba(230,51,41,.25)' : cardColor + '33'} 0%, #0d0d0d 100%)` }} />
                    <div style={{ padding: '0 1.25rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-23px', marginBottom: '10px' }}>
                        <div style={{ padding: '3px', background: 'var(--gray1)', borderRadius: 'calc(var(--radius) + 3px)', border: '3px solid var(--gray1)', lineHeight: 0 }}>
                          <LogoConcesionaria c={c} i={i} />
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
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Catálogo</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3vw,36px)', lineHeight: 1.1, margin: 0 }}>EXPLORAR POR TIPO DE VEHÍCULO</h2>
          </div>
          <div className="market-type-tabs">
            {[['autos', 'Autos'], ['motos', 'Motos'], ['nautica', 'Náutica']].map(([key, label]) => (
              <button key={key} onClick={() => setTipoCategoria(key)} className={tipoCategoria === key ? 'is-active' : ''}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {TIPOS[tipoCategoria].map(({ tipo, img }) => (
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
