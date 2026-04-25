import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--gray2)', background: 'var(--black)', padding: '3rem 4rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>

          {/* Marca */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '2px', marginBottom: '1rem' }}>
              FIORA<span style={{ color: 'var(--accent)' }}> MARKET</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.7, maxWidth: '220px' }}>
              La plataforma de vehículos más avanzada de Argentina.
            </p>
          </div>

          {/* Explorar */}
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--gray4)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>Explorar</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/catalogo" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--gray4)'}>Catálogo de vehículos</Link>
              <Link to="/concesionarias" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--gray4)'}>Red de concesionarias</Link>
              <Link to="/planes" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--gray4)'}>Planes y precios</Link>
            </div>
          </div>

          {/* Publicar */}
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--gray4)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>Publicar</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/registro" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--gray4)'}>Registrarse gratis</Link>
              <Link to="/login" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--gray4)'}>Iniciar sesión</Link>
              <Link to="/planes" style={{ fontSize: '13px', color: 'var(--accent)', transition: 'color .2s' }}>Ver planes →</Link>
              <Link to="/publicitate" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--gray4)'}>Publicitá aquí</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--gray4)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>Legal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/legales" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--gray4)'}>Términos y condiciones</Link>
              <Link to="/legales#privacidad" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--gray4)'}>Política de privacidad</Link>
              <Link to="/arrepentimiento" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--gray4)'}>Botón de arrepentimiento</Link>
              <a href="mailto:contacto@fioramarket.store" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--white)'}
                onMouseLeave={e => e.target.style.color = 'var(--gray4)'}>contacto@fioramarket.store</a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid var(--gray2)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '12px', color: 'var(--gray4)' }}>
            © {new Date().getFullYear()} FIORA MARKET — Salta, Argentina
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', letterSpacing: '.05em' }}>
              Defensa del Consumidor
            </a>
            <a href="https://www.instagram.com/fiora.market/" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--gray4)', transition: 'color .2s', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--gray4)'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
