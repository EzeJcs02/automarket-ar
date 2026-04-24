import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

async function pagarConMP(tipo, user_id) {
  try {
    const res = await fetch('/api/mp-create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, user_id, origen: 'mi-cuenta' }),
    })
    const data = await res.json()
    if (data.init_point) window.location.href = data.init_point
    else alert('Error al iniciar el pago. Intente nuevamente.')
  } catch {
    alert('Error de conexión. Intente nuevamente.')
  }
}

export default function MiCuenta() {
  const { user, concesionaria, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('favoritos')
  const [favoritos, setFavoritos] = useState([])
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mp = params.get('mp')
    if (mp === 'ok') {
      alert('¡Pago exitoso! Tu boost se activará en breve.')
      window.history.replaceState({}, '', '/mi-cuenta')
    } else if (mp === 'fail') {
      alert('El pago no se completó. Podés intentarlo nuevamente.')
      window.history.replaceState({}, '', '/mi-cuenta')
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (isAdmin) { navigate('/admin'); return }
    if (concesionaria) { navigate('/panel'); return }
    loadData()
  }, [user, concesionaria, isAdmin, authLoading])

  async function loadData() {
    const [favRes, consulRes] = await Promise.all([
      supabase.from('favoritos').select('*, autos(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('consultas').select('*, autos(marca, modelo)').eq('email_comprador', user.email).order('created_at', { ascending: false }),
    ])
    setFavoritos(favRes.data || [])
    setConsultas(consulRes.data || [])
    setLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 58px)' }}>
        <div className="spinner" />
      </div>
    )
  }

  const tabs = [
    { id: 'favoritos', label: 'Mis Favoritos' },
    { id: 'consultas', label: 'Consultas enviadas' },
    { id: 'plan', label: 'Mi Plan' },
  ]

  return (
    <div className="page-wrapper" style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>
      {/* SIDEBAR */}
      <div style={{ width: '240px', flexShrink: 0, borderRight: '1px solid var(--gray2)', padding: '2rem 0', background: '#080808' }}>
        <div style={{ padding: '0 1.5rem 2rem', borderBottom: '1px solid var(--gray2)', marginBottom: '1.5rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--gray2)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--gray4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          <div style={{ fontSize: '11px', color: 'var(--gray5)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>PLAN GRATUITO</div>
        </div>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '14px 1.5rem', fontSize: '13px', fontWeight: tab === t.id ? '600' : '400', color: tab === t.id ? 'var(--white)' : 'var(--gray4)', cursor: 'pointer', borderLeft: `3px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`, background: tab === t.id ? 'var(--gray1)' : 'transparent', textTransform: 'uppercase', letterSpacing: '.05em', transition: 'all .15s' }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* CONTENIDO */}
      <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto' }}>
        {tab === 'favoritos' && <TabFavoritos favoritos={favoritos} />}
        {tab === 'consultas' && <TabConsultas consultas={consultas} />}
        {tab === 'plan' && <TabPlan user={user} />}
      </div>
    </div>
  )
}

function TabFavoritos({ favoritos }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>MIS FAVORITOS</div>
      <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>{favoritos.length} vehículo{favoritos.length !== 1 ? 's' : ''} guardado{favoritos.length !== 1 ? 's' : ''}</div>

      {favoritos.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)' }}>
          <div style={{ fontSize: '36px', marginBottom: '1rem', color: 'var(--gray3)' }}>♡</div>
          <p style={{ color: 'var(--gray4)', fontSize: '15px', marginBottom: '1.5rem' }}>Todavía no guardaste ningún vehículo.</p>
          <a href="/catalogo"><button className="btn-primary">Explorar catálogo →</button></a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {favoritos.map(f => {
            const a = f.autos
            if (!a) return null
            return (
              <a key={f.id} href={`/auto/${a.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--gray2)', transition: 'border-color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gray3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray2)'}>
                  <div style={{ height: '180px', overflow: 'hidden', background: 'var(--gray2)' }}>
                    {a.fotos?.[0] && <img src={a.fotos[0]} alt={`${a.marca} ${a.modelo}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--white)', marginBottom: '4px' }}>{a.marca} {a.modelo}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '10px' }}>{a.anio} · {Number(a.kilometraje || 0).toLocaleString('es-AR')} km</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--accent)' }}>${Number(a.precio_ars || 0).toLocaleString('es-AR')}</div>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TabConsultas({ consultas }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>MIS CONSULTAS</div>
      <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Mensajes que enviaste a concesionarias</div>

      {consultas.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)' }}>
          <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no enviaste ninguna consulta.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {consultas.map(c => (
            <div key={c.id} style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--gray2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '15px' }}>{c.autos?.marca} {c.autos?.modelo}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray5)', fontFamily: 'var(--font-mono)' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--gray4)', lineHeight: 1.6, margin: 0 }}>{c.mensaje}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabPlan({ user }) {
  const [paying, setPaying] = useState(null)

  async function pagar(tipo) {
    setPaying(tipo)
    await pagarConMP(tipo, user.id)
    setPaying(null)
  }

  const extras = [
    { id: 'subir_tope', label: 'Subir al tope', desc: 'Tu publicación vuelve a aparecer primero en el catálogo', precio: '$10.000' },
    { id: 'destacado_individual', label: 'Destacado', desc: 'Borde dorado y badge especial en tu publicación', precio: '$15.000' },
    { id: 'urgente_individual', label: 'Urgente', desc: 'Borde rojo para ventas con urgencia real', precio: '$20.000' },
    { id: 'renovar', label: 'Renovar publicación', desc: 'Extiende 30 días más la visibilidad de tu aviso', precio: '$10.000' },
  ]

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>MI PLAN</div>
      <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Gestioná tu cuenta y potenciá tus publicaciones</div>

      <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--gray2)', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '6px' }}>Plan actual</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--gray4)' }}>INDIVIDUAL GRATIS</div>
          <div style={{ fontSize: '13px', color: 'var(--gray5)', marginTop: '6px' }}>1 publicación activa · Consultas ilimitadas · Favoritos ilimitados</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--white)' }}>$0<span style={{ fontSize: '12px', color: 'var(--gray4)', marginLeft: '4px' }}>/mes</span></div>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.1em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1.25rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>Extras disponibles</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {extras.map(e => (
          <div key={e.id} style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--gray2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '15px' }}>{e.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', flex: 1, lineHeight: 1.5 }}>{e.desc}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--white)' }}>{e.precio}</div>
            <button onClick={() => pagar(e.id)} disabled={!!paying}
              style={{ padding: '9px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--accent)', color: 'var(--white)', fontSize: '13px', fontWeight: 700, cursor: paying ? 'wait' : 'pointer', opacity: paying ? .7 : 1 }}>
              {paying === e.id ? 'Procesando...' : 'Pagar con MP'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
