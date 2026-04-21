import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, concesionaria, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'var(--black)', borderBottom: '1px solid var(--gray2)',
      padding: '0 2rem', height: '58px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between'
    }}>
      <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: 'var(--white)' }}>
        AUTO<span style={{ color: 'var(--accent)' }}>MARKET</span> AR
      </Link>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/catalogo" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500 }}>Catálogo</Link>
        <Link to="/concesionarias" style={{ fontSize: '13px', color: 'var(--gray4)', fontWeight: 500 }}>Concesionarias</Link>
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