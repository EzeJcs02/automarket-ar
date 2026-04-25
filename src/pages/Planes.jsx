import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const WA = 'https://wa.me/5493874111111'

async function pagarConMP(tipo, { concesionaria_id, user_id, user_email } = {}) {
  try {
    const res = await fetch('/api/mp-create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, concesionaria_id, user_id, user_email, origen: 'panel' }),
    })
    const data = await res.json()
    if (data.init_point) window.location.href = data.init_point
    else alert('Error al iniciar el pago. Intente nuevamente.')
  } catch {
    alert('Error de conexión. Intente nuevamente.')
  }
}

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
    msg: 'Hola! Quiero contratar el Plan Básico de FIORA.MARKET ($30.000/mes)',
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
      '3 destacados incluidos por mes',
      'Mejor posicionamiento en resultados',
      'Renovación paga disponible',
    ],
    noIncluye: ['Destacados ilimitados', 'Badge verificada'],
    msg: 'Hola! Quiero contratar el Plan Pro de FIORA.MARKET ($70.000/mes)',
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
      'Destacados ilimitados incluidos',
      'Máxima prioridad en resultados',
      'Badge "Agencia Verificada"',
      'Renovación paga disponible',
    ],
    noIncluye: [],
    msg: 'Hola! Quiero contratar el Plan Premium de FIORA.MARKET ($150.000/mes)',
  },
]

