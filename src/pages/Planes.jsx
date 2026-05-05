import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { setPageMeta } from '../lib/seo'

const PLANES = [
  {
    id: 'basico',
    nombre: 'BÁSICO',
    precio: '30.000',
    color: 'var(--gray4)',
    border: 'var(--gray2)',
    publicaciones: 8,
    beneficios: [
      'Hasta 8 vehículos publicados',
      'Publicaciones por 30 días',
      'Perfil de agencia en directorio',
      'Renovación paga disponible',
    ],
    noIncluye: ['Destacados incluidos', 'Mejor posicionamiento', 'Badge verificada'],
  },
  {
    id: 'pro',
    nombre: 'PRO',
    precio: '70.000',
    color: '#e0a020',
    border: 'rgba(224,160,32,.5)',
    publicaciones: 20,
    tag: 'MÁS POPULAR',
    beneficios: [
      'Hasta 20 vehículos publicados',
      'Publicaciones por 30 días',
      '5 destacados incluidos por mes',
      'Mejor posicionamiento en resultados',
      'Renovación paga disponible',
    ],
    noIncluye: ['Destacados ilimitados', 'Badge verificada'],
  },
  {
    id: 'premium',
    nombre: 'PREMIUM',
    precio: '150.000',
    color: 'var(--accent)',
    border: 'rgba(230,51,41,.5)',
    publicaciones: 50,
    beneficios: [
      'Hasta 50 vehículos publicados',
      'Publicaciones por 30 días',
      '15 destacados incluidos por mes',
      'Máxima prioridad en resultados',
      'Badge "Agencia Verificada"',
      'Renovación paga disponible',
    ],
    noIncluye: [],
  },
]

const COMPARACION = [
  { label: 'Publicaciones activas', basico: '8', pro: '20', premium: '50' },
  { label: 'Duración por publicación', basico: '30 días', pro: '30 días', premium: '30 días' },
  { label: 'Destacados incluidos', basico: '—', pro: '5/mes', premium: '15/mes' },
  { label: 'Posicionamiento', basico: 'Estándar', pro: 'Prioritario', premium: 'Máximo' },
  { label: 'Badge verificada', basico: false, pro: false, premium: true },
  { label: 'Perfil en directorio', basico: true, pro: true, premium: true },
  { label: 'Vehículos extra (c/u)', basico: '$10.000/mes', pro: '$10.000/mes', premium: '$10.000/mes' },
]

