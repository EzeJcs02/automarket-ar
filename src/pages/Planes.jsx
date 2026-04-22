import { useNavigate } from 'react-router-dom'

const WA = 'https://wa.me/5493874111111'

const PLANES_AGENCIA = [
  {
    id: 'basico',
    nombre: 'BÁSICO',
    precio: '20.000',
    color: 'var(--gray4)',
    border: 'var(--gray2)',
    publicaciones: '10 publicaciones activas',
    beneficios: [
      'Hasta 10 autos publicados',
      'Publicaciones por 30 días',
      'Perfil de agencia en el directorio',
      'Renovación paga disponible',
    ],
    noIncluye: ['Prioridad en búsquedas', 'Destacados incluidos', 'Badge verificada'],
    msg: 'Hola! Quiero contratar el Plan Básico de AutoMarket AR ($20.000/mes)',
  },
  {
    id: 'pro',
    nombre: 'PRO',
    precio: '50.000',
    color: '#e0a020',
    border: 'rgba(224,160,32,.4)',
    publicaciones: '25 publicaciones activas',
    tag: 'MÁS POPULAR',
    beneficios: [
      'Hasta 25 autos publicados',
      'Publicaciones por 30 días',
      '3 destacados incluidos por mes',
      'Mejor posicionamiento en listados',
      'Perfil de agencia destacado',
      'Renovación paga disponible',
    ],
    noIncluye: ['Destacados ilimitados', 'Badge verificada'],
    msg: 'Hola! Quiero contratar el Plan Pro de AutoMarket AR ($50.000/mes)',
  },
  {
    id: 'premium',
    nombre: 'PREMIUM',
    precio: '100.000',
    color: 'var(--accent)',
    border: 'rgba(230,51,41,.4)',
    publicaciones: 'Publicaciones ilimitadas',
    beneficios: [
      'Publicaciones ilimitadas',
      'Siempre en el tope del catálogo',
      'Destacados ilimitados incluidos',
      'Máxima prioridad en búsquedas',
      'Badge "Agencia Verificada" ✓',
      'Soporte prioritario',
      'Renovación paga disponible',
    ],
    noIncluye: [],
    msg: 'Hola! Quiero contratar el Plan Premium de AutoMarket AR ($100.000/mes)',
  },
]

const BOOSTS = [
  { nombre: 'Subir al tope', precio: '1.000', desc: 'Tu publicación vuelve al primer lugar dentro de su categoría.', icon: '⬆️' },
  { nombre: 'Destacado', precio: '3.000', desc: 'Fondo diferenciado y badge visible en el catálogo.', icon: '⭐' },
  { nombre: 'Urgente', precio: '4.000', desc: 'Máxima visibilidad. Badge rojo "URGENTE" en tu publicación.', icon: '🔥' },
  { nombre: 'Renovar publicación', precio: '1.500', desc: 'Extendé 30 días más y volvé arriba dentro de tu categoría.', icon: '🔄' },
]