const COMPARACION = [
  { label: 'Publicaciones activas', basico: '8', pro: '20', premium: '50' },
  { label: 'Duración por publicación', basico: '30 días', pro: '30 días', premium: '30 días' },
  { label: 'Destacados incluidos', basico: '—', pro: '3/mes', premium: 'Ilimitados' },
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
    precio: '120.000',
    tipo: 'banner_home',
    desc: 'Tu banner publicitario visible en la página de inicio por 30 días.',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  },
  {
    nombre: 'Vehículo fijado en Home',
    precio: '80.000',
    tipo: null,
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

export default function Planes() {
  const navigate = useNavigate()
  const { user, concesionaria } = useAuth()

  function handlePlan(planId) {
    if (concesionaria) {
      pagarConMP(`plan_${planId}`, { concesionaria_id: concesionaria.id, user_id: user?.id, user_email: user?.email })
    } else {
      navigate('/login')
    }
  }

  function handlePublicidad(tipo) {
    if (concesionaria) {
      pagarConMP(tipo, { concesionaria_id: concesionaria.id, user_id: user?.id, user_email: user?.email })
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="page-wrapper">

      {/* HERO */}
      <div style={{ position: 'relative', padding: '6rem 4rem', borderBottom: '1px solid var(--gray2)', background: 'var(--black)', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Planes y precios</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,7vw,96px)', lineHeight: 1, marginBottom: '1.5rem' }}>
            VISIBILIDAD<br /><span style={{ color: 'var(--accent)' }}>QUE VENDE</span>
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--gray4)', maxWidth: '520px', margin: '0 auto 3rem', lineHeight: 1.7 }}>
            El que más invierte, más aparece. Publicaciones de <strong style={{ color: 'var(--white)' }}>30 días</strong> con renovación paga. Sin contratos. Sin permanencia.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(74,222,128,.07)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 'var(--radius-lg)', padding: '.875rem 1.75rem', fontSize: '14px', color: 'var(--gray4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckIcon /> Compradores particulares — <strong style={{ color: 'var(--white)' }}>GRATIS</strong>
            </div>
            <div style={{ background: 'rgba(230,51,41,.07)', border: '1px solid rgba(230,51,41,.2)', borderRadius: 'var(--radius-lg)', padding: '.875rem 1.75rem', fontSize: '14px', color: 'var(--gray4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" style={{ flexShrink: 0 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Agencias — desde <strong style={{ color: 'var(--white)' }}>$30.000/mes</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PLANES AGENCIA - CARDS */}
      <div style={{ padding: '5rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Para agencias y concesionarias</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,56px)', lineHeight: 1, marginBottom: '.75rem' }}>PLANES DE AGENCIA</h2>
        <p style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '3.5rem' }}>Vehículo extra por encima del límite del plan: <strong style={{ color: 'var(--white)' }}>$10.000/mes c/u</strong></p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {PLANES.map(p => {
            const isPro = p.id === 'pro'
            return (
              <div key={p.id} style={{
                background: isPro ? 'rgba(224,160,32,.05)' : 'var(--gray1)',
                border: `1px solid ${p.border}`,
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem',
                display: 'flex', flexDirection: 'column',
                position: 'relative', overflow: 'hidden',
                transform: isPro ? 'scale(1.03)' : 'scale(1)',
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
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '52px', color: 'var(--white)', lineHeight: 1 }}>${p.precio}</span>
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
                  {concesionaria ? 'Contratar con MercadoPago →' : 'Contratar →'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* TABLA COMPARATIVA */}
      <div style={{ padding: '5rem 4rem', borderBottom: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Comparación detallada</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1, marginBottom: '3rem' }}>¿QUÉ INCLUYE CADA PLAN?</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--black)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: '560px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gray2)' }}>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '12px', color: 'var(--gray4)', fontWeight: 400, width: '40%' }}>Característica</th>
                {PLANES.map(p => (
                  <th key={p.id} style={{ padding: '1.25rem 1rem', textAlign: 'center', fontSize: '12px', color: p.color, fontWeight: 700, letterSpacing: '.1em', fontFamily: 'var(--font-mono)' }}>{p.nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARACION.map((row, i) => (
                <tr key={row.label} style={{ borderBottom: '1px solid var(--gray2)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '13px', color: 'var(--gray4)' }}>{row.label}</td>
                  {['basico', 'pro', 'premium'].map(k => (
                    <td key={k} style={{ padding: '1rem', textAlign: 'center', fontSize: '13px', color: 'var(--white)' }}>
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
      <div style={{ padding: '5rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Para compradores / particulares</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1, marginBottom: '3rem' }}>PLAN INDIVIDUAL</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: '860px' }}>
          <div style={{ background: 'var(--gray1)', border: '1px solid rgba(74,222,128,.25)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.15em', color: '#4ade80', marginBottom: '.75rem' }}>BASE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', color: '#4ade80', lineHeight: 1, marginBottom: '1.5rem' }}>GRATIS</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['1 publicación activa por 30 días', 'Sin prioridad en resultados', 'Acceso al catálogo completo', 'Consultas directas a agencias', 'Guardado de favoritos'].map(b => (
                <li key={b} style={{ fontSize: '13px', color: 'var(--gray4)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckIcon /> {b}
                </li>
              ))}
            </ul>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/registro')}>Registrarse gratis</button>
          </div>

          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.15em', color: 'var(--white)', marginBottom: '1.5rem' }}>EXTRAS PAGOS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
              {[
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
              onClick={() => user && !concesionaria ? navigate('/mi-cuenta') : navigate('/login')}
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--gray3)', background: 'transparent', color: 'var(--gray4)', fontSize: '13px', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray4)' }}>
              {user && !concesionaria ? 'Ir a Mi Cuenta →' : 'Comprar con MercadoPago →'}
            </button>
          </div>
        </div>
      </div>

      {/* BOOSTS AGENCIA */}
      <div style={{ padding: '5rem 4rem', borderBottom: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Complementos para agencias</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1, marginBottom: '.75rem' }}>DESTACADOS Y BOOSTS</h2>
        <p style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '3.5rem', lineHeight: 1.7 }}>Aumentá la visibilidad de tus publicaciones más allá de tu plan.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'var(--gray2)' }}>
          {BOOSTS.map(b => (
            <div key={b.nombre} style={{ background: 'var(--black)', padding: '2.5rem' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '1.25rem' }}>{b.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--white)', marginBottom: '6px' }}>{b.nombre}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--accent)', marginBottom: '1rem', lineHeight: 1 }}>${b.precio}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{b.desc}</div>
              <button
                onClick={() => window.open(`${WA}?text=${encodeURIComponent(`Hola! Quiero comprar "${b.nombre}" ($${b.precio}) para mi agencia en FIORA.MARKET`)}`, '_blank')}
                style={{ background: 'transparent', border: '1px solid var(--gray3)', color: 'var(--gray4)', padding: '8px 18px', borderRadius: 'var(--radius)', fontSize: '12px', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray4)' }}>
                Consultar →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* PUBLICIDAD */}
      <div style={{ padding: '5rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Publicidad</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1, marginBottom: '.75rem' }}>PUBLICIDAD EN LA PLATAFORMA</h2>
        <p style={{ fontSize: '14px', color: 'var(--gray4)', marginBottom: '3.5rem', lineHeight: 1.7 }}>Espacios exclusivos dentro de FIORA.MARKET para máxima exposición.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {PUBLICIDAD.map(p => (
            <div key={p.nombre} style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '1.25rem' }}>{p.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--white)', marginBottom: '8px' }}>{p.nombre}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: 'var(--accent)', marginBottom: '1rem', lineHeight: 1 }}>
                ${p.precio}<span style={{ fontSize: '14px', color: 'var(--gray4)', marginLeft: '6px' }}>/mes</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.7, marginBottom: '2rem' }}>{p.desc}</div>
              <button
                onClick={() => p.tipo ? handlePublicidad(p.tipo) : window.open(`${WA}?text=${encodeURIComponent(`Hola! Quiero contratar "${p.nombre}" ($${p.precio}/mes) en FIORA.MARKET`)}`, '_blank')}
                className="btn-primary"
                style={{ width: '100%' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {p.tipo && concesionaria ? 'Contratar con MercadoPago →' : 'Consultar por WhatsApp →'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ALGORITMO */}
      <div style={{ padding: '5rem 4rem', borderBottom: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Algoritmo de visibilidad</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1, marginBottom: '3rem' }}>ORDEN EN EL CATÁLOGO</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: 'var(--gray2)', maxWidth: '960px' }}>
          {[
            { pos: '1°', label: 'Agencias Premium', color: 'var(--accent)', desc: 'Siempre arriba. Urgentes y destacados primero.' },
            { pos: '2°', label: 'Agencias Pro', color: '#e0a020', desc: 'Debajo de Premium. Destacados primero, luego fecha.' },
            { pos: '3°', label: 'Publicaciones Urgentes', color: '#e0a020', desc: 'Cualquier plan con boost urgente activo.' },
            { pos: '4°', label: 'Publicaciones Destacadas', color: 'var(--gray4)', desc: 'Individuales o básicos con boost activo.' },
            { pos: '5°', label: 'Agencias Básicas', color: 'var(--gray4)', desc: 'Posición estándar. Orden por fecha.' },
            { pos: '6°', label: 'Individuales gratis', color: 'var(--gray5)', desc: 'Últimos en aparecer. Orden por fecha.' },
          ].map(r => (
            <div key={r.pos} style={{ background: 'var(--black)', padding: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: r.color, opacity: .3, lineHeight: 1, marginBottom: '.75rem' }}>{r.pos}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: r.color, marginBottom: '8px' }}>{r.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray4)', lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '6rem 4rem', textAlign: 'center', background: 'var(--black)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(230,51,41,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,72px)', lineHeight: 1, marginBottom: '1.5rem' }}>
            ¿LISTO PARA<br /><span style={{ color: 'var(--accent)' }}>EMPEZAR?</span>
          </div>
          <p style={{ fontSize: '16px', color: 'var(--gray4)', marginBottom: '2.5rem', maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Contactanos por WhatsApp y te ayudamos a elegir el plan ideal para tu agencia.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '15px', padding: '15px 36px' }}
              onClick={() => window.open(`${WA}?text=${encodeURIComponent('Hola! Quiero más información sobre los planes de FIORA.MARKET')}`, '_blank')}>
              Consultar por WhatsApp →
            </button>
            <button className="btn-secondary" style={{ fontSize: '15px', padding: '15px 36px' }} onClick={() => navigate('/registro')}>
              Crear cuenta gratis
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
