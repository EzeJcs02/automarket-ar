import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CarCard from '../components/CarCard'

export default function Home() {
  const navigate = useNavigate()
  const [autos, setAutos] = useState([])
  const [concesionarias, setConcesionarias] = useState([])

  useEffect(() => {
    supabase.from('autos').select('*, concesionarias(nombre, ciudad)').eq('activo', true).limit(6).order('created_at', { ascending: false }).then(({ data }) => setAutos(data || []))
    supabase.from('concesionarias').select('*').eq('aprobada', true).limit(6).then(({ data }) => setConcesionarias(data || []))
  }, [])

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
      {/* HERO */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '4rem', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: .04, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px)' }} />
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Plataforma N°1 de autos en Argentina
          </div>
          
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(60px,10vw,130px)', lineHeight: 1.05, letterSpacing: '2px', marginBottom: '2rem' }}>
            ENCONTRÁ<br />TU PRÓXIMO<br /><span style={{ color: 'var(--accent)' }}>AUTO</span>
          </h1>
          
          {/* AQUÍ ESTÁ LA CORRECCIÓN ORTOGRÁFICA */}
          <p style={{ fontSize: '17px', color: 'var(--gray4)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '3rem' }}>
            Miles de autos nuevos y usados de las mejores concesionarias de Argentina. Filtrá, compará y contactá directo.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '15px', padding: '14px 32px' }} onClick={() => navigate('/catalogo')}>Ver catálogo completo</button>
            <button className="btn-secondary" style={{ fontSize: '15px', padding: '14px 32px' }} onClick={() => navigate('/concesionarias')}>Ver concesionarias</button>
          </div>
          <div style={{ display: 'flex', gap: '3rem', marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--gray2)' }}>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.length > 0 ? `${autos.length}+` : '—'}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Autos publicados</div></div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{concesionarias.length > 0 ? concesionarias.length : '—'}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Concesionarias</div></div>
          </div>
        </div>
      </div>

      {/* FEATURED CARS */}
      <div style={{ padding: '4rem', borderTop: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Destacados</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, marginBottom: '2rem' }}>ÚLTIMOS EN LLEGAR</h2>
        {autos.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no hay autos publicados. ¡Sé el primero en publicar!</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
              {autos.map(a => <CarCard key={a.id} auto={a} />)}
            </div>
        }
        <div style={{ marginTop: '2rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/catalogo')}>Ver todos los autos →</button>
        </div>
      </div>

      {/* DEALERS */}
      <div style={{ padding: '4rem', borderTop: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Red de concesionarias</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, marginBottom: '2rem' }}>QUIÉNES<br />PUBLICAN</h2>
        {concesionarias.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no hay concesionarias registradas.</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1px', background: 'var(--gray2)' }}>
              {concesionarias.map((c, i) => (
                <div key={c.id} onClick={() => navigate(`/concesionaria/${c.id}`)}
                  style={{ background: 'var(--gray1)', padding: '1.5rem', cursor: 'pointer', transition: 'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#222'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--gray1)'}>
                  <LogoConcesionaria c={c} i={i} />
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{c.nombre}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '.75rem' }}>{c.ciudad}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)' }}>Ver stock →</div>
                </div>
              ))}
            </div>
        }
        <div style={{ marginTop: '2rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/concesionarias')}>Ver todas las concesionarias →</button>
        </div>
      </div>

      {/* FOOTER CORPORATIVO TIPO ZONAPROP */}
      <footer style={{ background: '#050505', borderTop: '1px solid var(--gray2)', padding: '5rem 4rem 2rem', color: 'var(--gray4)', fontSize: '13px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          
          {/* Columna 1: Marca */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: 'var(--white)', marginBottom: '1rem' }}>
              AUTO<span style={{ color: 'var(--accent)' }}>MARKET</span> AR
            </div>
            <p style={{ lineHeight: 1.6, marginBottom: '1.5rem' }}>
              La plataforma más avanzada para encontrar y publicar vehículos de agencias verificadas en Argentina.
            </p>
          </div>

          {/* Columna 2: Explorar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Explorar</div>
            <Link to="/catalogo" style={{ color: 'var(--gray4)', textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--gray4)'}>Catálogo de Autos</Link>
            <Link to="/concesionarias" style={{ color: 'var(--gray4)', textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--gray4)'}>Red de Concesionarias</Link>
            <Link to="/registro" style={{ color: 'var(--gray4)', textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--gray4)'}>Publicar mi stock</Link>
          </div>

          {/* Columna 3: Legales y Confianza */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Legales</div>
            <a href="#" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Términos y Condiciones</a>
            <a href="#" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Políticas de Privacidad</a>
            <a href="#" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Defensa del Consumidor</a>
            <a href="#" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Botón de Arrepentimiento</a>
          </div>

          {/* Columna 4: Contacto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Contacto</div>
            <div>📍 Salta, Argentina</div>
            <div>✉️ soporte@automarket.ar</div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              {/* Iconos de redes sociales placeholder */}
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', cursor: 'pointer' }}>in</div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', cursor: 'pointer' }}>ig</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Data Fiscal mock */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>© 2026 AutoMarket AR. Todos los derechos reservados.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '40px', background: 'var(--gray2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', textAlign: 'center', lineHeight: 1 }}>DATA<br/>FISCAL</div>
            <span style={{ fontSize: '11px' }}>Sitio Seguro</span>
          </div>
        </div>
      </footer>
    </div>
  )
}