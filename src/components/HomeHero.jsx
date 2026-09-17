import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const categories = [
  ['SUV', 'suv'], ['Pickup', 'pickup'], ['Sedán', 'sedan'],
  ['Hatchback', 'hatchback'], ['Coupé', 'coupe'],
]

export default function HomeHero() {
  const heroRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const hero = heroRef.current
    const video = videoRef.current
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let duration = 0

    const onLoadedMetadata = () => { duration = video?.duration || 0 }
    video?.addEventListener('loadedmetadata', onLoadedMetadata)
    // "Desbloquea" el seek en iOS Safari, que requiere haber arrancado la
    // reproducción al menos una vez antes de permitir mover currentTime.
    video?.play().then(() => video.pause()).catch(() => {})

    const update = () => {
      frame = 0
      const { top, height } = hero.getBoundingClientRect()
      const progress = Math.min(Math.max(-top / height, 0), 1)
      hero.style.setProperty('--hero-scroll', progress.toFixed(4))
      if (video && duration) video.currentTime = progress * duration
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      video?.removeEventListener('loadedmetadata', onLoadedMetadata)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <>
      <section className="market-hero" aria-labelledby="market-title" ref={heroRef}>
        <div className="market-hero-art" aria-hidden="true">
          <video
            ref={videoRef}
            src="/assets/hero/hero-car.mp4"
            poster="/assets/tipos/icon_coupe.png"
            muted
            playsInline
            preload="auto"
          />
        </div>
        <div className="market-hero-content">
          <p className="market-eyebrow"><span /> TU PRÓXIMA HISTORIA EMPIEZA ACÁ</p>
          <h1 id="market-title">No es solo un auto.<br />Es tu próximo <em>destino.</em></h1>
          <p className="market-intro">Encontrá el vehículo que va con vos. Explorá, compará y conectá con concesionarias de toda Argentina.</p>
          <div className="market-hero-links">
            <a className="btn-primary" href="#buscar-vehiculo">Encontrar mi vehículo <span aria-hidden="true">↗</span></a>
            <Link to="/concesionarias">Conocer concesionarias <span aria-hidden="true">→</span></Link>
          </div>
          <div className="market-benefits"><span>Autos nuevos y usados</span><span>Contacto directo</span><span>Todo en un lugar</span></div>
        </div>
        <div className="market-hero-caption"><span>FIORA SELECTION</span><span>El camino lo elegís vos.</span></div>
      </section>

      <section id="buscar-vehiculo" className="market-search-wrap" aria-label="Buscá tu próximo vehículo">
        <div className="market-search-heading"><h2>¿Qué te mueve?</h2><Link to="/catalogo">Explorar todo el catálogo <span aria-hidden="true">↗</span></Link></div>
        <form className="market-search" action="/catalogo" method="get">
          <label className="market-search-query" htmlFor="home-query"><span>MARCA O MODELO</span><div><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><input id="home-query" name="q" type="search" placeholder="Ej. Toyota Corolla" /></div></label>
          <label htmlFor="home-category"><span>TIPO DE VEHÍCULO</span><select id="home-category" name="categoria"><option value="">Todas las categorías</option>{categories.map(([name]) => <option key={name}>{name}</option>)}<option>Deportiva</option><option>Lancha</option></select></label>
          <button className="btn-primary" type="submit">Buscar vehículos <span aria-hidden="true">→</span></button>
        </form>
        <div className="market-categories" aria-label="Explorar por categoría">
          {categories.map(([name, asset]) => <Link key={name} to={`/catalogo?categoria=${encodeURIComponent(name)}`}><img src={`/assets/tipos/icon_${asset}.png`} alt="" loading="lazy" /><span>{name}</span><span aria-hidden="true">↗</span></Link>)}
        </div>
      </section>
    </>
  )
}
