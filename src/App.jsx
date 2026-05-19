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
  const dot = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.body.classList.add('custom-cursor-active')

    let mx = -100, my = -100
    let rx = -100, ry = -100
    let raf

    function onMove(e) {
      mx = e.clientX
      my = e.clientY
      const el = e.target.closest('a, button, [role="button"], input, textarea, select, label')
      const hovered = !!el
      if (dot.current) {
        dot.current.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%) scale(${hovered ? 2.2 : 1})`
        dot.current.style.background = hovered ? 'var(--accent)' : 'var(--white)'
      }
    }

    function loop() {
      rx += (mx - rx) * 0.35
      ry += (my - ry) * 0.35
      if (ring.current) {
        ring.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`
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
    <>
      <div ref={dot} style={{ position: 'fixed', top: 0, left: 0, width: '4px', height: '4px', borderRadius: '50%', background: 'var(--white)', pointerEvents: 'none', zIndex: 99999, willChange: 'transform', transition: 'background .1s, transform .08s' }} />
      <div ref={ring} style={{ position: 'fixed', top: 0, left: 0, width: '18px', height: '18px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.4)', pointerEvents: 'none', zIndex: 99998, willChange: 'transform' }} />
    </>
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