import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ComparadorProvider, useComparador } from './context/ComparadorContext'
import { ToastProvider } from './context/ToastContext'
import { ConfirmProvider } from './context/ConfirmContext'
import { useEffect, useState, lazy, Suspense } from 'react'
import { AnimatePresence, MotionConfig, motion as Motion } from 'motion/react'
import Navbar from './components/Navbar'
import Button from './components/ui/Button'
import Icon from './components/ui/Icon'
import './App.css'

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
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
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
  return (
    <AnimatePresence>
      {visible && (
        <Motion.button type="button" className="to-top" aria-label="Volver arriba"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}>
          <Icon name="arrowUp" size={18} />
        </Motion.button>
      )}
    </AnimatePresence>
  )
}

function ComparadorBar() {
  const { lista, quitar, limpiar } = useComparador()
  const navigate = useNavigate()
  const location = useLocation()
  const visible = lista.length > 0 && location.pathname !== '/comparador'
  return (
    <AnimatePresence>
      {visible && (
        <Motion.aside className="compare-dock" aria-label="Comparador"
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}>
          <div className="compare-dock__inner">
            <div className="compare-dock__label"><Icon name="compare" size={16} />Comparador <span className="tabular">{lista.length}/3</span></div>
            <ul className="compare-dock__items">
              {lista.map(a => (
                <li key={a.id} className="compare-dock__item">
                  {a.marca} {a.modelo}
                  <button type="button" aria-label={`Quitar ${a.marca} ${a.modelo} del comparador`} onClick={() => quitar(a.id)}><Icon name="close" size={14} /></button>
                </li>
              ))}
            </ul>
            <div className="compare-dock__actions">
              <Button variant="ghost" size="sm" onClick={limpiar}>Limpiar</Button>
              <Button size="sm" onClick={() => navigate('/comparador')}>Comparar<Icon name="arrowRight" size={16} /></Button>
            </div>
          </div>
        </Motion.aside>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const [analyticsOk, setAnalyticsOk] = useState(() => localStorage.getItem('cookie_consent') === 'accepted')

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
      <ConfirmProvider>
      <ComparadorProvider>
      <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/restablecer-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
          <Route path="*" element={
            <>
              <Navbar />
              <div className="app-shell">
              <main id="contenido" tabIndex={-1} className="app-main">
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
              </main>
              <Footer />
              </div>
              <ComparadorBar />
              <ScrollToTop />
              <CookieBanner onConsent={setAnalyticsOk} />
              {analyticsOk && <Analytics />}
            </>
          } />
        </Routes>
      </BrowserRouter>
      </MotionConfig>
      </ComparadorProvider>
      </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  )
}