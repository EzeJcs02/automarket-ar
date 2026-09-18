const categories = ['SUV', 'Pickup', 'Sedán', 'Hatchback', 'Coupé', 'Deportiva', 'Lancha']

export default function HomeHero() {
  return (
    <section
      className="home-hero"
      aria-labelledby="market-title"
      style={{
        position: 'relative', minHeight: '68vh', overflow: 'hidden', display: 'flex', alignItems: 'center',
        padding: 'clamp(4rem,8vh,6rem) 0',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/assets/tipos/icon_coupe.png")', backgroundSize: '70% auto', backgroundRepeat: 'no-repeat', backgroundPosition: 'center 42%' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(245,243,238,.05) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--black) 0%, rgba(10,10,10,.82) 40%, rgba(10,10,10,.35) 62%, transparent 88%), linear-gradient(0deg, var(--black) 0%, transparent 18%)' }} />

      <div className="animate-fade-in" style={{ position: 'relative', maxWidth: '700px', padding: '0 clamp(20px,5vw,64px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          <span style={{ width: '26px', height: '1px', background: 'var(--accent)' }} />
          Tu próxima historia empieza acá
        </div>
        <h1 id="market-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px,4vw,52px)', color: 'var(--white)', lineHeight: 1.1, margin: '0 0 1.2rem' }}>
          NO ES SOLO<br />UN AUTO. ES TU<br /><span style={{ color: 'var(--accent)' }}>PRÓXIMO DESTINO.</span>
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--gray4)', maxWidth: '440px', lineHeight: 1.7, marginBottom: '2.25rem' }}>
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
      </div>
    </section>
  )
}
