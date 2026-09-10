import { Link } from 'react-router-dom'

const categories = [
  ['SUV', 'suv'], ['Pickup', 'pickup'], ['Sedán', 'sedan'],
  ['Hatchback', 'hatchback'], ['Coupé', 'coupe'],
]

export default function HomeHero() {
  return (
    <>
      <section className="market-hero" aria-labelledby="market-title">
        <div className="market-hero-art" aria-hidden="true">
          <img src="/assets/tipos/icon_coupe.png" alt="" fetchPriority="high" />
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
