import { Link } from 'react-router-dom'
import { RevealTitle } from './Reveal'

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
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/assets/hero-bg.jpg")', backgroundSize: 'cover', backgroundPosition: '72% center' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(245,243,238,.05) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--black) 0%, rgba(10,10,10,.82) 40%, rgba(10,10,10,.35) 62%, transparent 88%), linear-gradient(0deg, var(--black) 0%, transparent 18%)' }} />

      <div className="animate-fade-in" style={{ position: 'relative', maxWidth: '700px', padding: '0 clamp(20px,5vw,64px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          <span style={{ width: '26px', height: '1px', background: 'var(--accent)' }} />
          Tu próxima historia empieza acá
        </div>
        <RevealTitle as="h1" id="market-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px,4vw,52px)', color: 'var(--white)', lineHeight: 1.1, margin: '0 0 1.2rem' }}>
          EL ECOSISTEMA<br />DE VEHÍCULOS<br />DE ARGENTINA
        </RevealTitle>
        <p data-reveal="up" style={{ fontSize: '16px', color: 'var(--white)', maxWidth: '440px', lineHeight: 1.7, marginBottom: '2.25rem' }}>
          Autos, motos y náutica. Explorá, compará y conectá con concesionarias de toda Argentina.
        </p>

        <div className="home-hero-cta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/catalogo"><button className="btn-primary" style={{ padding: '12px 26px', fontSize: '14px' }}>Explorar Catálogo</button></Link>
          <Link to="/registro"><button className="btn-secondary" style={{ padding: '12px 26px', fontSize: '14px' }}>Publicar Vehículo</button></Link>
        </div>
      </div>
    </section>
  )
}
