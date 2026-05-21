import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ComparadorProvider, useComparador } from './context/ComparadorContext'
import { ToastProvider } from './context/ToastContext'
import { useEffect, useState, lazy, Suspense } from 'react'
import Navbar from './components/Navbar'

// Home se carga eager (es la primera vista)
import Home from './pages/Home'

// Login/Registro se cargan eager (suelen ser el segundo paso)
import { Login, Registro } from './pages/Auth'

// El resto se carga on-demand
const Catalogo = lazy(() => import('./pages/Catalogo'))
const AutoDetalle = lazy(() => import('./pages/AutoDetalle'))
const Concesionarias = lazy(() => import('./pages/Concesionarias').then(m => ({ default: m.Concesionarias })))
const ConcesionariaDetalle = lazy(() => import('./pages/Concesionarias').then(m => ({ default: m.ConcesionariaDetalle })))
const Panel = lazy(() => import('./pages/Panel'))
const Admin = lazy(() => import('./pages/Admin'))
const Planes = lazy(() => import('./pages/Planes'))
const Favoritos = lazy(() => import('./pages/Favoritos'))
const MiCuenta = lazy(() => import('./pages/MiCuenta'))
const Comparador = lazy(() => import('./pages/Comparador'))
const Profesionales = lazy(() => import('./pages/Profesionales'))
const PanelProfesional = lazy(() => import('./pages/PanelProfesional'))
const Arrepentimiento = lazy(() => import('./pages/Arrepentimiento'))
const Legales = lazy(() => import('./pages/Legales'))
const PublicitateAqui = lazy(() => import('./pages/PublicitateAqui'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return <div className="page-wrapper"><div className="spinner" /></div>
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
              <Suspense fallback={<PageLoader />}>
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
              </Suspense>
              </div>
              <Footer />
              </div>
              <ComparadorBar />
              <ScrollToTop />
              <CookieBanner />
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