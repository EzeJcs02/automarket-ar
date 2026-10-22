import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion as Motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useModalA11y } from '../lib/useModalA11y'
import SearchCombobox from './SearchCombobox'
import Button from './ui/Button'
import Icon from './ui/Icon'
import './Navbar.css'

const LINKS = [
  ['/catalogo', 'Catálogo'],
  ['/concesionarias', 'Concesionarias'],
  ['/profesionales', 'Profesionales'],
  ['/planes', 'Planes'],
]

function Wordmark() {
  return (
    <Link to="/" className="nav__brand" aria-label="FIORA MARKET, inicio">
      <img src="/fiora_logo.png" alt="" className="nav__logo" />
      <span className="nav__wordmark">FIORA<span> MARKET</span></span>
    </Link>
  )
}

export default function Navbar() {
  const { user, concesionaria, profesional, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [busqueda, setBusqueda] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [noLeidas, setNoLeidas] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const sheetRef = useRef(null)

  useModalA11y(sheetRef, () => setMenuOpen(false), menuOpen)

  useEffect(() => {
    if (!concesionaria) return
    supabase.from('consultas').select('id', { count: 'exact', head: true }).eq('concesionaria_id', concesionaria.id).eq('leido', false)
      .then(({ count }) => setNoLeidas(count || 0))
    const channel = supabase.channel('consultas-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultas', filter: `concesionaria_id=eq.${concesionaria.id}` },
        () => setNoLeidas(n => n + 1))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [concesionaria])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cerrar el menú al navegar (ajuste de estado durante el render, sin efecto)
  const [ultimaRuta, setUltimaRuta] = useState(location.pathname)
  if (ultimaRuta !== location.pathname) {
    setUltimaRuta(location.pathname)
    setMenuOpen(false)
  }

  // Bloquear el scroll de fondo mientras el menú está abierto
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [menuOpen])

  async function handleSignOut() {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  function handleSearch(e) {
    e.preventDefault()
    const q = busqueda.trim()
    navigate(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo')
    setBusqueda('')
    setMenuOpen(false)
  }

  const esParticular = user && !concesionaria && !isAdmin
  const tienePanel = isAdmin || concesionaria || profesional
  const panelTo = isAdmin ? '/admin' : concesionaria ? '/panel' : '/panel-profesional'
  const panelLabel = isAdmin ? 'Admin' : concesionaria ? (concesionaria?.nombre || 'Mi panel') : (profesional?.nombre || 'Mi panel')
  const badge = noLeidas > 0 && <span className="nav__count" aria-label={`${noLeidas} consultas sin leer`}>{noLeidas > 99 ? '99+' : noLeidas}</span>

  const searchForm = (extra = '') => (
    <form onSubmit={handleSearch} className={`nav__search ${extra}`} role="search">
      <Icon name="search" size={16} className="nav__search-icon" />
      <SearchCombobox value={busqueda} onChange={setBusqueda} placeholder="Marca, modelo…" inputClassName="nav__search-input" />
    </form>
  )

  return (
    <>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nav__inner">
          <Wordmark />

          <nav className="nav__links" aria-label="Principal">
            {LINKS.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}>{label}</NavLink>
            ))}
          </nav>

          <div className="nav__actions">
            {searchForm('nav__search--desktop')}
            {user ? (
              <>
                {esParticular && (
                  <NavLink to="/favoritos" className="nav__icon-btn" aria-label="Favoritos" title="Favoritos"><Icon name="heart" /></NavLink>
                )}
                {esParticular && <Button to="/mi-cuenta" variant="secondary" size="sm">Mi cuenta</Button>}
                {tienePanel && (
                  <Button to={panelTo} variant="secondary" size="sm" className="nav__panel-btn">
                    <span className="nav__panel-label">{panelLabel}</span>{badge}
                  </Button>
                )}
                <button type="button" className="nav__icon-btn" onClick={handleSignOut} aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" /></button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav__link">Ingresar</Link>
                <Button to="/registro" size="sm">Publicar vehículo</Button>
              </>
            )}
          </div>

          <button type="button" className="nav__burger" onClick={() => setMenuOpen(true)} aria-label="Abrir menú" aria-expanded={menuOpen} aria-controls="menu-movil">
            <Icon name="menu" size={22} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <Motion.div
            id="menu-movil" ref={sheetRef} className="nav-sheet"
            role="dialog" aria-modal="true" aria-label="Menú"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="nav-sheet__head">
              <Wordmark />
              <button type="button" className="nav__icon-btn" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><Icon name="close" size={22} /></button>
            </div>
            <Motion.div className="nav-sheet__body"
              initial={{ y: 12 }} animate={{ y: 0 }} transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}>
              {searchForm('nav__search--sheet')}
              <nav className="nav-sheet__links" aria-label="Principal">
                {LINKS.map(([to, label]) => (
                  <NavLink key={to} to={to} className={({ isActive }) => `nav-sheet__link ${isActive ? 'is-active' : ''}`}>
                    {label}<Icon name="arrowRight" size={18} />
                  </NavLink>
                ))}
                {esParticular && <NavLink to="/favoritos" className="nav-sheet__link">Mis favoritos<Icon name="arrowRight" size={18} /></NavLink>}
                {esParticular && <NavLink to="/mi-cuenta" className="nav-sheet__link">Mi cuenta<Icon name="arrowRight" size={18} /></NavLink>}
                {tienePanel && <NavLink to={panelTo} className="nav-sheet__link">{isAdmin ? 'Panel admin' : 'Mi panel'}{badge}<Icon name="arrowRight" size={18} /></NavLink>}
              </nav>
              <div className="nav-sheet__foot">
                {user
                  ? <Button variant="secondary" size="lg" block onClick={handleSignOut}>Cerrar sesión</Button>
                  : <>
                      <Button to="/registro" size="lg" block>Publicar vehículo</Button>
                      <Button to="/login" variant="secondary" size="lg" block>Ingresar</Button>
                    </>}
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
