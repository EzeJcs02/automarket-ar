import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CarCard from '../components/CarCard'

export default function Home() {
  const navigate = useNavigate()
  const [autos, setAutos] = useState([])
  const [concesionarias, setConcesionarias] = useState([])
  const [tabGuia, setTabGuia] = useState('comprar')

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
            ENCONTRÁ<br />TU PRÓXIMO<br /><span style={{ color: 'var(--accent)' }}>VEHÍCULO</span>
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--gray4)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '3rem' }}>
            Miles de autos nuevos y usados de las mejores concesionarias de Argentina. Filtrá, compará y contactá directo.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '15px', padding: '14px 32px' }} onClick={() => navigate('/catalogo')}>Ver catálogo completo</button>
            <button className="btn-secondary" style={{ fontSize: '15px', padding: '14px 32px' }} onClick={() => navigate('/concesionarias')}>Ver concesionarias</button>
          </div>
          <div style={{ display: 'flex', gap: '3rem', marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--gray2)' }}>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{autos.length > 0 ? `${autos.length}+` : '—'}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Vehículos publicados</div></div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>{concesionarias.length > 0 ? concesionarias.length : '—'}</div><div style={{ fontSize: '12px', color: 'var(--gray4)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Concesionarias</div></div>
          </div>
        </div>
      </div>

      {/* EXPLORAR POR TIPO */}
      <div style={{ padding: '4rem', borderTop: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,36px)', lineHeight: 1, marginBottom: '2.5rem' }}>EXPLORAR POR TIPO DE VEHÍCULO</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { tipo: 'Camioneta', icon: '🛻' },
            { tipo: 'SUV',       icon: '🚙' },
            { tipo: 'Hatchback', icon: '🚗' },
            { tipo: 'Sedán',     icon: '🚘' },
            { tipo: 'Pickup',    icon: '🚚' },
            { tipo: 'Minivan',   icon: '🚐' },
            { tipo: 'Coupé',     icon: '🏎️' },
          ].map(({ tipo, icon }) => (
            <button key={tipo} onClick={() => navigate(`/catalogo?tipo=${tipo}`)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '1.25rem 1.75rem', background: 'var(--black)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'border-color .2s, background .2s', minWidth: '100px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#111' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray2)'; e.currentTarget.style.background = 'var(--black)' }}>
              <span style={{ fontSize: '32px' }}>{icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--white)', letterSpacing: '.04em' }}>{tipo}</span>
            </button>
          ))}
        </div>
      </div>

      {/* INSTRUCCIONES COMPRAR Y VENDER */}
      <div style={{ padding: '5rem 4rem', borderTop: '1px solid var(--gray2)', background: 'var(--black)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Guía práctica</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,52px)', lineHeight: 1, marginBottom: '2.5rem' }}>INSTRUCCIONES COMPRAR Y VENDER</h2>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '3rem', background: 'var(--gray1)', padding: '4px', borderRadius: 'var(--radius)', width: 'fit-content', border: '1px solid var(--gray2)' }}>
          {['comprar', 'vender'].map(t => (
            <button key={t} onClick={() => setTabGuia(t)}
              style={{ padding: '8px 24px', borderRadius: 'var(--radius)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none', textTransform: 'capitalize',
                background: tabGuia === t ? 'var(--accent)' : 'transparent',
                color: tabGuia === t ? 'var(--white)' : 'var(--gray4)',
                transition: 'all .2s' }}>
              {t === 'comprar' ? 'Comprar' : 'Vender'}
            </button>
          ))}
        </div>

        {tabGuia === 'comprar' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'var(--gray2)' }}>
            {[
              { num: '1', title: 'Explorá el catálogo', desc: 'Filtrá por marca, modelo, precio, año y ubicación para encontrar el vehículo ideal.' },
              { num: '2', title: 'Elegí la concesionaria', desc: 'Revisá el perfil de la agencia, su reputación y el stock disponible.' },
              { num: '3', title: 'Contactá y coordiná', desc: 'Escribí por WhatsApp o enviá una consulta directa. Sin intermediarios ni comisiones.' },
            ].map(p => (
              <div key={p.num} style={{ background: 'var(--gray1)', padding: '2.5rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', color: 'var(--accent)', opacity: .35, lineHeight: 1, marginBottom: '1.5rem' }}>{p.num}</div>
                <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--white)', marginBottom: '.75rem' }}>{p.title}</div>
                <div style={{ fontSize: '14px', color: 'var(--gray4)', lineHeight: 1.7 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        )}

        {tabGuia === 'vender' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1px', background: 'var(--gray2)' }}>
            <div style={{ background: 'var(--gray1)', padding: '2.5rem' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--white)', lineHeight: 1.3, marginBottom: '1.5rem' }}>
                Descubrí cuánto vale tu vehículo y elegí el mejor momento para vender
              </div>
              <button className="btn-primary" style={{ fontSize: '14px', padding: '10px 24px' }} onClick={() => navigate('/catalogo')}>
                Cotizar →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--gray2)' }}>
              {[
                { num: '1', title: 'Ingresá los datos', desc: 'Proporcioná los detalles de tu vehículo y recibí una cotización al instante.' },
                { num: '2', title: 'Elegí una oferta', desc: 'Conocé nuestras opciones y elegí la que mejor se adapte a vos.' },
                { num: '3', title: 'Agendá la inspección', desc: 'Programá la hora y el lugar que más te convenga para recibir tu pago.' },
              ].map(p => (
                <div key={p.num} style={{ background: 'var(--gray1)', padding: '2rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', color: 'var(--accent)', opacity: .35, lineHeight: 1, marginBottom: '1.5rem' }}>{p.num}</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--white)', marginBottom: '.75rem' }}>{p.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.7 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FEATURED CARS */}
      <div style={{ padding: '4rem', borderTop: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Publicidad</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, marginBottom: '2rem' }}>ESPACIOS DESTACADOS</h2>
        {autos.length === 0
          ? <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no hay autos publicados. ¡Sé el primero en publicar!</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
              {autos.map(a => <CarCard key={a.id} auto={a} />)}
            </div>
        }
        <div style={{ marginTop: '2rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/catalogo')}>Ver todos los vehículos →</button>
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

      {/* FOOTER */}
      <footer style={{ background: '#050505', borderTop: '1px solid var(--gray2)', padding: '5rem 4rem 2rem', color: 'var(--gray4)', fontSize: '13px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: 'var(--white)', marginBottom: '1rem' }}>
              AUTO<span style={{ color: 'var(--accent)' }}>MARKET</span> AR
            </div>
            <p style={{ lineHeight: 1.6, marginBottom: '1.5rem' }}>
              La plataforma más avanzada para encontrar y publicar vehículos de agencias verificadas en Argentina.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Explorar</div>
            <Link to="/catalogo" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Catálogo de Autos</Link>
            <Link to="/concesionarias" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Red de Concesionarias</Link>
            <Link to="/registro" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Publicar mi stock</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Legales</div>
            <Link to="/legales" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Términos y Condiciones</Link>
            <Link to="/legales" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Políticas de Privacidad</Link>
            <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Defensa del Consumidor</a>
            <Link to="/arrepentimiento" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Botón de Arrepentimiento</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Contacto</div>
            <div>📍 Salta, Argentina</div>
            <div>✉️ soporte@automarket.ar</div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', cursor: 'pointer' }}>in</div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', cursor: 'pointer' }}>ig</div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
