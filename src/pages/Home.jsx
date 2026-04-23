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
            Plataforma N°1 de vehículos en Argentina
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(60px,10vw,130px)', lineHeight: 1.05, letterSpacing: '2px', marginBottom: '2rem' }}>
            ENCONTRÁ<br />TU PRÓXIMO<br /><span style={{ color: 'var(--accent)' }}>VEHÍCULO</span>
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--gray4)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '3rem' }}>
            Miles de vehículos nuevos y usados de las mejores concesionarias de Argentina. Filtrá, compará y contactá directo.
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

      {/* FEATURED CARS */}
      <div style={{ padding: '4rem', borderTop: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Publicidad</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,64px)', lineHeight: 1, marginBottom: '2rem' }}>VEHÍCULOS DESTACADOS</h2>
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

      {/* EXPLORAR POR TIPO */}
      <div style={{ padding: '4rem', borderTop: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Catálogo</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1, marginBottom: '2.5rem' }}>EXPLORAR POR TIPO DE VEHÍCULO</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { tipo: 'Camioneta', svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="2" y="14" width="60" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M4 14 L10 6 L40 6 L50 14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="10" y="7" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'SUV',       svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="2" y="14" width="60" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M5 14 L12 5 L52 5 L59 14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="13" y="6" width="38" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'Hatchback', svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="4" y="15" width="56" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 15 L18 6 L46 6 L56 15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="19" y="7" width="26" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="16" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="48" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'Sedán',     svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="3" y="15" width="58" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M6 15 L14 7 L50 7 L58 15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="16" y="8" width="22" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="49" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'Pickup',    svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="2" y="14" width="60" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M4 14 L10 6 L32 6 L36 14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="10" y="7" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><line x1="36" y1="14" x2="36" y2="26" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'Minivan',   svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="2" y="12" width="60" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M4 12 L8 4 L56 4 L60 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="9" y="5" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="30" y="5" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="14" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
            { tipo: 'Coupé',     svg: <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:64,height:32}}><rect x="3" y="16" width="58" height="10" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M6 16 L20 7 L44 7 L58 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><rect x="21" y="8" width="18" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="26" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="49" cy="26" r="4" stroke="currentColor" strokeWidth="2"/></svg> },
          ].map(({ tipo, svg }) => (
            <button key={tipo} onClick={() => navigate(`/catalogo?tipo=${tipo}`)}
              className="tipo-card"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '1.5rem 2rem', background: 'var(--black)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'border-color .2s, background .2s, color .2s', minWidth: '110px', color: 'var(--gray4)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#110000'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray2)'; e.currentTarget.style.background = 'var(--black)'; e.currentTarget.style.color = 'var(--gray4)' }}>
              {svg}
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--white)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{tipo}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* FOOTER */}
      <footer style={{ background: '#050505', borderTop: '1px solid var(--gray2)', padding: '5rem 4rem 2rem', color: 'var(--gray4)', fontSize: '13px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: 'var(--white)', marginBottom: '1rem' }}>
              FIORA.<span style={{ color: 'var(--accent)' }}>MARKET</span>
            </div>
            <p style={{ lineHeight: 1.6, marginBottom: '1.5rem' }}>
              La plataforma más avanzada para encontrar y publicar vehículos de agencias verificadas en Argentina.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Explorar</div>
            <Link to="/catalogo" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Catálogo de Vehículos</Link>
            <Link to="/concesionarias" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Red de Concesionarias</Link>
            <Link to="/planes" style={{ color: 'var(--gray4)', textDecoration: 'none' }}>Planes y Precios</Link>
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
            <div style={{ color: 'var(--gray4)', fontSize: '14px' }}>Salta, Argentina</div>
            <div style={{ color: 'var(--gray4)', fontSize: '14px' }}>soporte@fiora.ar</div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              
              {/* ACÁ ESTÁ EL ICONO DE INSTAGRAM MODIFICADO */}
              <a href="https://www.instagram.com/fiora.market?igsh=MW1jZGR1bXF5em52bw%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', textDecoration: 'none', cursor: 'pointer', transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = '#E1306C'} onMouseLeave={e => e.currentTarget.style.background = 'var(--gray2)'}>
                ig
              </a>

            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>© 2026 FIORA.MARKET. Todos los derechos reservados.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '40px', background: 'var(--gray2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', textAlign: 'center', lineHeight: 1 }}>DATA<br/>FISCAL</div>
            <span style={{ fontSize: '11px' }}>Sitio Seguro</span>
          </div>
        </div>
      </footer>
    </div>
  )
}