export default function Planes() {
  const navigate = useNavigate()

  return (
    <div className="page-wrapper">
      {/* HERO */}
      <div style={{ padding: '5rem 4rem', borderBottom: '1px solid var(--gray2)', background: 'var(--black)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Monetización</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,7vw,96px)', lineHeight: 1, marginBottom: '1.5rem' }}>
          PLANES Y<br /><span style={{ color: 'var(--accent)' }}>PRECIOS</span>
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--gray4)', maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          El que más invierte, más aparece. Elegí el plan que mejor se adapta a tu agencia y empezá a generar más ventas hoy.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1rem 2rem', fontSize: '14px', color: 'var(--gray4)' }}>
            <span style={{ color: '#4ade80', fontWeight: 700 }}>✓</span> Usuarios individuales — <strong style={{ color: 'var(--white)' }}>GRATIS</strong>
          </div>
          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1rem 2rem', fontSize: '14px', color: 'var(--gray4)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>★</span> Agencias — desde <strong style={{ color: 'var(--white)' }}>$20.000/mes</strong>
          </div>
        </div>
      </div>

      {/* PLANES INDIVIDUALES */}
      <div style={{ padding: '4rem', borderBottom: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Para compradores</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '700px' }}>
          <div style={{ background: 'var(--black)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '.5rem' }}>INDIVIDUAL</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: '#4ade80', marginBottom: '1.5rem' }}>GRATIS</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['1 publicación activa por 30 días', 'Renovación paga disponible ($1.500)', 'Acceso al catálogo completo', 'Consultas directas a agencias'].map(b => (
                <li key={b} style={{ fontSize: '14px', color: 'var(--gray4)', display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span> {b}
                </li>
              ))}
            </ul>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/registro')}>Registrarse gratis</button>
          </div>
          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Lógica del negocio</div>
            {['Los individuales generan tráfico y volumen', 'Las agencias pagan por visibilidad', 'Todos pueden comprar boosts de destacados'].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span> {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PLANES AGENCIA */}
      <div style={{ padding: '4rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Para agencias</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,56px)', lineHeight: 1, marginBottom: '3rem' }}>PLANES DE AGENCIA</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {PLANES_AGENCIA.map(p => (
            <div key={p.id} style={{ background: 'var(--gray1)', border: `1px solid ${p.border}`, borderRadius: 'var(--radius-lg)', padding: '2.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              {p.tag && (
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: p.color, color: 'var(--white)', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', letterSpacing: '.08em' }}>{p.tag}</div>
              )}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: p.color, marginBottom: '1rem' }}>{p.nombre}</div>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '52px', color: 'var(--white)' }}>${p.precio}</span>
                <span style={{ fontSize: '13px', color: 'var(--gray4)', marginLeft: '6px' }}>ARS/mes</span>
              </div>
              <div style={{ fontSize: '13px', color: p.color, fontWeight: 600, marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>{p.publicaciones}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {p.beneficios.map(b => (
                  <li key={b} style={{ fontSize: '13px', color: 'var(--gray4)', display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span> {b}
                  </li>
                ))}
                {p.noIncluye.map(b => (
                  <li key={b} style={{ fontSize: '13px', color: 'var(--gray3)', display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>✗</span> {b}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => window.open(`${WA}?text=${encodeURIComponent(p.msg)}`, '_blank')}
                style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius)', border: 'none', background: p.id === 'premium' ? 'var(--accent)' : p.id === 'pro' ? '#e0a020' : 'var(--gray2)', color: 'var(--white)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'opacity .2s', letterSpacing: '.04em' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Contratar por WhatsApp →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SISTEMA DE BOOSTS */}
      <div style={{ padding: '4rem', borderBottom: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Visibilidad individual</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1, marginBottom: '.75rem' }}>BOOSTS DE PUBLICACIÓN</h2>
        <p style={{ fontSize: '15px', color: 'var(--gray4)', marginBottom: '3rem', maxWidth: '560px', lineHeight: 1.7 }}>Disponibles para cualquier usuario o agencia. Aumentá la visibilidad de tus publicaciones sin cambiar de plan.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'var(--gray2)' }}>
          {BOOSTS.map(b => (
            <div key={b.nombre} style={{ background: 'var(--black)', padding: '2.5rem' }}>
              <div style={{ fontSize: '36px', marginBottom: '1rem' }}>{b.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--white)', marginBottom: '6px' }}>{b.nombre}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', color: 'var(--accent)', marginBottom: '1rem' }}>${b.precio}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{b.desc}</div>
              <button
                onClick={() => window.open(`${WA}?text=${encodeURIComponent(`Hola! Quiero comprar un boost "${b.nombre}" ($${b.precio}) en AutoMarket AR`)}`, '_blank')}
                style={{ background: 'transparent', border: '1px solid var(--gray3)', color: 'var(--gray4)', padding: '8px 18px', borderRadius: 'var(--radius)', fontSize: '12px', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray4)' }}>
                Consultar →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ALGORITMO DE VISIBILIDAD */}
      <div style={{ padding: '4rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Algoritmo</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', lineHeight: 1, marginBottom: '3rem' }}>ORDEN DE VISIBILIDAD</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'var(--gray2)', maxWidth: '900px' }}>
          {[
            { pos: '1°', label: 'Agencias Premium', color: 'var(--accent)', desc: 'Siempre arriba. Destacados primero, luego por fecha.' },
            { pos: '2°', label: 'Agencias Pro', color: '#e0a020', desc: 'Debajo de Premium. Destacados primero, luego fecha.' },
            { pos: '3°', label: 'Publicaciones Destacadas', color: '#e0a020', desc: 'Individuales y básicos que compraron boost.' },
            { pos: '4°', label: 'Agencias Básicas', color: 'var(--gray4)', desc: 'Sin prioridad especial. Orden por fecha.' },
            { pos: '5°', label: 'Individuales (gratis)', color: 'var(--gray5)', desc: 'Últimos en aparecer. Orden por fecha.' },
          ].map(r => (
            <div key={r.pos} style={{ background: 'var(--gray1)', padding: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: r.color, opacity: .4, lineHeight: 1, marginBottom: '.75rem' }}>{r.pos}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: r.color, marginBottom: '8px' }}>{r.label}</div>
              <div style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA FINAL */}
      <div style={{ padding: '5rem 4rem', textAlign: 'center', background: 'var(--gray1)', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,64px)', lineHeight: 1, marginBottom: '1.5rem' }}>¿LISTO PARA<br /><span style={{ color: 'var(--accent)' }}>EMPEZAR?</span></div>
        <p style={{ fontSize: '16px', color: 'var(--gray4)', marginBottom: '2.5rem', maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Contactanos por WhatsApp y te ayudamos a elegir el plan ideal para tu agencia.
        </p>
        <button className="btn-primary" style={{ fontSize: '16px', padding: '16px 40px' }}
          onClick={() => window.open(`${WA}?text=${encodeURIComponent('Hola! Quiero más información sobre los planes de AutoMarket AR')}`, '_blank')}>
          Consultar por WhatsApp →
        </button>
      </div>
    </div>
  )
}
