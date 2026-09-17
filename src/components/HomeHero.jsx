import { useState } from 'react'
import { Link } from 'react-router-dom'

const categories = ['SUV', 'Pickup', 'Sedán', 'Hatchback', 'Coupé', 'Deportiva', 'Lancha']

export default function HomeHero() {
  const [pos, setPos] = useState({ x: 0, y: 0 })

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setPos({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    })
  }

  return (
    <section
      className="home-hero"
      onMouseMove={handleMove}
      aria-labelledby="market-title"
      style={{
        position: 'relative', minHeight: '92vh', overflow: 'hidden', display: 'flex', alignItems: 'center',
        background: 'radial-gradient(ellipse 90% 60% at 30% 20%, rgba(230,51,41,.14) 0%, transparent 60%), linear-gradient(180deg, var(--black) 0%, #0d0d0d 60%, var(--black) 100%)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(245,243,238,.05) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)' }} />

      <img
        src="/assets/tipos/icon_coupe.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: `${-40 + pos.x * -30}px`,
          bottom: `${-40 + pos.y * -20}px`,
          width: 'min(52vw, 780px)', opacity: .9,
          filter: 'drop-shadow(0 40px 60px rgba(0,0,0,.7))',
          transition: 'right .4s ease-out, bottom .4s ease-out',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--black) 20%, rgba(10,10,10,.4) 55%, transparent 78%)' }} />

      <div className="animate-fade-in" style={{ position: 'relative', maxWidth: '700px', padding: '0 clamp(20px,5vw,64px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          <span style={{ width: '26px', height: '1px', background: 'var(--accent)' }} />
          Tu próxima historia empieza acá
        </div>
        <h1 id="market-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,8vw,96px)', lineHeight: .92, margin: '0 0 1.4rem' }}>
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

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1.5rem' }}>
          <Link to="/concesionarias" style={{ fontSize: '13px', color: 'var(--gray4)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Conocer concesionarias <span aria-hidden="true">→</span>
          </Link>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '11px', color: 'var(--gray4)' }}>
            <span>✓ Autos nuevos y usados</span><span>✓ Contacto directo</span><span>✓ Todo en un lugar</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--gray3)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', animation: 'fmFloat 2.4s ease-in-out infinite' }}>
        SCROLL
        <div style={{ width: '1px', height: '26px', background: 'linear-gradient(var(--gray3), transparent)' }} />
      </div>
    </section>
  )
}