const BOOSTS = [
  {
    nombre: 'Destacado individual',
    precio: '12.000',
    desc: 'Destacá un vehículo en particular por 30 días con fondo diferenciado.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  {
    nombre: 'Pack 10 destacados',
    precio: '95.000',
    desc: 'Destacá hasta 10 vehículos. Ahorrás $25.000 vs precio unitario.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  },
  {
    nombre: 'Urgente',
    precio: '20.000',
    desc: 'Máxima visibilidad. Badge rojo "URGENTE" en tu publicación.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  },
  {
    nombre: 'Subir al tope',
    precio: '10.000',
    desc: 'Tu publicación vuelve al primer lugar dentro de su categoría.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
  },
]

const PUBLICIDAD = [
  {
    nombre: 'Banner en Home',
    tipo: 'banner_home',
    precio: '120.000',
    desc: 'Tu banner publicitario visible en la página de inicio por 30 días.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  },
  {
    nombre: 'Vehículo fijado en Home',
    tipo: 'fijado_home',
    precio: '80.000',
    desc: 'Tu vehículo aparece fijo en la sección destacada del inicio por 30 días.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  },
]

function CheckIcon({ color = '#4ade80' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

async function pagarConMP(tipo, { auto_id = null, concesionaria_id = null, profesional_id = null, user_id = null, user_email = null, origen = 'planes' } = {}, onError = (m) => alert(m)) {
  try {
    const res = await fetch('/api/mp-create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, auto_id, concesionaria_id, profesional_id, user_id, user_email, origen }),
    })
    const data = await res.json()
    if (data.init_point) window.location.href = data.init_point
    else onError('Error al iniciar el pago. Intentá nuevamente.')
  } catch {
    onError('Error de conexión. Intentá nuevamente.')
  }
}

export default function Planes() {
  const navigate = useNavigate()
  const { user, concesionaria, profesional } = useAuth()
  const { toast } = useToast()
  const pay = (tipo, opts) => pagarConMP(tipo, opts, msg => toast(msg, 'error'))

  useEffect(() => { setPageMeta({ title: 'Planes y Precios', description: 'Publicá tu concesionaria en FIORA MARKET. Planes desde gratis hasta Premium con hasta 50 publicaciones, boosts y badge verificada.', path: '/planes' }) }, [])

  function handlePlan(planId) {
    if (concesionaria) {
      pay(`plan_${planId}`, { concesionaria_id: concesionaria.id, user_id: user?.id, user_email: user?.email })
    } else {
      navigate('/login')
    }
  }

  function handleBannerHome() {
    if (concesionaria) {
      pay('banner_home', { concesionaria_id: concesionaria.id, user_id: user?.id, user_email: user?.email })
    } else {
      navigate('/login')
    }
  }

  function handleBoost() {
    if (concesionaria) navigate('/panel')
    else if (user) navigate('/mi-cuenta')
    else navigate('/login')
  }

  function handleFijadoHome() {
    if (concesionaria) navigate('/panel')
    else navigate('/login')
  }

  function handleExtrasIndividual() {
    if (user) navigate('/mi-cuenta')
    else navigate('/login')
  }

  function handlePlanProfesional(tipo) {
    if (profesional) {
      pay(tipo, { profesional_id: profesional.id, user_id: user?.id, user_email: user?.email, origen: 'planes' })
    } else {
      navigate('/registro')
    }
  }

  return (
    <div className="page-wrapper">

      {/* HERO */}
      <div className="planes-section planes-hero" style={{ position: 'relative', borderBottom: '1px solid var(--gray2)', background: 'var(--black)', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Planes y precios</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,7vw,96px)', lineHeight: 1, marginBottom: '1.5rem' }}>
            VISIBILIDAD<br /><span style={{ color: 'var(--accent)' }}>QUE VENDE</span>
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--gray4)', maxWidth: '520px', margin: '0 auto 3rem', lineHeight: 1.7 }}>
            El que más invierte, más aparece. Publicaciones de <strong style={{ color: 'var(--white)' }}>30 días</strong> con renovación paga. Sin contratos. Sin permanencia.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(74,222,128,.07)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 'var(--radius-lg)', padding: '.75rem 1.25rem', fontSize: '13px', color: 'var(--gray4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckIcon /> Compradores particulares — <strong style={{ color: 'var(--white)' }}>GRATIS</strong>
            </div>
            <div style={{ background: 'rgba(230,51,41,.07)', border: '1px solid rgba(230,51,41,.2)', borderRadius: 'var(--radius-lg)', padding: '.75rem 1.25rem', fontSize: '13px', color: 'var(--gray4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" style={{ flexShrink: 0 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Agencias — desde <strong style={{ color: 'var(--white)' }}>$30.000/mes</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PLANES AGENCIA - CARDS */}
      <div className="planes-section" style={{ borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Para agencias y concesionarias</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,56px)', lineHeight: 1, marginBottom: '.75rem' }}>PLANES DE AGENCIA</h2>
        <p style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '3rem' }}>Vehículo extra por encima del límite del plan: <strong style={{ color: 'var(--white)' }}>$10.000/mes c/u</strong></p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {PLANES.map(p => {
            const isPro = p.id === 'pro'
            return (
              <div key={p.id} className={`plan-card plan-card-${p.id}`} style={{
                background: isPro ? 'rgba(224,160,32,.05)' : 'var(--gray1)',
                border: `1px solid ${p.border}`,
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem',
                display: 'flex', flexDirection: 'column',
                position: 'relative', overflow: 'hidden',
                boxShadow: isPro ? '0 0 40px rgba(224,160,32,.12)' : 'none',
              }}>
                {isPro && (
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top center, rgba(224,160,32,.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
                )}
                {p.tag && (
                  <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: p.color, color: '#000', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', letterSpacing: '.1em' }}>{p.tag}</div>
                )}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.15em', color: p.color, marginBottom: '.75rem' }}>{p.nombre}</div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--white)', lineHeight: 1 }}>${p.precio}</span>
                  <span style={{ fontSize: '13px', color: 'var(--gray4)', marginLeft: '6px' }}>ARS/mes</span>
                </div>
                <div style={{ fontSize: '13px', color: p.color, fontWeight: 600, marginBottom: '2rem', fontFamily: 'var(--font-mono)', paddingBottom: '1.5rem', borderBottom: '1px solid var(--gray2)' }}>
                  {p.publicaciones} publicaciones activas
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {p.beneficios.map(b => (
                    <li key={b} style={{ fontSize: '13px', color: 'var(--gray4)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckIcon color={p.color} /> {b}
                    </li>
                  ))}
                  {p.noIncluye.map(b => (
                    <li key={b} style={{ fontSize: '13px', color: 'var(--gray3)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XIcon /> {b}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlan(p.id)}
                  className={p.id === 'premium' ? 'btn-primary' : ''}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'opacity .2s', letterSpacing: '.04em',
                    ...(p.id === 'pro' ? { background: '#e0a020', color: '#000', border: 'none' } : {}),
                    ...(p.id === 'basico' ? { background: 'var(--gray2)', color: 'var(--white)', border: 'none' } : {}),
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  {concesionaria ? 'Contratar con MercadoPago →' : 'Iniciar sesión para contratar →'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* TABLA COMPARATIVA */}
      <div className="planes-section" style={{ borderBottom: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Comparación detallada</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,48px)', lineHeight: 1, marginBottom: '2.5rem' }}>¿QUÉ INCLUYE CADA PLAN?</h2>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--black)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: '480px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gray2)' }}>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '12px', color: 'var(--gray4)', fontWeight: 400, width: '40%' }}>Característica</th>
                {PLANES.map(p => (
                  <th key={p.id} style={{ padding: '1rem', textAlign: 'center', fontSize: '12px', color: p.color, fontWeight: 700, letterSpacing: '.1em', fontFamily: 'var(--font-mono)' }}>{p.nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARACION.map((row, i) => (
                <tr key={row.label} style={{ borderBottom: '1px solid var(--gray2)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                  <td style={{ padding: '.875rem 1.25rem', fontSize: '13px', color: 'var(--gray4)' }}>{row.label}</td>
                  {['basico', 'pro', 'premium'].map(k => (
                    <td key={k} style={{ padding: '.875rem 1rem', textAlign: 'center', fontSize: '13px', color: 'var(--white)' }}>
                      {typeof row[k] === 'boolean'
                        ? row[k]
                          ? <CheckIcon color={PLANES.find(p => p.id === k).color} />
                          : <XIcon />
                        : <span style={{ color: row[k] === '—' ? 'var(--gray3)' : 'var(--white)' }}>{row[k]}</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PLAN INDIVIDUAL */}
      <div className="planes-section" style={{ borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Para compradores / particulares</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,48px)', lineHeight: 1, marginBottom: '2.5rem' }}>PLAN INDIVIDUAL</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '860px' }}>
          <div className="plan-card plan-card-individual-free" style={{ background: 'var(--gray1)', border: '1px solid rgba(74,222,128,.25)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.15em', color: '#4ade80', marginBottom: '.75rem' }}>BASE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: '#4ade80', lineHeight: 1, marginBottom: '1.5rem' }}>GRATIS</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['1 publicación activa por 30 días', 'Sin prioridad en resultados', 'Acceso al catálogo completo', 'Consultas directas a agencias', 'Guardado de favoritos'].map(b => (
                <li key={b} style={{ fontSize: '13px', color: 'var(--gray4)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckIcon /> {b}
                </li>
              ))}
            </ul>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/registro')}>Registrarse gratis</button>
          </div>

          <div className="plan-card plan-card-individual-extra" style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.15em', color: 'var(--white)', marginBottom: '1.5rem' }}>EXTRAS PAGOS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
              {[
                { nombre: 'Publicación adicional', precio: '15.000', desc: 'A partir de la 1ra (gratis). Por 30 días.' },
                { nombre: 'Subir al tope', precio: '10.000', desc: 'Tu publicación vuelve al primer lugar.' },
                { nombre: 'Destacado', precio: '15.000', desc: 'Fondo diferenciado y badge en el catálogo.' },
                { nombre: 'Urgente', precio: '20.000', desc: 'Badge rojo "URGENTE" máxima visibilidad.' },
                { nombre: 'Renovar 30 días', precio: '10.000', desc: 'Extendé tu publicación y volvé arriba.' },
              ].map(b => (
                <div key={b.nombre} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray2)' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>{b.nombre}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray4)', marginTop: '2px' }}>{b.desc}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--accent)', whiteSpace: 'nowrap', marginLeft: '12px' }}>${b.precio}</div>
                </div>
              ))}
            </div>
            <button
              onClick={handleExtrasIndividual}
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--gray3)', background: 'transparent', color: 'var(--gray4)', fontSize: '13px', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray4)' }}>
              {user ? 'Ir a Mi Cuenta →' : 'Iniciar sesión para comprar →'}
            </button>
          </div>
        </div>
      </div>

      {/* PLANES PROFESIONALES */}
      <div className="planes-section" style={{ borderBottom: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Para gestores, mecánicos, escribanos y más</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,48px)', lineHeight: 1, marginBottom: '.75rem' }}>PLANES PROFESIONALES</h2>
        <p style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '3rem', lineHeight: 1.7, maxWidth: '520px' }}>
          Publicá tu perfil en el directorio de profesionales y conectá con compradores y vendedores de toda Argentina.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '700px' }}>

          {/* Plan Base */}
          <div className="plan-card plan-card-prof-base" style={{ background: 'var(--black)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.15em', color: 'var(--gray4)', marginBottom: '.75rem' }}>BASE</div>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--white)', lineHeight: 1 }}>$10.000</span>
              <span style={{ fontSize: '13px', color: 'var(--gray4)', marginLeft: '6px' }}>ARS/mes</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', paddingBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', marginBottom: '2rem' }}>
              Perfil activo en el directorio
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {[
                'Perfil visible en /profesionales',
                'Posición estándar en tu categoría',
                'WhatsApp, teléfono y email visible',
                'Descripción y horarios',
              ].map(b => (
                <li key={b} style={{ fontSize: '13px', color: 'var(--gray4)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckIcon color="var(--gray4)" /> {b}
                </li>
              ))}
              {['Badge Recomendado', 'Prioridad en resultados'].map(b => (
                <li key={b} style={{ fontSize: '13px', color: 'var(--gray3)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <XIcon /> {b}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePlanProfesional('plan_profesional_base')}
              style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--gray2)', color: 'var(--white)', border: 'none', transition: 'opacity .2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              {profesional ? 'Contratar con MercadoPago →' : 'Registrarme como profesional →'}
            </button>
          </div>

          {/* Plan Destacado */}
          <div className="plan-card plan-card-prof-dest" style={{ background: 'rgba(201,168,76,.04)', border: '1px solid rgba(201,168,76,.45)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px rgba(201,168,76,.08)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top center, rgba(201,168,76,.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#c9a84c', color: '#000', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', letterSpacing: '.1em' }}>MÁS VISIBLE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.15em', color: '#c9a84c', marginBottom: '.75rem' }}>DESTACADO</div>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--white)', lineHeight: 1 }}>$30.000</span>
              <span style={{ fontSize: '13px', color: 'var(--gray4)', marginLeft: '6px' }}>ARS/mes</span>
            </div>
            <div style={{ fontSize: '13px', color: '#c9a84c', fontFamily: 'var(--font-mono)', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,168,76,.2)', marginBottom: '2rem' }}>
              Primero en tu categoría
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {[
                'Todo lo del plan Base',
                'Aparecés primero en tu categoría',
                'Badge "Recomendado" visible',
                'Borde dorado diferenciado en tu card',
                '30 días de vigencia',
              ].map(b => (
                <li key={b} style={{ fontSize: '13px', color: 'var(--gray4)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckIcon color="#c9a84c" /> {b}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePlanProfesional('plan_profesional_destacado')}
              style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #b8860b, #c9a84c)', color: '#000', transition: 'opacity .2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              {profesional ? 'Contratar con MercadoPago →' : 'Registrarme como profesional →'}
            </button>
          </div>
        </div>
      </div>

      {/* BOOSTS AGENCIA */}
      <div className="planes-section" style={{ borderBottom: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Complementos para agencias</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,48px)', lineHeight: 1, marginBottom: '.75rem' }}>DESTACADOS Y BOOSTS</h2>
        <p style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '3rem', lineHeight: 1.7 }}>Aumentá la visibilidad de tus publicaciones más allá de tu plan.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'var(--gray2)' }}>
          {BOOSTS.map(b => (
            <div key={b.nombre} className="boost-card" style={{ background: 'var(--black)', padding: '2rem' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '1.25rem' }}>{b.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--white)', marginBottom: '6px' }}>{b.nombre}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '30px', color: 'var(--accent)', marginBottom: '1rem', lineHeight: 1 }}>${b.precio}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{b.desc}</div>
              <button
                onClick={handleBoost}
                style={{ background: 'transparent', border: '1px solid var(--gray3)', color: 'var(--gray4)', padding: '8px 18px', borderRadius: 'var(--radius)', fontSize: '12px', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray4)' }}>
                {concesionaria ? 'Ir al Panel →' : user ? 'Ir a Mi Cuenta →' : 'Iniciar sesión →'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* PUBLICIDAD */}
      <div className="planes-section" style={{ borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Publicidad</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,4vw,48px)', lineHeight: 1, marginBottom: '.75rem' }}>PUBLICIDAD EN LA PLATAFORMA</h2>
        <p style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '3rem', lineHeight: 1.7 }}>Espacios exclusivos dentro de FIORA MARKET para máxima exposición.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {PUBLICIDAD.map(p => (
            <div key={p.nombre} className="plan-card pub-card" style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '1.25rem' }}>{p.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--white)', marginBottom: '8px' }}>{p.nombre}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--accent)', marginBottom: '1rem', lineHeight: 1 }}>
                ${p.precio}<span style={{ fontSize: '14px', color: 'var(--gray4)', marginLeft: '6px' }}>/mes</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.7, marginBottom: '2rem' }}>{p.desc}</div>
              <button
                onClick={() => p.tipo === 'banner_home' ? handleBannerHome() : handleFijadoHome()}
                className="btn-primary"
                style={{ width: '100%' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {concesionaria
                  ? p.tipo === 'banner_home' ? 'Contratar con MercadoPago →' : 'Seleccionar vehículo en Panel →'
                  : 'Iniciar sesión para contratar →'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ALGORITMO */}
      <div className="planes-section" style={{ borderBottom: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Algoritmo de visibilidad</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,48px)', lineHeight: 1, marginBottom: '2.5rem' }}>ORDEN EN EL CATÁLOGO</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1px', background: 'var(--gray2)', maxWidth: '960px' }}>
          {[
            { pos: '1°', label: 'Agencias Premium', color: 'var(--accent)', desc: 'Siempre arriba. Urgentes y destacados primero.' },
            { pos: '2°', label: 'Agencias Pro', color: '#e0a020', desc: 'Debajo de Premium. Destacados primero, luego fecha.' },
            { pos: '3°', label: 'Publicaciones Urgentes', color: '#e0a020', desc: 'Cualquier plan con boost urgente activo.' },
            { pos: '4°', label: 'Publicaciones Destacadas', color: 'var(--gray4)', desc: 'Individuales o básicos con boost activo.' },
            { pos: '5°', label: 'Agencias Básicas', color: 'var(--gray4)', desc: 'Posición estándar. Orden por fecha.' },
            { pos: '6°', label: 'Individuales gratis', color: 'var(--gray5)', desc: 'Últimos en aparecer. Orden por fecha.' },
          ].map(r => (
            <div key={r.pos} style={{ background: 'var(--black)', padding: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: r.color, opacity: .3, lineHeight: 1, marginBottom: '.75rem' }}>{r.pos}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: r.color, marginBottom: '8px' }}>{r.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray4)', lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="planes-section planes-cta" style={{ textAlign: 'center', background: 'var(--black)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,72px)', lineHeight: 1, marginBottom: '1.5rem' }}>
            ¿LISTO PARA<br /><span style={{ color: 'var(--accent)' }}>EMPEZAR?</span>
          </div>
          <p style={{ fontSize: '16px', color: 'var(--gray4)', marginBottom: '2.5rem', maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Creá tu cuenta y empezá a vender hoy mismo.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {concesionaria ? (
              <button className="btn-primary" style={{ fontSize: '15px', padding: '15px 36px' }} onClick={() => navigate('/panel')}>
                Ir al Panel →
              </button>
            ) : (
              <button className="btn-primary" style={{ fontSize: '15px', padding: '15px 36px' }} onClick={() => navigate('/login')}>
                Iniciar sesión →
              </button>
            )}
            <button className="btn-secondary" style={{ fontSize: '15px', padding: '15px 36px' }} onClick={() => navigate('/registro')}>
              Crear cuenta gratis
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .planes-section {
          padding: 5rem 4rem;
        }
        .planes-hero {
          padding: 6rem 4rem;
        }
        .planes-cta {
          padding: 6rem 4rem;
        }

        /* Hover effects — desactivados en touch */
        @media (hover: hover) {
          .plan-card {
            transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
          }
          .plan-card:hover {
            transform: translateY(-8px);
          }
          .plan-card-pro:hover {
            box-shadow: 0 24px 64px rgba(224,160,32,.28) !important;
            border-color: rgba(224,160,32,.9) !important;
          }
          .plan-card-basico:hover {
            box-shadow: 0 16px 48px rgba(0,0,0,.5);
            border-color: var(--gray4) !important;
          }
          .plan-card-premium:hover {
            box-shadow: 0 24px 64px rgba(230,51,41,.28) !important;
            border-color: rgba(230,51,41,.8) !important;
          }
          .plan-card-individual-free:hover {
            box-shadow: 0 16px 48px rgba(74,222,128,.15);
            border-color: rgba(74,222,128,.6) !important;
          }
          .plan-card-individual-extra:hover {
            box-shadow: 0 16px 48px rgba(0,0,0,.4);
            border-color: var(--gray3) !important;
          }
          .plan-card-prof-base:hover {
            box-shadow: 0 16px 48px rgba(0,0,0,.5);
            border-color: var(--gray3) !important;
          }
          .plan-card-prof-dest:hover {
            box-shadow: 0 24px 64px rgba(201,168,76,.28) !important;
            border-color: rgba(201,168,76,.9) !important;
          }
          .boost-card {
            transition: background 0.2s ease, transform 0.2s ease;
          }
          .boost-card:hover {
            background: #111 !important;
            transform: translateY(-4px);
          }
          .pub-card:hover {
            box-shadow: 0 16px 48px rgba(230,51,41,.18) !important;
            border-color: rgba(230,51,41,.4) !important;
          }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .planes-section {
            padding: 3rem 1.25rem !important;
          }
          .planes-hero {
            padding: 3.5rem 1.25rem !important;
          }
          .planes-cta {
            padding: 3.5rem 1.25rem !important;
          }
        }

        @media (max-width: 768px) and (min-width: 641px) {
          .planes-section {
            padding: 4rem 2rem !important;
          }
          .planes-hero {
            padding: 4.5rem 2rem !important;
          }
          .planes-cta {
            padding: 4.5rem 2rem !important;
          }
        }
      `}</style>
    </div>
  )
}
