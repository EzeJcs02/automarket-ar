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
  const car = useRef(null)
  const body1 = useRef(null)
  const body2 = useRef(null)
  const [colorIdx, setColorIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setColorIdx(i => (i + 1) % CAR_COLORS.length), 2200)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.body.classList.add('custom-cursor-active')

    let cx = -100, cy = -100, tx = -100, ty = -100, raf

    function onMove(e) {
      tx = e.clientX; ty = e.clientY
      const hovered = !!e.target.closest('a, button, [role="button"], input, textarea, select, label')
      if (car.current) {
        car.current.style.filter = hovered
          ? `drop-shadow(0 0 5px ${CAR_COLORS[colorIdx]}) drop-shadow(0 0 2px #000)`
          : 'drop-shadow(0 2px 4px rgba(0,0,0,.6))'
        car.current.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -6px) scale(${hovered ? 1.15 : 1})`
      }
    }

    function loop() {
      cx += (tx - cx) * 0.6; cy += (ty - cy) * 0.6
      raf = requestAnimationFrame(loop)
    }

    document.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
      document.body.classList.remove('custom-cursor-active')
    }
  }, [colorIdx])

  if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return null

  const color = CAR_COLORS[colorIdx]
  const isDark = color === '#1a7a4a' || color === '#185FA5' || color === '#7F77DD'
  const glassColor = isDark ? 'rgba(200,230,255,0.55)' : 'rgba(30,30,50,0.65)'
  const detailColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'

  return (
    <div ref={car} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 99999, willChange: 'transform', transition: 'transform .1s, filter .2s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.6))' }}>
      <svg width="22" height="38" viewBox="0 0 22 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sombra base */}
        <ellipse cx="11" cy="35.5" rx="7.5" ry="1.8" fill="rgba(0,0,0,0.25)"/>

        {/* Ruedas traseras */}
        <rect x="0.5" y="22" width="4" height="8" rx="2" fill="#222"/>
        <rect x="1.5" y="23" width="2" height="6" rx="1" fill="#444"/>
        <rect x="17.5" y="22" width="4" height="8" rx="2" fill="#222"/>
        <rect x="18.5" y="23" width="2" height="6" rx="1" fill="#444"/>

        {/* Ruedas delanteras */}
        <rect x="0.5" y="8" width="4" height="8" rx="2" fill="#222"/>
        <rect x="1.5" y="9" width="2" height="6" rx="1" fill="#444"/>
        <rect x="17.5" y="8" width="4" height="8" rx="2" fill="#222"/>
        <rect x="18.5" y="9" width="2" height="6" rx="1" fill="#444"/>

        {/* Carrocería principal */}
        <path d="M4 10 C4 6 6.5 3.5 11 3.5 C15.5 3.5 18 6 18 10 L18 30 C18 33 15.5 34.5 11 34.5 C6.5 34.5 4 33 4 30 Z" fill={color} style={{ transition: 'fill .6s ease' }}/>

        {/* Detalle capó */}
        <path d="M6 9.5 L16 9.5 L15 12 L7 12 Z" fill={detailColor}/>

        {/* Espejo izquierdo */}
        <path d="M3 12 L4.5 11.5 L4.5 15 L3 14.5 Z" fill={color} style={{ transition: 'fill .6s ease' }}/>
        <path d="M3 12 L4.5 11.5 L4.5 15 L3 14.5 Z" fill="rgba(0,0,0,0.15)"/>
        {/* Espejo derecho */}
        <path d="M19 12 L17.5 11.5 L17.5 15 L19 14.5 Z" fill={color} style={{ transition: 'fill .6s ease' }}/>
        <path d="M19 12 L17.5 11.5 L17.5 15 L19 14.5 Z" fill="rgba(0,0,0,0.15)"/>

        {/* Parabrisas delantero */}
        <path d="M6.5 10 L15.5 10 L14.5 16.5 L7.5 16.5 Z" fill={glassColor}/>
        {/* Parabrisas trasero */}
        <path d="M7.5 25.5 L14.5 25.5 L15.5 30.5 L6.5 30.5 Z" fill={glassColor} opacity="0.75"/>

        {/* Techo */}
        <rect x="7" y="16.5" width="8" height="9" rx="1" fill={detailColor}/>

        {/* Línea puerta izq */}
        <line x1="4.5" y1="17" x2="4.5" y2="30" stroke="rgba(0,0,0,0.12)" strokeWidth="0.75"/>
        {/* Línea puerta der */}
        <line x1="17.5" y1="17" x2="17.5" y2="30" stroke="rgba(0,0,0,0.12)" strokeWidth="0.75"/>
        {/* Línea cintura */}
        <line x1="4" y1="21" x2="18" y2="21" stroke="rgba(0,0,0,0.1)" strokeWidth="0.75"/>

        {/* Luces delanteras */}
        <path d="M6 3.5 L9.5 4.5 L9.5 6.5 L6 6 Z" fill="#fff9c4" opacity="0.95"/>
        <path d="M16 3.5 L12.5 4.5 L12.5 6.5 L16 6 Z" fill="#fff9c4" opacity="0.95"/>
        {/* Brillo luces delanteras */}
        <path d="M6.5 4 L9 4.8 L9 5.8 L6.5 5.4 Z" fill="white" opacity="0.6"/>
        <path d="M15.5 4 L13 4.8 L13 5.8 L15.5 5.4 Z" fill="white" opacity="0.6"/>

        {/* Luces traseras */}
        <path d="M6 32 L9.5 31.5 L9.5 33.5 L6 34 Z" fill="#e63329" opacity="0.95"/>
        <path d="M16 32 L12.5 31.5 L12.5 33.5 L16 34 Z" fill="#e63329" opacity="0.95"/>
        {/* Brillo luz trasera */}
        <path d="M6.5 32.3 L9 31.9 L9 32.9 L6.5 33.3 Z" fill="#ff6b6b" opacity="0.5"/>
        <path d="M15.5 32.3 L13 31.9 L13 32.9 L15.5 33.3 Z" fill="#ff6b6b" opacity="0.5"/>
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