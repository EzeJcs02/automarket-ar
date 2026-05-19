import Arrepentimiento from './pages/Arrepentimiento'
import Legales from './pages/Legales'
import NotFound from './pages/NotFound'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import PublicitateAqui from './pages/PublicitateAqui'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ComparadorProvider, useComparador } from './context/ComparadorContext'
import { ToastProvider } from './context/ToastContext'
import { useEffect, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Catalogo from './pages/Catalogo'
import AutoDetalle from './pages/AutoDetalle'
import { Concesionarias, ConcesionariaDetalle } from './pages/Concesionarias'
import { Login, Registro } from './pages/Auth'
import Panel from './pages/Panel'
import Admin from './pages/Admin'
import Planes from './pages/Planes'
import Favoritos from './pages/Favoritos'
import MiCuenta from './pages/MiCuenta'
import Comparador from './pages/Comparador'
import Profesionales from './pages/Profesionales'
import PanelProfesional from './pages/PanelProfesional'

function CustomCursor() {
  const car = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.body.classList.add('custom-cursor-active')

    let cx = -100, cy = -100
    let tx = -100, ty = -100
    let raf

    function onMove(e) {
      tx = e.clientX
      ty = e.clientY
      const hovered = !!e.target.closest('a, button, [role="button"], input, textarea, select, label')
      if (car.current) {
        car.current.style.opacity = hovered ? '0.75' : '1'
        car.current.style.filter = hovered ? 'drop-shadow(0 0 4px #e63329)' : 'none'
      }
    }

    function loop() {
      cx += (tx - cx) * 0.55
      cy += (ty - cy) * 0.55
      if (car.current) {
        car.current.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -8px)`
      }
      raf = requestAnimationFrame(loop)
    }

    document.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
      document.body.classList.remove('custom-cursor-active')
    }
  }, [])

  if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return null

  return (
    <div ref={car} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 99999, willChange: 'transform', transition: 'opacity .15s, filter .15s' }}>
      <svg width="18" height="30" viewBox="0 0 18 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ruedas traseras */}
        <rect x="0" y="18" width="3.5" height="6" rx="1.5" fill="#444"/>
        <rect x="14.5" y="18" width="3.5" height="6" rx="1.5" fill="#444"/>
        {/* Ruedas delanteras */}
        <rect x="0" y="6" width="3.5" height="6" rx="1.5" fill="#444"/>
        <rect x="14.5" y="6" width="3.5" height="6" rx="1.5" fill="#444"/>
        {/* Carrocería */}
        <rect x="2.5" y="3" width="13" height="24" rx="3.5" fill="#f5f3ee"/>
        {/* Techo / habitáculo */}
        <rect x="4" y="7" width="10" height="10" rx="2" fill="#1a1a1a" opacity="0.7"/>
        {/* Luces delanteras */}
        <rect x="3.5" y="2" width="4" height="2.5" rx="1" fill="#ffe57a"/>
        <rect x="10.5" y="2" width="4" height="2.5" rx="1" fill="#ffe57a"/>
        {/* Luces traseras */}
        <rect x="3.5" y="25.5" width="4" height="2.5" rx="1" fill="#e63329"/>
        <rect x="10.5" y="25.5" width="4" height="2.5" rx="1" fill="#e63329"/>
        {/* Línea central */}
        <line x1="9" y1="8" x2="9" y2="16" stroke="#333" strokeWidth="0.75" opacity="0.5"/>
      </svg>
    </div>
  )
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title="Volver arriba"
      style={{ position: 'fixed', bottom: '90px', left: '1.25rem', zIndex: 900, width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gray2)', border: '1px solid var(--gray3)', color: 'var(--white)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.4)', transition: 'all .2s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--gray2)'}>
      ↑
    </button>
  )
}

function ComparadorBar() {
  const { lista, quitar, limpiar } = useComparador()
  const navigate = useNavigate()
  const location = useLocation()
  if (lista.length === 0 || location.pathname === '/comparador') return null
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111', borderTop: '1px solid var(--accent)', zIndex: 500, padding: '12px 2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em', flexShrink: 0 }}>
        Comparador · {lista.length}/3
      </div>
      <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
        {lista.map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gray2)', padding: '5px 10px', borderRadius: '100px', fontSize: '12px' }}>
            <span>{a.marca} {a.modelo}</span>
            <button onClick={() => quitar(a.id)} style={{ background: 'none', border: 'none', color: 'var(--gray4)', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={() => navigate('/comparador')} className="btn-primary" style={{ padding: '8px 18px', fontSize: '12px' }}>Comparar →</button>
        <button onClick={limpiar} style={{ background: 'none', border: '1px solid var(--gray3)', color: 'var(--gray4)', padding: '8px 14px', borderRadius: 'var(--radius)', fontSize: '12px', cursor: 'pointer' }}>Limpiar</button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <ComparadorProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="*" element={
            <>
              <Navbar />
              <div style={{ minHeight: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/auto/:id" element={<AutoDetalle />} />
                <Route path="/concesionarias" element={<Concesionarias />} />
                <Route path="/concesionaria/:id" element={<ConcesionariaDetalle />} />
                <Route path="/panel" element={<Panel />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/profesionales" element={<Profesionales />} />
                <Route path="/panel-profesional" element={<PanelProfesional />} />
                <Route path="/planes" element={<Planes />} />
                <Route path="/favoritos" element={<Favoritos />} />
                <Route path="/mi-cuenta" element={<MiCuenta />} />
                <Route path="/comparador" element={<Comparador />} />
                <Route path="/legales" element={<Legales />} />
                <Route path="/arrepentimiento" element={<Arrepentimiento />} />
                <Route path="/publicitate" element={<PublicitateAqui />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </div>
              <Footer />
              </div>
              <ComparadorBar />
              <ScrollToTop />
              <CookieBanner />
              <CustomCursor />
              <Analytics />
            </>
          } />
        </Routes>
      </BrowserRouter>
      </ComparadorProvider>
      </ToastProvider>
    </AuthProvider>
  )
}