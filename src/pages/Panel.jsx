import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const MARCAS = ['Toyota','Ford','Volkswagen','Chevrolet','Renault','Peugeot','Fiat','Honda','Nissan','Jeep','Citroën','Otro']
const LIMITES_PLAN = { free: 1, basico: 8, pro: 20, premium: 50 }

async function pagarConMP(tipo, { auto_id = null, concesionaria_id = null, user_id = null, user_email = null } = {}, onError = (m) => alert(m)) {
  try {
    const res = await fetch('/api/mp-create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, auto_id, concesionaria_id, user_id, user_email, origen: 'panel' }),
    })
    const data = await res.json()
    if (data.init_point) window.location.href = data.init_point
    else onError('Error al iniciar el pago. Intentá nuevamente.')
  } catch {
    onError('Error de conexión. Intentá nuevamente.')
  }
}

export default function Panel() {
  const { user, concesionaria, fetchConcesionaria, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [tab, setTab] = useState('dashboard')
  const [autos, setAutos] = useState([])
  const [consultas, setConsultas] = useState([])
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mp = params.get('mp')
    if (mp === 'ok') {
      toast('¡Pago exitoso! Tu boost/plan se activará en breve.', 'success')
      window.history.replaceState({}, '', '/panel')
    } else if (mp === 'fail') {
      toast('El pago no se completó. Podés intentarlo nuevamente.', 'error')
      window.history.replaceState({}, '', '/panel')
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (isAdmin) { navigate('/admin'); return }
    if (concesionaria) loadData()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setLoading(false)
  }, [user, concesionaria, authLoading])

  async function loadData() {
    const [autosRes, consultasRes, pagosRes] = await Promise.all([
      supabase.from('autos').select('*, vistas').eq('concesionaria_id', concesionaria.id).order('created_at', { ascending: false }),
      supabase.from('consultas').select('*, autos(marca, modelo)').eq('concesionaria_id', concesionaria.id).order('created_at', { ascending: false }),
      supabase.from('pagos').select('*, autos(marca, modelo)').eq('concesionaria_id', concesionaria.id).order('created_at', { ascending: false }),
    ])
    setAutos(autosRes.data || [])
    setConsultas(consultasRes.data || [])
    setPagos(pagosRes.data || [])
    setLoading(false)
  }

  if (!concesionaria && !loading) {
    navigate('/favoritos')
    return null
  }

  const plan = concesionaria?.plan || 'free'
  const esPremium = plan === 'premium'
  const limitePlan = LIMITES_PLAN[plan] ?? 1
  const autosActivos = autos.filter(a => a.activo).length
  const limiteAlcanzado = autosActivos >= limitePlan

  const noLeidas = consultas.filter(c => !c.leido).length

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'mis-autos', label: 'Inventario de Autos' },
    { id: 'nuevo-auto', label: 'Nueva Publicación' },
    { id: 'consultas', label: 'Consultas', count: noLeidas },
    { id: 'pagos', label: 'Mis Pagos', count: 0 },
    { id: 'perfil', label: 'Perfil de Agencia' },
  ]

  return (
    <div className="page-wrapper" style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>
      {/* SIDEBAR */}
      <div style={{ width: '250px', flexShrink: 0, borderRight: '1px solid var(--gray2)', padding: '2rem 0', background: '#080808' }}>
        <div style={{ padding: '0 1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--gray2)', marginBottom: '1.5rem' }}>
          {concesionaria?.logo_url ? (
            <img src={concesionaria.logo_url} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gray3)' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gray2)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {concesionaria?.nombre?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--white)' }}>{concesionaria?.nombre || 'Cargando...'}</div>
            <div style={{ fontSize: '11px', color: plan === 'premium' ? 'var(--accent)' : plan === 'pro' ? '#e0a020' : plan === 'basico' ? '#4ade80' : 'var(--gray5)', marginTop: '2px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {plan === 'premium' ? '★ PREMIUM' : plan === 'pro' ? '◆ PRO' : plan === 'basico' ? '● BÁSICO' : `FREE · ${autosActivos}/${limitePlan} autos`}
            </div>
          </div>
        </div>
        {navItems.map(item => (
          <div key={item.id} onClick={() => setTab(item.id)}
            style={{ padding: '14px 1.5rem', fontSize: '13px', fontWeight: tab === item.id ? '600' : '400', color: tab === item.id ? 'var(--white)' : 'var(--gray4)', cursor: 'pointer', transition: 'all .2s', borderLeft: `3px solid ${tab === item.id ? 'var(--accent)' : 'transparent'}`, background: tab === item.id ? 'var(--gray1)' : 'transparent', textTransform: 'uppercase', letterSpacing: '.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {item.label}
            {item.count > 0 && (
              <span style={{ background: 'var(--accent)', color: 'var(--white)', padding: '2px 7px', borderRadius: '100px', fontSize: '10px', fontWeight: 'bold' }}>{item.count}</span>
            )}
          </div>
        ))}
      </div>

      {/* CONTENIDO */}
      <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto' }}>
        {loading ? <div className="spinner" /> : (
          <>
            {tab === 'dashboard' && <Dashboard autos={autos} consultas={consultas} pagos={pagos} concesionaria={concesionaria} esPremium={esPremium} limiteAlcanzado={limiteAlcanzado} setTab={setTab} />}
            {tab === 'mis-autos' && <MisAutos autos={autos} reload={loadData} setTab={setTab} concesionaria={concesionaria} />}
            {tab === 'nuevo-auto' && <NuevoAuto concesionaria={concesionaria} autos={autos} esPremium={esPremium} limiteAlcanzado={limiteAlcanzado} onSuccess={() => { loadData(); setTab('mis-autos') }} />}
            {tab === 'consultas' && <Consultas consultas={consultas} reload={loadData} />}
            {tab === 'pagos' && <MisPagos pagos={pagos} />}
            {tab === 'perfil' && <Perfil concesionaria={concesionaria} onSave={() => fetchConcesionaria(user.id)} />}
          </>
        )}
      </div>
    </div>
  )
}

function UpgradeModal({ onClose }) {
  const { user, concesionaria } = useAuth()
  const [paying, setPaying] = useState(null)
  const { toast } = useToast()
  const pay = (tipo, opts) => pagarConMP(tipo, opts, msg => toast(msg, 'error'))

  const planes = [
    { id: 'basico', nombre: 'BÁSICO', precio: '30.000', limite: '8 publicaciones', color: '#4ade80' },
    { id: 'pro', nombre: 'PRO', precio: '70.000', limite: '20 publicaciones + 3 destacados', color: '#e0a020' },
    { id: 'premium', nombre: 'PREMIUM', precio: '150.000', limite: '50 autos + Badge verificada', color: 'var(--accent)' },
  ]

  async function contratar(plan_id) {
    setPaying(plan_id)
    await pay(`plan_${plan_id}`, { concesionaria_id: concesionaria?.id, user_id: user?.id, user_email: user?.email })
    setPaying(null)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
      <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '680px', border: '1px solid var(--gray2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '4px' }}>LÍMITE ALCANZADO</div>
            <div style={{ fontSize: '14px', color: 'var(--gray4)' }}>Elegí un plan para seguir publicando.</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--gray4)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {planes.map(p => (
            <div key={p.id} style={{ background: 'var(--black)', border: `1px solid ${p.id === 'premium' ? 'rgba(230,51,41,.4)' : 'var(--gray2)'}`, borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: p.color }}>{p.nombre}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--white)' }}>${p.precio}<span style={{ fontSize: '12px', color: 'var(--gray4)', marginLeft: '4px' }}>/mes</span></div>
              <div style={{ fontSize: '12px', color: 'var(--gray4)', flex: 1 }}>{p.limite}</div>
              <button onClick={() => contratar(p.id)} disabled={!!paying}
                style={{ padding: '9px', borderRadius: 'var(--radius)', border: 'none', background: p.color, color: p.id === 'basico' ? '#000' : '#fff', fontSize: '12px', fontWeight: 700, cursor: paying ? 'wait' : 'pointer', opacity: paying ? .7 : 1 }}>
                {paying === p.id ? 'Procesando...' : 'Contratar con MP →'}
              </button>
            </div>
          ))}
        </div>
        <button className="btn-secondary" style={{ width: '100%' }} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

function Dashboard({ autos, consultas, pagos, concesionaria }) {
  const { user } = useAuth()
  const [consultaDetalle, setConsultaDetalle] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [paying, setPaying] = useState(null)
  const { toast } = useToast()
  const pay = (tipo, opts) => pagarConMP(tipo, opts, msg => toast(msg, 'error'))

  const ultimoPagoPlan = pagos?.filter(p => p.tipo?.startsWith('plan_') && p.estado === 'approved')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  const planExpira = ultimoPagoPlan ? new Date(new Date(ultimoPagoPlan.created_at).getTime() + 30 * 86400000) : null
  const diasRestantes = planExpira ? Math.ceil((planExpira - new Date()) / 86400000) : null
  // eslint-disable-next-line react-hooks/purity
  const sevenDaysAgo = useMemo(() => new Date(Date.now() - 7 * 86400000), [])

  async function contratarPlan(plan_id) {
    setPaying(plan_id)
    await pay(`plan_${plan_id}`, { concesionaria_id: concesionaria?.id, user_id: user?.id, user_email: user?.email })
    setPaying(null)
  }

  return (
    <div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {consultaDetalle && (
        <div onClick={() => setConsultaDetalle(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '500px', border: '1px solid var(--gray2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>CONSULTA</div>
              <button onClick={() => setConsultaDetalle(null)} style={{ background: 'transparent', border: 'none', color: 'var(--gray4)', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>Vehículo</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--white)' }}>{consultaDetalle.autos?.marca} {consultaDetalle.autos?.modelo}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>Nombre</div>
                <div style={{ fontSize: '14px', color: 'var(--white)' }}>{consultaDetalle.nombre_comprador}</div>
              </div>
              <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>Email</div>
                <div style={{ fontSize: '14px', color: 'var(--accent)' }}>{consultaDetalle.email_comprador}</div>
              </div>
            </div>
            <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '8px' }}>Mensaje</div>
              <p style={{ fontSize: '14px', color: 'var(--white)', lineHeight: 1.7 }}>{consultaDetalle.mensaje}</p>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>
              {new Date(consultaDetalle.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <button className="btn-primary" style={{ width: '100%' }}
              onClick={() => window.open(`mailto:${consultaDetalle.email_comprador}?subject=Re: ${consultaDetalle.autos?.marca} ${consultaDetalle.autos?.modelo}&body=Hola ${consultaDetalle.nombre_comprador},%0D%0A%0D%0AGracias por tu consulta.%0D%0A%0D%0A`)}>
              Responder por email
            </button>
          </div>
        </div>
      )}

      <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>RESUMEN DE ACTIVIDAD</div>
      <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '2rem' }}>Métricas en tiempo real de tu concesionaria.</div>

      {/* BANNER PLAN */}
      <div style={{ borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem', marginBottom: '2rem', border: '1px solid var(--gray2)', background: 'var(--gray1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '4px' }}>Tu plan actual</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: concesionaria?.plan === 'premium' ? 'var(--accent)' : concesionaria?.plan === 'pro' ? '#e0a020' : concesionaria?.plan === 'basico' ? '#4ade80' : 'var(--gray4)' }}>
              {(concesionaria?.plan || 'free').toUpperCase()}
              {concesionaria?.plan === 'premium' && <span style={{ fontSize: '14px', marginLeft: '8px' }}>★</span>}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', marginTop: '4px' }}>
              {autos.filter(a => a.activo).length} autos activos
              {LIMITES_PLAN[concesionaria?.plan || 'free'] !== Infinity && ` / ${LIMITES_PLAN[concesionaria?.plan || 'free']} permitidos`}
              {LIMITES_PLAN[concesionaria?.plan || 'free'] === Infinity && ' · Sin límite'}
            </div>
            {planExpira && (
              <div style={{ fontSize: '12px', marginTop: '6px', color: diasRestantes !== null && diasRestantes <= 7 ? '#e0a020' : 'var(--gray4)' }}>
                {diasRestantes !== null && diasRestantes > 0
                  ? `Vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} · ${planExpira.toLocaleDateString('es-AR')}`
                  : <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Plan vencido · Renovar para mantener beneficios</span>
                }
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {planExpira && diasRestantes !== null && diasRestantes <= 7 && (
              <button onClick={() => contratarPlan(concesionaria?.plan)} disabled={!!paying}
                style={{ background: diasRestantes <= 0 ? 'var(--accent)' : 'rgba(224,160,32,.2)', border: `1px solid ${diasRestantes <= 0 ? 'var(--accent)' : '#e0a020'}`, color: diasRestantes <= 0 ? 'var(--white)' : '#e0a020', padding: '10px 18px', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700, cursor: paying ? 'wait' : 'pointer', opacity: paying ? .7 : 1 }}>
                {paying === concesionaria?.plan ? 'Procesando...' : 'Renovar plan →'}
              </button>
            )}
            {concesionaria?.plan !== 'premium' && (
              <button onClick={() => setShowUpgrade(true)} style={{ background: 'var(--accent)', border: 'none', color: 'var(--white)', padding: '10px 20px', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Mejorar plan →
              </button>
            )}
          </div>
        </div>
        {/* PLANES DISPONIBLES */}
        {concesionaria?.plan !== 'premium' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', paddingTop: '1.25rem', borderTop: '1px solid var(--gray2)' }}>
            {[
              { id: 'basico', nombre: 'BÁSICO', precio: '$30.000', limite: '8 publicaciones', color: '#4ade80', colorDim: 'rgba(74,222,128,.15)' },
              { id: 'pro', nombre: 'PRO', precio: '$70.000', limite: '20 autos + 3 destacados/mes', color: '#e0a020', colorDim: 'rgba(224,160,32,.15)' },
              { id: 'premium', nombre: 'PREMIUM', precio: '$150.000', limite: '50 autos + Verificada', color: '#e63329', colorDim: 'rgba(230,51,41,.15)' },
            ].filter(p => {
              const orden = { free: 0, basico: 1, pro: 2, premium: 3 }
              return orden[p.id] > orden[concesionaria?.plan || 'free']
            }).map(p => (
              <button key={p.id} onClick={() => contratarPlan(p.id)} disabled={!!paying}
                style={{ background: 'var(--black)', border: `1px solid ${p.colorDim}`, borderRadius: 'var(--radius)', padding: '12px', textAlign: 'left', cursor: paying ? 'wait' : 'pointer', transition: 'border-color .2s, background .2s', opacity: paying ? .7 : 1 }}
                onMouseEnter={e => { if (!paying) { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.background = p.colorDim } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = p.colorDim; e.currentTarget.style.background = 'var(--black)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: p.color, marginBottom: '4px' }}>{p.nombre}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', marginBottom: '2px' }}>{p.precio}<span style={{ fontSize: '10px', color: 'var(--gray4)', marginLeft: '3px' }}>/mes</span></div>
                <div style={{ fontSize: '11px', color: 'var(--gray4)' }}>{paying === p.id ? 'Procesando...' : p.limite}</div>
                <div style={{ fontSize: '10px', color: p.color, marginTop: '6px', fontWeight: 700, letterSpacing: '.05em' }}>Contratar con MP →</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[['Stock Activo', autos.filter(a => a.activo).length], ['Stock Pausado', autos.filter(a => !a.activo).length], ['Vistas Totales', autos.reduce((s, a) => s + (a.vistas || 0), 0)], ['Total Consultas', consultas.length], ['Consultas (7 días)', consultas.filter(c => new Date(c.created_at) > sevenDaysAgo).length]].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--gray1)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)' }}>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--white)', lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* ESTADÍSTICAS DETALLADAS */}
      {autos.length > 0 && (
        <div style={{ marginBottom: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Top autos por vistas — gráfico de barras */}
          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.1em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Vistas por vehículo</div>
            {(() => {
              const top = [...autos].sort((a, b) => (b.vistas || 0) - (a.vistas || 0)).slice(0, 5)
              const maxV = Math.max(1, top[0]?.vistas || 0)
              return top.map((a, i) => (
                <div key={a.id} style={{ marginBottom: i < top.length - 1 ? '14px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--white)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                      {a.marca} {a.modelo} <span style={{ color: 'var(--gray5)', fontWeight: 'normal' }}>{a.anio}</span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: i === 0 ? 'var(--accent)' : 'var(--white)', flexShrink: 0, marginLeft: '8px' }}>{a.vistas || 0}</span>
                  </div>
                  <div style={{ background: 'var(--gray2)', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(4, ((a.vistas || 0) / maxV) * 100)}%`, height: '100%', background: i === 0 ? 'var(--accent)' : `rgba(230,51,41,${0.6 - i * 0.1})`, borderRadius: '100px', transition: 'width .5s ease' }} />
                  </div>
                </div>
              ))
            })()}
          </div>

          {/* Consultas últimos 7 días */}
          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.1em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1rem' }}>Consultas últimos 7 días</div>
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (6 - i))
              const label = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
              const count = consultas.filter(c => new Date(c.created_at).toDateString() === d.toDateString()).length
              const max = Math.max(1, ...Array.from({ length: 7 }, (_, j) => {
                const dd = new Date(); dd.setDate(dd.getDate() - (6 - j))
                return consultas.filter(c => new Date(c.created_at).toDateString() === dd.toDateString()).length
              }))
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gray4)', width: '60px', textTransform: 'capitalize' }}>{label}</span>
                  <div style={{ flex: 1, background: 'var(--gray2)', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${count > 0 ? Math.max(8, (count / max) * 100) : 0}%`, height: '100%', background: 'var(--accent)', borderRadius: '100px', transition: 'width .4s' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: count > 0 ? 'var(--white)' : 'var(--gray4)', width: '20px', textAlign: 'right' }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.1em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>Bandeja de Entrada</div>
      {consultas.length === 0
        ? <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', color: 'var(--gray4)' }}>No hay consultas pendientes.</div>
        : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Vehículo','Interesado','Mensaje','Fecha',''].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '12px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {consultas.map(c => (
                <tr key={c.id} style={{ transition: 'background .2s', cursor: 'pointer' }} onClick={() => setConsultaDetalle(c)} onMouseEnter={e => e.currentTarget.style.background = 'var(--gray1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--gray2)', color: 'var(--white)', fontSize: '14px', fontWeight: '500' }}>{c.autos?.marca} {c.autos?.modelo}</td>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--gray2)', color: 'var(--gray4)', fontSize: '14px' }}>{c.nombre_comprador}</td>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--gray2)', color: 'var(--gray4)', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.mensaje}</td>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--gray2)', color: 'var(--gray5)', fontSize: '12px' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</td>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--gray2)' }}><span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Ver →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  )
}

function MisAutos({ autos, reload, setTab, concesionaria }) {
  const { user } = useAuth()
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const pay = (tipo, opts) => pagarConMP(tipo, opts, msg => toast(msg, 'error'))

  const plan = concesionaria?.plan || 'free'
  const destacadosActivos = autos.filter(a => a.destacado).length
  const urgentesActivos = autos.filter(a => a.urgente).length
  const limiteDestacados = plan === 'premium' ? Infinity : plan === 'pro' ? 3 : 0

  async function toggleDestacado(auto) {
    if (!auto.destacado) {
      if (limiteDestacados === 0) {
        if (confirm(`Tu plan no incluye boosts.\n¿Comprás un Boost Destacado individual por $15.000 para ${auto.marca} ${auto.modelo}?`)) {
          pay('destacado', { auto_id: auto.id, concesionaria_id: concesionaria?.id, user_id: user?.id, user_email: user?.email })
        }
        return
      }
      if (limiteDestacados !== Infinity && destacadosActivos >= limiteDestacados) {
        toast(`Tu plan Pro permite hasta ${limiteDestacados} destacados simultáneos. Ya tenés ${destacadosActivos} activos.`, 'warning')
        return
      }
      await supabase.from('autos').update({ destacado: true, urgente: false }).eq('id', auto.id)
    } else {
      await supabase.from('autos').update({ destacado: false }).eq('id', auto.id)
    }
    reload()
  }

  async function toggleUrgente(auto) {
    if (!auto.urgente) {
      if (limiteDestacados === 0) {
        if (confirm(`Tu plan no incluye boosts.\n¿Comprás un Boost Urgente individual por $20.000 para ${auto.marca} ${auto.modelo}?`)) {
          pay('urgente', { auto_id: auto.id, concesionaria_id: concesionaria?.id, user_id: user?.id, user_email: user?.email })
        }
        return
      }
      if (limiteDestacados !== Infinity && urgentesActivos >= limiteDestacados) {
        toast(`Tu plan Pro permite hasta ${limiteDestacados} urgentes simultáneos. Ya tenés ${urgentesActivos} activos.`, 'warning')
        return
      }
      await supabase.from('autos').update({ urgente: true, destacado: false }).eq('id', auto.id)
    } else {
      await supabase.from('autos').update({ urgente: false }).eq('id', auto.id)
    }
    reload()
  }

  async function toggleActivo(auto) {
    await supabase.from('autos').update({ activo: !auto.activo }).eq('id', auto.id)
    reload()
  }
  async function eliminar(id) {
    if (!confirm('¿Seguro que querés eliminar permanentemente este vehículo?')) return
    await supabase.from('autos').delete().eq('id', id)
    reload()
  }
  function abrirEdicion(auto) {
    setEditando(auto.id)
    setEditForm({ marca: auto.marca, modelo: auto.modelo, anio: auto.anio, kilometraje: auto.kilometraje, precio_ars: auto.precio_ars || '', precio_usd: auto.precio_usd || '', combustible: auto.combustible || '', transmision: auto.transmision || '', color: auto.color || '', descripcion: auto.descripcion || '', tipo: auto.tipo })
  }
  async function guardarEdicion() {
    setSaving(true)
    await supabase.from('autos').update({ ...editForm, anio: parseInt(editForm.anio), kilometraje: parseInt(editForm.kilometraje) || 0 }).eq('id', editando)
    setSaving(false)
    setEditando(null)
    reload()
  }
  function setEF(k, v) { setEditForm(p => ({ ...p, [k]: v })) }

  return (
    <div>
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--gray2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px' }}>EDITAR AUTO</div>
              <button onClick={() => setEditando(null)} style={{ background: 'transparent', border: 'none', color: 'var(--gray4)', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-field"><label>Marca *</label><input type="text" placeholder="Ej: KTM, BMW, Honda..." required value={editForm.marca} onChange={e => setEF('marca', e.target.value)} /></div>
              <div className="form-field"><label>Modelo *</label><input type="text" required value={editForm.modelo} onChange={e => setEF('modelo', e.target.value)} /></div>
              <div className="form-field"><label>Año *</label><input type="number" required value={editForm.anio} onChange={e => setEF('anio', e.target.value)} /></div>
              <div className="form-field"><label>Kilometraje *</label><input type="number" required min="0" value={editForm.kilometraje} onChange={e => setEF('kilometraje', e.target.value)} /></div>
              <div className="form-field"><label>Tipo *</label><select required value={editForm.tipo} onChange={e => setEF('tipo', e.target.value)}><option value="nuevo">Nuevo</option><option value="usado">Usado</option></select></div>
              <div className="form-field"><label>Combustible *</label><select required value={editForm.combustible} onChange={e => setEF('combustible', e.target.value)}><option>Nafta</option><option>Diesel</option><option>Híbrido</option><option>Eléctrico</option></select></div>
              <div className="form-field"><label>Transmisión *</label><select required value={editForm.transmision} onChange={e => setEF('transmision', e.target.value)}><option>Manual</option><option>Automática</option></select></div>
              <div className="form-field"><label>Color *</label><input type="text" required placeholder="Ej: Plata Metalizado" value={editForm.color} onChange={e => setEF('color', e.target.value)} /></div>
              <div className="form-field"><label>Precio ARS *</label><input type="number" required value={editForm.precio_ars} onChange={e => setEF('precio_ars', e.target.value)} /></div>
              <div className="form-field"><label>Precio USD</label><input type="number" value={editForm.precio_usd} onChange={e => setEF('precio_usd', e.target.value)} /></div>
            </div>
            <div className="form-field" style={{ marginTop: '.5rem' }}><label>Descripción *</label><textarea style={{ height: '100px', resize: 'vertical' }} required value={editForm.descripcion} onChange={e => setEF('descripcion', e.target.value)} /></div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={guardarEdicion} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>INVENTARIO</div>
          <div style={{ fontSize: '14px', color: 'var(--gray5)' }}>Administrá los vehículos de tu catálogo.</div>
        </div>
        <button className="btn-primary" onClick={() => setTab('nuevo-auto')}>NUEVA PUBLICACIÓN</button>
      </div>

      {/* PLAN INFO BAR */}
      {limiteDestacados > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '12px 20px', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '2rem', fontSize: '12px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)' }}>
          <span>★ Destacados: <strong style={{ color: destacadosActivos > 0 ? '#c9a84c' : 'var(--white)' }}>{destacadosActivos}</strong> / {limiteDestacados === Infinity ? '∞' : limiteDestacados}</span>
          <span>⚡ Urgentes: <strong style={{ color: urgentesActivos > 0 ? 'var(--accent)' : 'var(--white)' }}>{urgentesActivos}</strong> / {limiteDestacados === Infinity ? '∞' : limiteDestacados}</span>
        </div>
      )}

      {autos.length === 0
        ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Inventario vacío.</p></div>
        : <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <thead><tr>{['Vehículo','Precio (ARS)','Vistas','Boosts','Estado','Administrar'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {autos.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--gray2)' }}>
                  <td style={{ padding: '16px 20px', color: 'var(--white)', fontSize: '14px', fontWeight: 600 }}>{a.marca} {a.modelo} <span style={{ color: 'var(--gray5)', fontWeight: 'normal', marginLeft: '6px' }}>{a.anio}</span></td>
                  <td style={{ padding: '16px 20px', color: 'var(--white)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>${Number(a.precio_ars || 0).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                    {a.vistas || 0}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button onClick={() => toggleDestacado(a)}
                        title={a.destacado ? 'Quitar destacado' : 'Destacar vehículo (incluido en plan o pago)'}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: `1px solid ${a.destacado ? 'rgba(201,168,76,.5)' : 'var(--gray2)'}`, cursor: 'pointer', transition: 'all .15s', letterSpacing: '.03em',
                          background: a.destacado ? 'rgba(201,168,76,.15)' : 'transparent',
                          color: a.destacado ? '#c9a84c' : 'var(--gray4)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill={a.destacado ? '#c9a84c' : 'none'} stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Destacar
                      </button>
                      <button onClick={() => toggleUrgente(a)}
                        title={a.urgente ? 'Quitar urgente' : 'Marcar como urgente'}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: `1px solid ${a.urgente ? 'rgba(230,51,41,.5)' : 'var(--gray2)'}`, cursor: 'pointer', transition: 'all .15s', letterSpacing: '.03em',
                          background: a.urgente ? 'rgba(230,51,41,.15)' : 'transparent',
                          color: a.urgente ? 'var(--accent)' : 'var(--gray4)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill={a.urgente ? 'var(--accent)' : 'none'} stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        Urgente
                      </button>
                      <button onClick={() => { if (confirm(`¿Subir "${a.marca} ${a.modelo}" al tope por $10.000?`)) pay('subir_tope', { auto_id: a.id, concesionaria_id: concesionaria?.id, user_id: user?.id, user_email: user?.email }) }}
                        title="Subir al tope del catálogo — $10.000"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid var(--gray2)', cursor: 'pointer', transition: 'all .15s', background: 'transparent', color: 'var(--gray4)', letterSpacing: '.03em' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                        Tope
                      </button>
                      <button onClick={() => { if (confirm(`¿Renovar "${a.marca} ${a.modelo}" por 30 días más por $10.000?`)) pay('renovar', { auto_id: a.id, concesionaria_id: concesionaria?.id, user_id: user?.id, user_email: user?.email }) }}
                        title="Renovar publicación 30 días — $10.000"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid var(--gray2)', cursor: 'pointer', transition: 'all .15s', background: 'transparent', color: 'var(--gray4)', letterSpacing: '.03em' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/></svg>
                        Renovar
                      </button>
                      {!a.fijado_home ? (
                        <button onClick={() => { if (confirm(`¿Fijar "${a.marca} ${a.modelo}" en Home por $80.000/mes?`)) pay('fijado_home', { auto_id: a.id, concesionaria_id: concesionaria?.id, user_id: user?.id, user_email: user?.email }) }}
                          title="Fijar en página de inicio — $80.000/mes"
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid var(--gray2)', cursor: 'pointer', transition: 'all .15s', background: 'transparent', color: 'var(--gray4)', letterSpacing: '.03em' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          Fijar
                        </button>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(74,222,128,.3)', background: 'rgba(74,222,128,.08)', color: '#4ade80', letterSpacing: '.03em' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          Fijado
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: a.activo ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.1)', color: a.activo ? '#4ade80' : 'var(--gray4)' }}>
                      {a.activo ? 'ACTIVO' : 'PAUSADO'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={() => abrirEdicion(a)} style={{ padding: '6px 14px', fontSize: '11px' }}>Editar</button>
                    <button className="btn-secondary" onClick={() => toggleActivo(a)} style={{ padding: '6px 14px', fontSize: '11px' }}>{a.activo ? 'Pausar' : 'Reactivar'}</button>
                    <button onClick={() => eliminar(a.id)} style={{ padding: '6px 14px', borderRadius: 'var(--radius)', border: '1px solid rgba(230,51,41,0.3)', background: 'transparent', color: 'var(--accent)', fontSize: '11px', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,51,41,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  )
}

function NuevoAuto({ concesionaria, limiteAlcanzado, onSuccess }) {
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '', kilometraje: '0', tipo: 'nuevo', combustible: 'Nafta', transmision: 'Manual', color: '', precio_ars: '', precio_usd: '', descripcion: '' })
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function handleFotos(e) {
    const nuevas = Array.from(e.target.files)
    setFotos(prev => {
      const combinadas = [...prev, ...nuevas]
      if (combinadas.length >= 5) setError('')
      return combinadas
    })
    e.target.value = ''
  }

  function eliminarFoto(idx) {
    setFotos(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (limiteAlcanzado) { setShowUpgrade(true); return }
    if (fotos.length < 5) { setError('Debés subir mínimo 5 fotos.'); return }
    setLoading(true)
    setError('')
    let fotoUrls = []
    for (const file of fotos) {
      const ext = file.name.split('.').pop()
      const path = `${concesionaria.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('fotos-autos').upload(path, file)
      if (!upErr) {
        const { data } = supabase.storage.from('fotos-autos').getPublicUrl(path)
        fotoUrls.push(data.publicUrl)
      }
    }
    const { error: insErr } = await supabase.from('autos').insert({
      concesionaria_id: concesionaria.id,
      marca: form.marca, modelo: form.modelo, anio: parseInt(form.anio),
      kilometraje: parseInt(form.kilometraje) || 0,
      tipo: form.tipo, categoria: form.categoria || null, combustible: form.combustible, transmision: form.transmision,
      color: form.color, precio_ars: form.precio_ars || null, precio_usd: form.precio_usd || null,
      descripcion: form.descripcion, fotos: fotoUrls, activo: true
    })
    setLoading(false)
    if (insErr) setError(insErr.message)
    else onSuccess()
  }

  if (showUpgrade) return <UpgradeModal onClose={() => setShowUpgrade(false)} />

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>ALTA DE STOCK</div>
      <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: limiteAlcanzado ? '1rem' : '3rem' }}>Ingresá las especificaciones del nuevo vehículo.</div>

      {limiteAlcanzado && (
        <div style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)' }}>Límite del plan gratuito alcanzado</div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', marginTop: '2px' }}>Tu plan actual tiene un límite de publicaciones. Upgradéalo para publicar más.</div>
          </div>
          <button onClick={() => setShowUpgrade(true)} style={{ background: 'rgba(201,168,76,.2)', border: '1px solid rgba(201,168,76,.4)', color: 'var(--gold)', padding: '8px 18px', borderRadius: 'var(--radius)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Ver Premium →
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--gray1)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)' }}>GALERÍA DE IMÁGENES</div>
            <div style={{ fontSize: '12px', color: fotos.length >= 5 ? '#4ade80' : 'var(--gray4)' }}>
              {fotos.length}/5 mínimo {fotos.length >= 5 ? '✓' : ''}
            </div>
          </div>

          {fotos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
              {fotos.map((f, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--gray2)' }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => eliminarFoto(i)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', borderRadius: '100px', width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ×
                  </button>
                  {i === 0 && (
                    <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'var(--accent)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', letterSpacing: '.05em' }}>PORTADA</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <label style={{ display: 'block', border: `2px dashed ${fotos.length >= 5 ? 'var(--gray2)' : 'var(--gray3)'}`, borderRadius: 'var(--radius)', padding: fotos.length > 0 ? '1.2rem' : '3rem', textAlign: 'center', cursor: 'pointer', marginBottom: '2rem', transition: 'all .2s' }}>
            <input type="file" accept="image/*" multiple onChange={handleFotos} style={{ display: 'none' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray4)' }}>
              {fotos.length === 0 ? 'Click para subir fotografías' : '+ Agregar más fotos'}
            </div>
            {fotos.length === 0 && <div style={{ fontSize: '13px', color: 'var(--gray5)', marginTop: '4px' }}>Mínimo 5 fotos · JPG, PNG</div>}
            {fotos.length > 0 && fotos.length < 5 && (
              <div style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '4px' }}>Faltan {5 - fotos.length} foto{5 - fotos.length !== 1 ? 's' : ''} para el mínimo</div>
            )}
          </label>

          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>ESPECIFICACIONES TÉCNICAS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-field"><label>Marca *</label><input type="text" placeholder="Ej: KTM, BMW, Honda..." value={form.marca} onChange={e => setF('marca', e.target.value)} required /></div>
            <div className="form-field"><label>Modelo Exacto *</label><input type="text" placeholder="Ej: Amarok 2.0 TDI" value={form.modelo} onChange={e => setF('modelo', e.target.value)} required /></div>
            <div className="form-field"><label>Año *</label><input type="number" placeholder="2024" min="1900" max="2030" value={form.anio} onChange={e => setF('anio', e.target.value)} required /></div>
            <div className="form-field"><label>Kilometraje *</label><input type="number" placeholder="0" min="0" value={form.kilometraje} onChange={e => setF('kilometraje', e.target.value)} required /></div>
            <div className="form-field"><label>Condición *</label><select value={form.tipo} onChange={e => setF('tipo', e.target.value)} required><option value="nuevo">0KM / Nuevo</option><option value="usado">Usado</option></select></div>
            <div className="form-field"><label>Categoría *</label><select value={form.categoria} onChange={e => setF('categoria', e.target.value)} required><optgroup label="Autos"><option value="Sedan">Sedán</option><option value="SUV">SUV</option><option value="Pickup">Pickup</option><option value="Hatchback">Hatchback</option><option value="Deportivo">Deportivo</option></optgroup><optgroup label="Motos"><option value="Naked">Naked</option><option value="Cruiser">Cruiser</option><option value="Enduro">Enduro</option><option value="Scooter">Scooter</option></optgroup><optgroup label="Náutica"><option value="Lancha">Lancha</option><option value="Yate">Yate</option><option value="Jet Ski">Jet Ski</option></optgroup></select></div>
            <div className="form-field"><label>Combustible *</label><select value={form.combustible} onChange={e => setF('combustible', e.target.value)} required><option>Nafta</option><option>Diesel</option><option>Híbrido</option><option>Eléctrico</option></select></div>
            <div className="form-field"><label>Transmisión *</label><select value={form.transmision} onChange={e => setF('transmision', e.target.value)} required><option>Manual</option><option>Automática</option></select></div>
            <div className="form-field"><label>Color Exterior *</label><input type="text" placeholder="Ej: Plata Metalizado" value={form.color} onChange={e => setF('color', e.target.value)} required /></div>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>VALOR COMERCIAL</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-field"><label>Precio de Lista (ARS) *</label><input type="number" placeholder="Ej: 25000000" value={form.precio_ars} onChange={e => setF('precio_ars', e.target.value)} required /></div>
            <div className="form-field"><label>Referencia USD (Opcional)</label><input type="number" placeholder="Ej: 15000" value={form.precio_usd} onChange={e => setF('precio_usd', e.target.value)} /></div>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>INFORMACIÓN ADICIONAL</div>
          <div className="form-field">
            <label>Descripción detallada *</label>
            <textarea style={{ height: '140px', resize: 'vertical' }} placeholder="Detallar estado general, mantenimientos realizados, accesorios extra, etc." value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} required />
          </div>

          {error && <div style={{ padding: '1rem', background: 'rgba(230,51,41,0.1)', color: 'var(--accent)', border: '1px solid rgba(230,51,41,0.3)', borderRadius: 'var(--radius)', marginTop: '1rem' }}>{error}</div>}

          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={loading || limiteAlcanzado}>{loading ? 'PROCESANDO...' : 'PUBLICAR EN CATÁLOGO'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Consultas({ consultas, reload }) {
  const [detalle, setDetalle] = useState(null)

  async function verDetalle(c) {
    setDetalle(c)
    if (!c.leido) {
      await supabase.from('consultas').update({ leido: true }).eq('id', c.id)
      reload()
    }
  }

  const noLeidas = consultas.filter(c => !c.leido).length

  return (
    <div>
      {detalle && (
        <div onClick={() => setDetalle(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '500px', border: '1px solid var(--gray2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>CONSULTA</div>
              <button onClick={() => setDetalle(null)} style={{ background: 'transparent', border: 'none', color: 'var(--gray4)', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>Vehículo</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--white)' }}>{detalle.autos?.marca} {detalle.autos?.modelo}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>Nombre</div>
                <div style={{ fontSize: '14px', color: 'var(--white)' }}>{detalle.nombre_comprador}</div>
              </div>
              <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>Email</div>
                <div style={{ fontSize: '14px', color: 'var(--accent)' }}>{detalle.email_comprador}</div>
              </div>
            </div>
            <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '8px' }}>Mensaje</div>
              <p style={{ fontSize: '14px', color: 'var(--white)', lineHeight: 1.7 }}>{detalle.mensaje}</p>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>
              {new Date(detalle.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <button className="btn-primary" style={{ width: '100%' }}
              onClick={() => window.open(`mailto:${detalle.email_comprador}?subject=Re: ${detalle.autos?.marca} ${detalle.autos?.modelo}&body=Hola ${detalle.nombre_comprador},%0D%0A%0D%0AGracias por tu consulta.%0D%0A%0D%0A`)}>
              Responder por email
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>CONSULTAS</div>
          <div style={{ fontSize: '14px', color: 'var(--gray5)' }}>
            {noLeidas > 0
              ? <span style={{ color: 'var(--accent)' }}>{noLeidas} sin leer</span>
              : 'Todas leídas'}
            {consultas.length > 0 && ` · ${consultas.length} en total`}
          </div>
        </div>
        {consultas.length > 0 && (
          <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: '12px' }}
            onClick={() => {
              const header = 'Fecha,Vehículo,Nombre,Email,Mensaje,Leída'
              const rows = consultas.map(c => [
                new Date(c.created_at).toLocaleDateString('es-AR'),
                `"${c.autos?.marca || ''} ${c.autos?.modelo || ''}"`,
                `"${c.nombre_comprador || ''}"`,
                c.email_comprador || '',
                `"${(c.mensaje || '').replace(/"/g, '""')}"`,
                c.leido ? 'Sí' : 'No'
              ].join(','))
              const csv = [header, ...rows].join('\n')
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = `consultas-${new Date().toISOString().slice(0,10)}.csv`
              a.click(); URL.revokeObjectURL(url)
            }}>
            Exportar CSV ↓
          </button>
        )}
      </div>

      {consultas.length === 0
        ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Todavía no recibiste consultas.</p>
          </div>
        : <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <thead>
              <tr>{['', 'Vehículo', 'Interesado', 'Mensaje', 'Fecha', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {consultas.map(c => (
                <tr key={c.id} onClick={() => verDetalle(c)}
                  style={{ borderBottom: '1px solid var(--gray2)', cursor: 'pointer', transition: 'background .2s', background: c.leido ? 'transparent' : 'rgba(230,51,41,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'}
                  onMouseLeave={e => e.currentTarget.style.background = c.leido ? 'transparent' : 'rgba(230,51,41,0.04)'}>
                  <td style={{ padding: '16px 20px', width: '8px' }}>
                    {!c.leido && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)' }} />}
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--white)', fontSize: '14px', fontWeight: c.leido ? 400 : 600 }}>{c.autos?.marca} {c.autos?.modelo}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{c.nombre_comprador}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--gray5)', fontSize: '13px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.mensaje}</td>
                  <td style={{ padding: '16px 20px', color: 'var(--gray5)', fontSize: '12px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</td>
                  <td style={{ padding: '16px 20px' }}><span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Ver →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  )
}

function Perfil({ concesionaria, onSave }) {
  const [form, setForm] = useState({
    nombre: concesionaria?.nombre || '',
    responsable: concesionaria?.responsable || '',
    telefono: concesionaria?.telefono || '',
    whatsapp: concesionaria?.whatsapp || '',
    email: concesionaria?.email || '',
    ciudad: concesionaria?.ciudad || '',
    direccion: concesionaria?.direccion || '',
    descripcion: concesionaria?.descripcion || '',
    logo_url: concesionaria?.logo_url || '',
    portada_url: concesionaria?.portada_url || ''
  })
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('concesionarias').update(form).eq('id', concesionaria.id)
    setLoading(false)
    setOk(true)
    setTimeout(() => setOk(false), 3000)
    onSave()
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px' }}>PERFIL COMERCIAL</div>
        <a href={`/concesionaria/${concesionaria.id}`} target="_blank" rel="noopener noreferrer">
          <button className="btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>Ver perfil público →</button>
        </a>
      </div>
      <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Configuración pública de la identidad de la concesionaria.</div>

      <form onSubmit={handleSave} style={{ background: 'var(--gray1)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--gray2)', marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--gray3)' }}>
            {form.logo_url ? <img src={form.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gray4)', fontFamily: 'var(--font-display)' }}>{form.nombre?.[0]?.toUpperCase() || '?'}</span>}
          </div>
          <div style={{ flex: 1 }} className="form-field">
            <label style={{ color: 'var(--white)', fontWeight: 'bold' }}>Logo de la Empresa (URL)</label>
            <input type="text" placeholder="Pegar enlace de la imagen" value={form.logo_url} onChange={e => setF('logo_url', e.target.value)} style={{ marginTop: '8px' }} />
            <span style={{ fontSize: '12px', color: 'var(--gray5)', marginTop: '4px' }}>Esta imagen aparecerá en tus publicaciones y perfil.</span>
          </div>
        </div>

        <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--gray2)' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)', marginBottom: '1rem' }}>IMAGEN DE PORTADA (BANNER)</div>
          {form.portada_url && (
            <div style={{ height: '120px', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--gray3)' }}>
              <img src={form.portada_url} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div className="form-field">
            <label style={{ color: 'var(--white)', fontWeight: 'bold' }}>URL de la imagen de portada</label>
            <input type="text" placeholder="Pegar enlace de la imagen de portada" value={form.portada_url} onChange={e => setF('portada_url', e.target.value)} style={{ marginTop: '8px' }} />
            <span style={{ fontSize: '12px', color: 'var(--gray5)', marginTop: '4px' }}>Esta imagen aparecerá como fondo en tu perfil público. Tamaño recomendado: 1200×300px.</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-field"><label>Razón Social / Nombre Comercial</label><input type="text" value={form.nombre} onChange={e => setF('nombre', e.target.value)} /></div>
          <div className="form-field"><label>Responsable de Ventas</label><input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)} /></div>
          <div className="form-field"><label>Teléfono Fijo</label><input type="text" value={form.telefono} onChange={e => setF('telefono', e.target.value)} /></div>
          <div className="form-field"><label>Línea WhatsApp Comercial</label><input type="text" placeholder="+54 9 387 421-0000" value={form.whatsapp} onChange={e => setF('whatsapp', e.target.value)} /></div>
          <div className="form-field"><label>Correo Electrónico Oficial</label><input type="email" value={form.email} onChange={e => setF('email', e.target.value)} /></div>
          <div className="form-field"><label>Provincia y Localidad</label><input type="text" value={form.ciudad} onChange={e => setF('ciudad', e.target.value)} /></div>
        </div>
        <div className="form-field" style={{ marginTop: '1.5rem' }}><label>Dirección del Local</label><input type="text" placeholder="Calle, Número, Barrio" value={form.direccion} onChange={e => setF('direccion', e.target.value)} /></div>
        <div className="form-field" style={{ marginTop: '1.5rem' }}><label>Breve Reseña de la Empresa</label><textarea style={{ height: '100px', resize: 'vertical' }} placeholder="Trayectoria, servicios, métodos de pago..." value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} /></div>

        <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--gray2)', paddingTop: '2rem' }}>
          <div>{ok && <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: 500 }}>✓ Configuración guardada exitosamente</span>}</div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'ACTUALIZANDO...' : 'GUARDAR CONFIGURACIÓN'}</button>
        </div>
      </form>
    </div>
  )
}

function MisPagos({ pagos }) {
  const LABELS = {
    subir_tope: 'Subir al tope',
    destacado: 'Destacado (30 días)',
    destacado_individual: 'Destacado individual',
    urgente: 'Urgente (30 días)',
    urgente_individual: 'Urgente individual',
    fijado_home: 'Vehículo fijado en Home',
    banner_home: 'Banner en Home',
    renovar: 'Renovar publicación',
    plan_basico: 'Plan Básico',
    plan_pro: 'Plan Pro',
    plan_premium: 'Plan Premium',
  }

  if (pagos.length === 0) {
    return (
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '2rem' }}>MIS PAGOS</div>
        <div style={{ padding: '5rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay pagos registrados aún.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '.5rem' }}>MIS PAGOS</div>
      <div style={{ fontSize: '13px', color: 'var(--gray5)', marginBottom: '2rem' }}>Historial de pagos procesados vía MercadoPago.</div>
      <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--gray2)' }}>
              {['Fecha', 'Servicio', 'Vehículo', 'Monto', 'Estado'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '14px 20px', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagos.map((p, i) => (
              <tr key={p.id || i} style={{ borderBottom: i < pagos.length - 1 ? '1px solid var(--gray2)' : 'none' }}>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--gray4)', whiteSpace: 'nowrap' }}>
                  {new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--white)', fontWeight: 600 }}>
                  {LABELS[p.tipo] || p.tipo}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--gray4)' }}>
                  {p.autos ? `${p.autos.marca} ${p.autos.modelo}` : '—'}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '14px', fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
                  ${Number(p.monto).toLocaleString('es-AR')}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', background: p.estado === 'approved' ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.08)', color: p.estado === 'approved' ? '#4ade80' : 'var(--gray4)', letterSpacing: '.05em' }}>
                    {p.estado === 'approved' ? 'APROBADO' : p.estado?.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
