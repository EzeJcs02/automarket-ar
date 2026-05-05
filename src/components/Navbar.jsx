import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const { user, concesionaria, profesional, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [noLeidas, setNoLeidas] = useState(0)
  const [sugerencias, setSugerencias] = useState([])
  const [showSug, setShowSug] = useState(false)
  const debounceRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (!concesionaria) return
    supabase.from('consultas').select('id', { count: 'exact' }).eq('concesionaria_id', concesionaria.id).eq('leido', false)
      .then(({ count }) => setNoLeidas(count || 0))
    const channel = supabase.channel('consultas-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultas', filter: `concesionaria_id=eq.${concesionaria.id}` },
        () => setNoLeidas(n => n + 1))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [concesionaria])

  async function handleSignOut() {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  function handleBusquedaChange(val) {
    setBusqueda(val)
    clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 2) { setSugerencias([]); setShowSug(false); return }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase.from('autos')
        .select('id, marca, modelo, anio, tipo')
        .eq('activo', true)
        .or(`marca.ilike.%${val}%,modelo.ilike.%${val}%`)
        .limit(6)
      setSugerencias(data || [])
      setShowSug(true)
    }, 280)
  }

  function elegirSugerencia(a) {
    setShowSug(false)
    setBusqueda('')
    navigate(`/auto/${a.id}`)
  }

  function handleSearch(e) {
    e.preventDefault()
    setShowSug(false)
    if (busqueda.trim()) navigate(`/catalogo?q=${encodeURIComponent(busqueda.trim())}`)
    else navigate('/catalogo')
    setMenuOpen(false)
  }

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'var(--black)', borderBottom: '1px solid var(--gray2)',
        padding: '0 1.5rem', height: '58px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
          <img src="/fiora_logo.png" alt="Fiora Market Logo" style={{ height: '36px', mixBlendMode: 'lighten', borderRadius: '2px' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '2px', color: 'var(--white)' }}>
            FIORA<span style={{ color: 'var(--accent)' }}> MARKET</span>
          </span>
        </Link>

        {/* DESKTOP: buscador + links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1, justifyContent: 'flex-end' }} className="nav-desktop">
          <div ref={searchRef} style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '6px 16px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Buscar vehículo, marca, modelo..." value={busqueda}
                onChange={e => handleBusquedaChange(e.target.value)}
                onFocus={() => sugerencias.length > 0 && setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
                style={{ background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '13px', outline: 'none', width: '100%', marginLeft: '10px', fontFamily: 'var(--font-body)' }} />
            </form>
            {showSug && sugerencias.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                {sugerencias.map(a => (
                  <div key={a.id} onMouseDown={() => elegirSugerencia(a)}
                    style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray2)', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ fontSize: '13px', color: 'var(--white)', fontWeight: 500 }}>{a.marca} {a.modelo}</span>
                    <span style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)' }}>{a.anio} · {a.tipo}</span>
                  </div>
                ))}
                <div onMouseDown={handleSearch}
                  style={{ padding: '9px 16px', cursor: 'pointer', fontSize: '12px', color: 'var(--accent)', textAlign: 'center', fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Ver todos los resultados →
                </div>
              </div>
            )}
          </div>
          <Link to="/catalogo" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>Catálogo</Link>
          <Link to="/concesionarias" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>Concesionarias</Link>
          <Link to="/profesionales" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>Profesionales</Link>
          <Link to="/planes" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>Planes</Link>
          {user ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!concesionaria && !isAdmin && (
                <>
                  <Link to="/favoritos" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>♡ Favoritos</Link>
                  <Link to="/mi-cuenta"><button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}>Mi cuenta</button></Link>
                </>
              )}
              {(isAdmin || concesionaria || profesional) && (
                <>
                  {(isAdmin || concesionaria) && (
                    <Link to="/dashboard-analitico">
                      <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}>Analytics</button>
                    </Link>
                  )}
                  <Link to={isAdmin ? '/admin' : concesionaria ? '/panel' : '/panel-profesional'}>
                    <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px', position: 'relative' }}>
                      {isAdmin ? 'Admin' : concesionaria ? (concesionaria?.nombre || 'Mi panel') : (profesional?.nombre || 'Mi panel')}
                      {noLeidas > 0 && (
                        <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--accent)', color: '#fff', borderRadius: '100px', fontSize: '10px', fontWeight: 700, padding: '2px 6px', minWidth: '18px', textAlign: 'center', lineHeight: 1.4 }}>
                          {noLeidas > 99 ? '99+' : noLeidas}
                        </span>
                      )}
                    </button>
                  </Link>
                </>
              )}
              <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }} onClick={handleSignOut}>Salir</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login"><button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}>Ingresar</button></Link>
              <Link to="/registro"><button className="btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }}>Publicar vehículo</button></Link>
            </div>
          )}
        </div>

        {/* MOBILE: botón hamburguesa */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="nav-hamburger" style={{ background: 'transparent', border: 'none', color: 'var(--white)', cursor: 'pointer', padding: '8px', display: 'none', flexDirection: 'column', gap: '5px' }}>
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'var(--white)', transition: 'all .2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'var(--white)', transition: 'all .2s', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'var(--white)', transition: 'all .2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: '58px', left: 0, right: 0, bottom: 0, background: 'var(--black)', zIndex: 999, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="nav-mobile-menu">
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '10px 16px', width: '100%' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar vehículos..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '15px', outline: 'none', width: '100%', marginLeft: '10px', fontFamily: 'var(--font-body)' }} />
          </form>
          <Link to="/catalogo" onClick={() => setMenuOpen(false)} style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 500, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--gray2)' }}>Catálogo</Link>
          <Link to="/concesionarias" onClick={() => setMenuOpen(false)} style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 500, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--gray2)' }}>Concesionarias</Link>
          <Link to="/profesionales" onClick={() => setMenuOpen(false)} style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 500, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--gray2)' }}>Profesionales</Link>
          <Link to="/planes" onClick={() => setMenuOpen(false)} style={{ fontSize: '18px', color: 'var(--accent)', fontWeight: 700, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--gray2)' }}>Planes</Link>
          {user ? (
            <>
              {!concesionaria && !isAdmin && (
                <>
                  <Link to="/favoritos" onClick={() => setMenuOpen(false)} style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 500, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--gray2)' }}>♡ Mis Favoritos</Link>
                  <Link to="/mi-cuenta" onClick={() => setMenuOpen(false)} style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 500, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--gray2)' }}>Mi cuenta</Link>
                </>
              )}
              {(isAdmin || concesionaria || profesional) && (
                <Link to={isAdmin ? '/admin' : concesionaria ? '/panel' : '/panel-profesional'} onClick={() => setMenuOpen(false)} style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 500, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--gray2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isAdmin ? 'Panel Admin' : 'Mi Panel'}
                  {noLeidas > 0 && (
                    <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '100px', fontSize: '12px', fontWeight: 700, padding: '2px 8px' }}>
                      {noLeidas > 99 ? '99+' : noLeidas}
                    </span>
                  )}
                </Link>
              )}
              <button onClick={handleSignOut} style={{ background: 'transparent', border: '1px solid var(--gray3)', color: 'var(--white)', padding: '14px', borderRadius: 'var(--radius)', fontSize: '15px', cursor: 'pointer', marginTop: 'auto' }}>Cerrar sesión</button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
              <Link to="/login" onClick={() => setMenuOpen(false)}><button className="btn-secondary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>Ingresar</button></Link>
              <Link to="/registro" onClick={() => setMenuOpen(false)}><button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>Publicar vehículo</button></Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}