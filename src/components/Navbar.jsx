import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, concesionaria, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  function handleSearch(e) {
    e.preventDefault()
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
          <svg width="22" height="28" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="fioraL">
                <rect x="0" y="0" width="14" height="36"/>
              </clipPath>
              <clipPath id="fioraR">
                <rect x="14" y="0" width="14" height="36"/>
              </clipPath>
            </defs>
            <g clipPath="url(#fioraL)">
              <rect x="0" y="0" width="6" height="36" fill="#ffffff"/>
              <path d="M6,0 H20 Q28,0 28,9 Q28,18 20,18 H6 Z" fill="#ffffff"/>
              <polygon points="14,18 20,18 27,36 21,36" fill="#ffffff"/>
            </g>
            <g clipPath="url(#fioraR)">
              <rect x="0" y="0" width="6" height="36" fill="#e63329"/>
              <path d="M6,0 H20 Q28,0 28,9 Q28,18 20,18 H6 Z" fill="#e63329"/>
              <polygon points="14,18 20,18 27,36 21,36" fill="#e63329"/>
            </g>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', letterSpacing: '2px', color: 'var(--white)' }}>
            FIORA<span style={{ color: 'var(--accent)' }}> AR</span>
          </span>
        </Link>

        {/* DESKTOP: buscador + links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1, justifyContent: 'flex-end' }} className="nav-desktop">
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '6px 16px', maxWidth: '360px', width: '100%' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar vehículo, marca, modelo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '13px', outline: 'none', width: '100%', marginLeft: '10px', fontFamily: 'var(--font-body)' }} />
          </form>
          <Link to="/catalogo" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>Catálogo</Link>
          <Link to="/concesionarias" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>Concesionarias</Link>
          <Link to="/planes" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>Planes</Link>
          {user ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!concesionaria && !isAdmin && (
                <Link to="/favoritos" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>♡ Favoritos</Link>
              )}
              {(isAdmin || concesionaria) && (
                <Link to={isAdmin ? '/admin' : '/panel'}><button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}>{isAdmin ? 'Admin' : (concesionaria?.nombre || 'Mi panel')}</button></Link>
              )}
              <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }} onClick={handleSignOut}>Salir</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login"><button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}>Ingresar</button></Link>
              <Link to="/registro"><button className="btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }}>Publicar auto</button></Link>
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
          <Link to="/planes" onClick={() => setMenuOpen(false)} style={{ fontSize: '18px', color: 'var(--accent)', fontWeight: 700, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--gray2)' }}>Planes</Link>
          {user ? (
            <>
              {!concesionaria && !isAdmin && (
                <Link to="/favoritos" onClick={() => setMenuOpen(false)} style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 500, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--gray2)' }}>♡ Mis Favoritos</Link>
              )}
              {(isAdmin || concesionaria) && (
                <Link to={isAdmin ? '/admin' : '/panel'} onClick={() => setMenuOpen(false)} style={{ fontSize: '18px', color: 'var(--white)', fontWeight: 500, textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid var(--gray2)' }}>{isAdmin ? 'Panel Admin' : 'Mi Panel'}</Link>
              )}
              <button onClick={handleSignOut} style={{ background: 'transparent', border: '1px solid var(--gray3)', color: 'var(--white)', padding: '14px', borderRadius: 'var(--radius)', fontSize: '15px', cursor: 'pointer', marginTop: 'auto' }}>Cerrar sesión</button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
              <Link to="/login" onClick={() => setMenuOpen(false)}><button className="btn-secondary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>Ingresar</button></Link>
              <Link to="/registro" onClick={() => setMenuOpen(false)}><button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>Publicar auto</button></Link>
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