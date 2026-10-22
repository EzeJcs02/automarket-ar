import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'
import CarCardSkeleton from '../components/CarCardSkeleton'
import DealerCard from '../components/DealerCard'
import HomeHero from '../components/HomeHero'
import { useScrollReveal } from '../components/Reveal'
import { ErrorState, Skeleton } from '../components/Estados'
import { GuiaBoton } from '../components/GuiaModal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import SectionHeader from '../components/ui/SectionHeader'
import Segmented from '../components/ui/Segmented'
import { setPageMeta } from '../lib/seo'
import { FONDO_SHOWROOM_DEFAULT } from '../lib/marca'
import { CATEGORIAS, GRUPOS } from '../lib/categorias'
import { formatKm, formatPrecio } from '../lib/formato'
import './Home.css'

const CONFIANZA = [
  ['shield', 'Concesionarias verificadas', 'Cada agencia se revisa antes de publicar.'],
  ['whatsapp', 'Contacto directo', 'Hablás con quien vende, sin intermediarios ni comisiones.'],
  ['compare', 'Compará hasta 3', 'Fichas lado a lado para decidir con datos.'],
  ['bell', 'Alertas de búsqueda', 'Te avisamos por email cuando aparece lo que buscás.'],
]

const GUIA = {
  comprar: {
    titulo: 'Encontrá el vehículo ideal al mejor precio',
    cta: 'Explorar catálogo',
    guia: 'compradores',
    pasos: [
      ['Explorá el catálogo', 'Filtrá por marca, modelo, precio, año y ubicación.'],
      ['Elegí con confianza', 'Revisá el perfil de la agencia, sus reseñas y su stock.'],
      ['Contactá directo', 'Escribí por WhatsApp o enviá una consulta. Sin comisiones.'],
    ],
  },
  vender: {
    titulo: 'Publicá tu vehículo y llegá a miles de compradores',
    cta: 'Publicar vehículo',
    guia: 'vendedores',
    pasos: [
      ['Cargá los datos', 'Marca, modelo, año, kilómetros y estado del vehículo.'],
      ['Sumá fotos y precio', 'Tu publicación queda visible en minutos.'],
      ['Cerrá la venta', 'Respondé consultas y coordiná directo con el interesado.'],
    ],
  },
}

