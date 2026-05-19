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

const CAR_COLORS = ['#f5f3ee', '#e63329', '#185FA5', '#c9a84c', '#1a7a4a', '#7F77DD']

function CustomCursor() {
  const el = useRef(null)
  const [colorIdx, setColorIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setColorIdx(i => (i + 1) % CAR_COLORS.length), 2800)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.body.classList.add('custom-cursor-active')

    function onMove(e) {
      if (el.current) {
        el.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      }
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.body.classList.remove('custom-cursor-active')
    }
  }, [])

  if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return null

  const color = CAR_COLORS[colorIdx]

  return (
    <div ref={el} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 99999, willChange: 'transform', marginLeft: '-30px', marginTop: '-5px', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.8))' }}>
      <svg width="32" height="12" viewBox="0 0 32 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* perfil lateral minimalista — frente a la derecha */}
        <path
          d="M0 9 L4 9 L8 4 L22 4 L27 9 L32 9"
          stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'stroke .7s ease' }}
        />
        {/* rueda trasera */}
        <circle cx="6" cy="10.5" r="1.5" stroke={color} strokeWidth="1.5" style={{ transition: 'stroke .7s ease' }}/>
        {/* rueda delantera */}
        <circle cx="25" cy="10.5" r="1.5" stroke={color} strokeWidth="1.5" style={{ transition: 'stroke .7s ease' }}/>
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
  useEffect(() => {
    let t
    const onScroll = () => {
      document.body.classList.add('is-scrolling')
      clearTimeout(t)
      t = setTimeout(() => document.body.classList.remove('is-scrolling'), 600)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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