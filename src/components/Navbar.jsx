import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, concesionaria, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function handleSearch(e) {
    e.preventDefault()
    if (busqueda.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(busqueda.trim())}`)
      // Opcional: setBusqueda('') si querés que la barra se limpie después de buscar
    } else {
      navigate('/catalogo')
    }
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'var(--black)', borderBottom: '1px solid var(--gray2)',
      padding: '0 2rem', height: '58px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between'
    }}>
      
      {/* LADO IZQUIERDO: Logo + Buscador */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flex: 1 }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: 'var(--white)', textDecoration: 'none' }}>
          AUTO<span style={{ color: 'var(--accent)' }}>MARKET</span> AR
        </Link>

        {/* BARRA DE BÚSQUEDA GLOBAL */}
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: '100px', padding: '6px 16px', maxWidth: '300px', width: '100%' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar autos..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '13px', outline: 'none', width: '100%', marginLeft: '10px', fontFamily: 'var(--font-body)' }}
          />
        </form>
      </div>

      {/* LADO DERECHO: Links y Botones de Usuario */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/catalogo" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500, textDecoration: 'none' }}>Catálogo</Link>
        <Link to="/concesionarias" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500, textDecoration: 'none' }}>Concesionarias</Link>
        {user ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to={isAdmin ? '/admin' : '/panel'}>
              <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}>
                {isAdmin ? 'Admin' : (concesionaria?.nombre || 'Mi panel')}
              </button>
            </Link>
            <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }} onClick={handleSignOut}>
              Salir
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login">
              <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}>Ingresar</button>
            </Link>
            <Link to="/registro">
              <button className="btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }}>Publicar auto</button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}