export default function Home() {
  const { user, concesionaria } = useAuth()
  const [autos, setAutos] = useState([])
  const [concesionarias, setConcesionarias] = useState([])
  const [tabGuia, setTabGuia] = useState('comprar')
  const [grupo, setGrupo] = useState('autos')
  const [banners, setBanners] = useState([])
  const [ads, setAds] = useState([])
  const [autoFijado, setAutoFijado] = useState(null)
  const [adIdx, setAdIdx] = useState(0)
  const [bannerIdx, setBannerIdx] = useState(0)
  const [adsPaused, setAdsPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [loading, setLoading] = useState(true)
  const [cargaError, setCargaError] = useState(false)
  const configMissing = !import.meta.env.VITE_SUPABASE_URL

  useScrollReveal([loading, autos.length, concesionarias.length, autoFijado, grupo])

  useEffect(() => {
    setPageMeta({ title: null, description: 'La plataforma de vehículos más avanzada de Argentina. Miles de autos, motos y náutica de concesionarias verificadas.', path: '/' })
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    setCargaError(false)
    try {
      const [rAutos, rConc, rBanners, rAds, rFijado] = await Promise.all([
        // Recién publicados: primero los urgentes y destacados (pagos), después lo más nuevo
        supabase.from('autos').select('*, concesionarias(nombre, ciudad, plan)').eq('activo', true)
          .order('urgente', { ascending: false, nullsFirst: false })
          .order('destacado', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false }).limit(6),
        supabase.from('concesionarias').select('*, autos(count)').eq('aprobada', true).order('destacada', { ascending: false }).limit(8),
        supabase.from('concesionarias').select('id, nombre, portada_url').eq('banner_activo', true).limit(10),
        supabase.from('publicidades').select('id, nombre, imagen_url, link_url, fondo').eq('activo', true).order('created_at', { ascending: false }),
        supabase.from('autos').select('*, concesionarias(nombre, ciudad, plan)').eq('fijado_home', true).eq('activo', true).limit(20),
      ])
      if (rAutos.error || rConc.error) throw rAutos.error || rConc.error
      setAutos(rAutos.data || [])
      setConcesionarias(rConc.data || [])
      setBanners(rBanners.data || [])
      setAds(rAds.data || [])
      // Un solo lugar en el home: si pagaron varios, rota al azar en cada visita.
      const fijados = rFijado.data || []
      setAutoFijado(fijados.length ? fijados[Math.floor(Math.random() * fijados.length)] : null)
    } catch (err) {
      console.error('Error fetching home data:', err)
      setCargaError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ads.length <= 1 || adsPaused) return
    const t = setInterval(() => setAdIdx(i => (i + 1) % ads.length), 3500)
    return () => clearInterval(t)
  }, [ads.length, adsPaused])

  useEffect(() => {
    if (banners.length <= 1 || adsPaused) return
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000)
    return () => clearInterval(t)
  }, [banners.length, adsPaused])

  const guia = GUIA[tabGuia]
  const ctaGuia = tabGuia === 'comprar' ? '/catalogo' : concesionaria ? '/panel' : user ? '/mi-cuenta' : '/registro'
  const banner = banners[bannerIdx]

  return (
    <div className="home">
      {configMissing && (
        <div className="home__config" role="alert">Configuración de Supabase incompleta. Revisá tu archivo .env para ver los vehículos reales.</div>
      )}

      <HomeHero />

      {/* CONFIANZA */}
      <section className="trust" aria-label="Por qué FIORA MARKET">
        <ul className="container trust__list" data-reveal-stagger>
          {CONFIANZA.map(([icon, titulo, texto]) => (
            <li key={titulo} className="trust__item">
              <span className="trust__icon"><Icon name={icon} size={18} /></span>
              <div>
                <strong>{titulo}</strong>
                <p>{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* EXPLORAR POR TIPO */}
      <section className="home-sec" aria-labelledby="tipos-title">
        <div className="container">
          <SectionHeader id="tipos-title" title="Explorá por tipo"
            desc="Empezá por lo que necesitás: ciudad, ruta, trabajo o agua."
            action={<Segmented label="Categoría" options={GRUPOS} value={grupo} onChange={setGrupo} />} />
          <ul className="types" key={grupo} data-reveal-stagger>
            {CATEGORIAS[grupo].map(({ tipo, img }) => (
              <li key={tipo}>
                <Link to={`/catalogo?categoria=${encodeURIComponent(tipo)}`} className="type-tile">
                  <span className="type-tile__img"><img src={img} alt="" width="96" height="96" loading="lazy" decoding="async" /></span>
                  <span className="type-tile__name">{tipo}</span>
                  <Icon name="arrowRight" size={16} className="type-tile__go" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* DESTACADO DEL DÍA */}
      {autoFijado && (
        <section className="home-sec home-sec--tight" aria-labelledby="spot-title">
          <div className="container">
            <article className="spotlight" data-reveal="up">
              <div className="spotlight__media">
                {autoFijado.fotos?.[0]
                  ? <img src={autoFijado.fotos[0]} alt="" />
                  : <Icon name="car" size={56} strokeWidth={1.25} />}
              </div>
              <div className="spotlight__body">
                <Badge tone="champagne-soft">Destacado del día</Badge>
                <p className="spotlight__brand">{autoFijado.marca}</p>
                <h2 id="spot-title" className="spotlight__title">
                  <Link to={`/auto/${autoFijado.id}`} className="spotlight__link">{autoFijado.modelo}</Link>
                </h2>
                <ul className="spotlight__specs tabular">
                  <li>{autoFijado.anio}</li>
                  <li>{formatKm(autoFijado.kilometraje)}</li>
                  {autoFijado.combustible && <li>{autoFijado.combustible}</li>}
                </ul>
                <p className="spotlight__price tabular">{formatPrecio(autoFijado.precio_ars)}</p>
                {autoFijado.concesionarias?.nombre && (
                  <p className="spotlight__dealer"><Icon name="pin" size={14} />{autoFijado.concesionarias.nombre}{autoFijado.concesionarias.ciudad ? ` · ${autoFijado.concesionarias.ciudad}` : ''}</p>
                )}
                <span className="btn btn--light spotlight__cta" aria-hidden="true">Ver vehículo<Icon name="arrowRight" size={18} /></span>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* RECIÉN PUBLICADOS */}
      <section className="home-sec" aria-labelledby="nuevos-title">
        <div className="container">
          <SectionHeader id="nuevos-title" title="Recién publicados"
            desc="Stock que acaba de entrar, con los destacados primero."
            action={<Button to="/catalogo" variant="link" className="home__more">Ver todo el catálogo<Icon name="arrowRight" size={16} className="btn__arrow" /></Button>} />
          {loading ? (
            <div className="vgrid home__grid">{[1, 2, 3, 4, 5, 6].map(i => <CarCardSkeleton key={i} />)}</div>
          ) : cargaError ? (
            <ErrorState onRetry={fetchAll} />
          ) : autos.length === 0 ? (
            <p className="home__empty">Por ahora no hay vehículos publicados. Volvé pronto.</p>
          ) : (
            <div className="vgrid home__grid" data-reveal-stagger>
              {autos.map(a => <CarCard key={a.id} auto={a} />)}
            </div>
          )}
        </div>
      </section>

      {/* CONCESIONARIAS */}
      <section className="home-sec home-sec--alt" aria-labelledby="conc-title">
        <div className="container">
          <SectionHeader id="conc-title" title="Concesionarias de la red"
            desc="Agencias con catálogo online, reseñas reales y contacto directo."
            action={<Button to="/concesionarias" variant="link" className="home__more">Ver todas<Icon name="arrowRight" size={16} className="btn__arrow" /></Button>} />
          {loading || cargaError ? (
            <div className="rail">{[1, 2, 3, 4].map(i => <Skeleton key={i} h={232} r="12px" style={{ flex: '0 0 300px' }} />)}</div>
          ) : concesionarias.length === 0 ? (
            <p className="home__empty">Todavía no hay concesionarias registradas.</p>
          ) : (
            <ul className="rail" data-reveal-stagger>
              {concesionarias.map(c => <li key={c.id}><DealerCard c={c} /></li>)}
            </ul>
          )}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="home-sec" aria-labelledby="como-title">
        <div className="container">
          <SectionHeader id="como-title" title="Cómo funciona"
            action={<Segmented label="Quiero" options={[['comprar', 'Comprar'], ['vender', 'Vender']]} value={tabGuia} onChange={setTabGuia} />} />
          <AnimatePresence mode="wait" initial={false}>
            <Motion.div key={tabGuia} className="how"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}>
              <div className="how__intro">
                <h3 className="how__title">{guia.titulo}</h3>
                <div className="how__ctas">
                  <Button to={ctaGuia}>{guia.cta}<Icon name="arrowRight" size={16} /></Button>
                  <GuiaBoton seccion={guia.guia} />
                </div>
              </div>
              <ol className="how__steps">
                {guia.pasos.map(([titulo, texto], i) => (
                  <li key={titulo} className="how__step">
                    <span className="how__num tabular">{String(i + 1).padStart(2, '0')}</span>
                    <h4>{titulo}</h4>
                    <p>{texto}</p>
                  </li>
                ))}
              </ol>
            </Motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ESPACIO PUBLICITARIO */}
      {(ads.length > 0 || banners.length > 0) && (
        <aside className="home-sec home-sec--tight" aria-label="Publicidad">
          <div className="container partners" data-reveal="up">
            <div className="partners__intro">
              <span className="partners__label">Espacio publicitario</span>
              <p>Conectá con los que conocen el camino.</p>
              <Link to="/publicitate" className="partners__link">Tu marca, acá<Icon name="arrowRight" size={14} /></Link>
              {(ads.length > 1 || banners.length > 1) && (
                <button type="button" className="partners__pause" onClick={() => setAdsPaused(p => !p)}>
                  {adsPaused ? 'Reanudar publicidad' : 'Pausar publicidad'}
                </button>
              )}
            </div>
            {ads.length > 0 && (
              <div className="partners__ad">
                {ads.map((ad, i) => (
                  <a key={ad.id} href={ad.link_url || undefined} target="_blank" rel="noopener noreferrer"
                    tabIndex={i === adIdx ? 0 : -1} aria-hidden={i !== adIdx}
                    className={`${i === adIdx ? 'is-active' : ''} ${ad.fondo === 'claro' ? 'is-light' : ''}`}>
                    <img src={ad.imagen_url} alt={ad.nombre} loading="lazy" />
                  </a>
                ))}
                {ads.length > 1 && (
                  <div className="partners__dots">
                    {ads.map((ad, i) => <button key={ad.id} type="button" aria-label={`Ver publicidad de ${ad.nombre}`} aria-pressed={i === adIdx} onClick={() => setAdIdx(i)} />)}
                  </div>
                )}
              </div>
            )}
            {banner && (
              <Link to={`/concesionaria/${banner.id}`} className="partners__banner" style={{ backgroundImage: `url("${banner.portada_url || FONDO_SHOWROOM_DEFAULT}")` }}>
                <span className="partners__label">Concesionaria destacada</span>
                <strong>{banner.nombre}</strong>
                <span className="partners__banner-go">Conocé sus vehículos<Icon name="arrowRight" size={14} /></span>
              </Link>
            )}
          </div>
        </aside>
      )}

      {/* CTA FINAL */}
      <section className="home-sec home-sec--tight" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta-band" data-reveal="up">
            <div>
              <h2 id="cta-title" className="cta-band__title">¿Tenés una concesionaria?</h2>
              <p className="cta-band__text">Mostrá todo tu stock a compradores de todo el país, con tu propia portada y estadísticas de cada publicación.</p>
            </div>
            <div className="cta-band__actions">
              <Button to="/planes" variant="light" size="lg">Ver planes</Button>
              <Button to="/registro" variant="secondary" size="lg">Crear cuenta gratis</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
