import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CarCard from '../components/CarCard'

export default function Home() {
  const navigate = useNavigate()
  const [autos, setAutos] = useState([])
  const [concesionarias, setConcesionarias] = useState([])
  const [busqueda, setBusqueda] = useState('')

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

  function handleBuscar(e) {
    e.preventDefault()
    if (busqueda.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(busqueda)}`)
    } else {
      navigate('/catalogo')
    }
  }

  return (
    <div>
      {/* --- HERO CON BUSCADOR PREMIUM Y AJUSTE DE TAMAÑO --- */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '4rem', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: .04, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,var(--white) 60px,var(--white) 61px)' }} />
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.15) 0%, transparent 70%)' }} />
        
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Plataforma N°1 de autos en Argentina
          </div>
          {/* AJUSTE TIPOGRÁFICO: clamp bajado de 160px max a 110px max, y 12vw a 9vw */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(64px,9vw,110px)', lineHeight: 1.0, letterSpacing: '2px', marginBottom: '2rem', color: 'var(--white)' }}>
            ENCONTRÁ<br />TU PRÓXIMO<br /><span style={{ color: 'var(--accent)' }}>AUTO</span>
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--gray4)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Miles de autos nuevos y usados de las mejores concesionarias de Argentina. Filtrá, comparé y contactá directo.
          </p>

          {/* BARRA DE BÚSQUEDA CON ICONO SVG LIMPIO */}
          <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '10px', maxWidth: '540px', marginBottom: '2.5rem', background: 'rgba(26, 26, 26, 0.7)', backdropFilter: 'blur(10px)', padding: '10px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            {/* ICONO SVG LIMPIO EN LUGAR DEL EMOJI */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', color: 'var(--gray4)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              placeholder="Ej: Corolla, Amarok, 2024..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '16px', outline: 'none', width: '100%', fontFamily: 'var(--font-body)' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '14px 32px', whiteSpace: 'nowrap' }}>
              Buscar ahora
            </button>
          </form>

          {/* BOTONES SECUNDARIOS */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--gray4)', fontSize: '14px', cursor: 'pointer', fontWeight: 500, transition: 'color .2s' }} onClick={() => navigate('/catalogo')} onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--gray4)'}>
              Explorar todo el catálogo
            </button>
            <div style={{ width: '4px', height: '4px', background: 'var(--gray3)', borderRadius: '50%' }} />
            <button style={{ background: 'transparent', border: 'none', color: 'var(--gray4)', fontSize: '14px', cursor: 'pointer', fontWeight: 500, transition: 'color .2s' }} onClick={() => navigate('/concesionarias')} onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--gray4)'}>
              Ver red de concesionarias →
            </button>
          </div>

          <div style={{ display: 'flex', gap: '3rem', marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', color: 'var(--white)' }}>{autos.length > 0 ? `${autos.length}+` : '—'}</div><div style={{ fontSize: '12px', color: 'var(--gray5)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Autos publicados</div></div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', color: 'var(--white)' }}>{concesionarias.length > 0 ? concesionarias.length : '—'}</div><div style={{ fontSize: '12px', color: 'var(--gray5)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>Concesionarias</div></div>
          </div>
        </div>
      </div>

      {/* --- FEATURED CARS --- */}
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

      {/* --- DEALERS --- */}
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

      {/* --- FOOTER --- */}
      <div style={{ padding: '3rem 4rem', background: '#050505', borderTop: '1px solid var(--gray2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px' }}>AUTO<span style={{ color: 'var(--accent)' }}>MARKET</span> AR</div>
        <div style={{ fontSize: '13px', color: 'var(--gray5)' }}>© 2026 AutoMarket AR</div>
        <Link to="/registro" style={{ fontSize: '13px', color: 'var(--gray4)', transition: 'color .2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--gray4)'}>
          Acceso Concesionarias →
        </Link>
      </div>
    </div>
  )
}