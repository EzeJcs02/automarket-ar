import { Link } from 'react-router-dom'
import { FONDO_SHOWROOM_DEFAULT } from '../lib/marca'

const categories = ['SUV', 'Pickup', 'Sedán', 'Hatchback', 'Coupé', 'Deportiva', 'Lancha']

export default function HomeHero() {
  return (
    <section className="responsive-section conc-listado-hero" style={{ padding: '4rem 4rem 3rem', borderBottom: '1px solid var(--gray2)', position: 'relative', overflow: 'hidden' }} aria-labelledby="market-title">
      <div className="conc-listado-hero__bg" style={{ backgroundImage: `url("${FONDO_SHOWROOM_DEFAULT}")` }} />
      <div className="conc-listado-hero__scrim" />
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Tu próxima historia empieza acá
        </div>
        <h1 id="market-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,6vw,64px)', lineHeight: .95, marginBottom: '1.25rem' }}>
          NO ES SOLO UN AUTO.<br />ES TU PRÓXIMO <span style={{ color: 'var(--accent)' }}>DESTINO.</span>
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--gray4)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '2rem' }}>
          Encontrá el vehículo que va con vos. Explorá, compará y conectá con concesionarias de toda Argentina.
        </p>

        <form className="home-search" action="/catalogo" method="get">
          <label className="home-search__field home-search__field--query" htmlFor="home-query">
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input id="home-query" name="q" type="search" placeholder="Ej. Toyota Corolla" />
          </label>
          <label className="home-search__field" htmlFor="home-category">
            <select id="home-category" name="categoria" defaultValue="">
              <option value="">Todas las categorías</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <button className="btn-primary" type="submit">Buscar vehículos <span aria-hidden="true">→</span></button>
        </form>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1.5rem' }}>
          <Link to="/concesionarias" style={{ fontSize: '13px', color: 'var(--gray4)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Conocer concesionarias <span aria-hidden="true">→</span>
          </Link>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '11px', color: 'var(--gray4)' }}>
            <span>✓ Autos nuevos y usados</span><span>✓ Contacto directo</span><span>✓ Todo en un lugar</span>
          </div>
        </div>
      </div>
    </section>
  )
}
