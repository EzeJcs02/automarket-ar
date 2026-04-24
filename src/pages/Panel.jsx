import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MARCAS = ['Toyota','Ford','Volkswagen','Chevrolet','Renault','Peugeot','Fiat','Honda','Nissan','Jeep','Citroën','Otro']
const LIMITES_PLAN = { free: 1, basico: 8, pro: 20, premium: 50 }
const WA_PLANES = 'https://wa.me/5493874111111'

export default function Panel() {
  const { user, concesionaria, fetchConcesionaria, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [autos, setAutos] = useState([])
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (isAdmin) { navigate('/admin'); return }
    if (concesionaria) loadData()
    else setLoading(false)
  }, [user, concesionaria, authLoading])

  async function loadData() {
    const [autosRes, consultasRes] = await Promise.all([
      supabase.from('autos').select('*, vistas').eq('concesionaria_id', concesionaria.id).order('created_at', { ascending: false }),
      supabase.from('consultas').select('*, autos(marca, modelo)').eq('concesionaria_id', concesionaria.id).order('created_at', { ascending: false })
    ])
    setAutos(autosRes.data || [])
    setConsultas(consultasRes.data || [])
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
            {tab === 'dashboard' && <Dashboard autos={autos} consultas={consultas} concesionaria={concesionaria} esPremium={esPremium} limiteAlcanzado={limiteAlcanzado} setTab={setTab} />}
            {tab === 'mis-autos' && <MisAutos autos={autos} reload={loadData} setTab={setTab} concesionaria={concesionaria} />}
            {tab === 'nuevo-auto' && <NuevoAuto concesionaria={concesionaria} autos={autos} esPremium={esPremium} limiteAlcanzado={limiteAlcanzado} onSuccess={() => { loadData(); setTab('mis-autos') }} />}
            {tab === 'consultas' && <Consultas consultas={consultas} reload={loadData} />}
            {tab === 'perfil' && <Perfil concesionaria={concesionaria} onSave={() => fetchConcesionaria(user.id)} />}
          </>
        )}
      </div>
    </div>
  )
}

function UpgradeModal({ onClose, planActual }) {
  const planes = [
    { id: 'basico', nombre: 'BÁSICO', precio: '30.000', limite: '8 publicaciones', color: 'var(--gray4)', msg: 'Hola! Quiero contratar el Plan Básico de AutoMarket AR' },
    { id: 'pro', nombre: 'PRO', precio: '70.000', limite: '20 publicaciones + 3 destacados', color: '#e0a020', msg: 'Hola! Quiero contratar el Plan Pro de AutoMarket AR' },
    { id: 'premium', nombre: 'PREMIUM', precio: '150.000', limite: '50 autos + Badge verificada', color: 'var(--accent)', msg: 'Hola! Quiero contratar el Plan Premium de AutoMarket AR' },
  ]
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
              <button onClick={() => window.open(`${WA_PLANES}?text=${encodeURIComponent(p.msg)}`, '_blank')}
                style={{ padding: '9px', borderRadius: 'var(--radius)', border: 'none', background: p.id === 'premium' ? 'var(--accent)' : 'var(--gray2)', color: 'var(--white)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                Contratar →
              </button>
            </div>
          ))}
        </div>
        <button className="btn-secondary" style={{ width: '100%' }} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

function Dashboard({ autos, consultas, concesionaria, esPremium, limiteAlcanzado, setTab }) {
  const [consultaDetalle, setConsultaDetalle] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (!concesionaria?.aprobada) return (
    <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid rgba(201,168,76,.3)', maxWidth: '600px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--gold)', marginBottom: '1rem' }}>CUENTA EN REVISIÓN</div>
      <p style={{ color: 'var(--gray4)', fontSize: '15px', lineHeight: 1.7 }}>Tu perfil comercial está siendo validado por el equipo de FIORA.MARKET. Recibirás un correo cuando puedas comenzar a publicar stock.</p>
    </div>
  )

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
          </div>
          {concesionaria?.plan !== 'premium' && (
            <button onClick={() => setShowUpgrade(true)} style={{ background: 'var(--accent)', border: 'none', color: 'var(--white)', padding: '10px 20px', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Mejorar plan →
            </button>
          )}
        </div>
        {/* PLANES DISPONIBLES */}
        {concesionaria?.plan !== 'premium' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', paddingTop: '1.25rem', borderTop: '1px solid var(--gray2)' }}>
            {[
              { id: 'basico', nombre: 'BÁSICO', precio: '$30.000', limite: '8 publicaciones', color: '#4ade80', msg: 'Hola! Quiero contratar el Plan Básico de AutoMarket AR' },
              { id: 'pro', nombre: 'PRO', precio: '$70.000', limite: '20 autos + 3 destacados/mes', color: '#e0a020', msg: 'Hola! Quiero contratar el Plan Pro de AutoMarket AR' },
              { id: 'premium', nombre: 'PREMIUM', precio: '$150.000', limite: '50 autos + Verificada', color: 'var(--accent)', msg: 'Hola! Quiero contratar el Plan Premium de AutoMarket AR' },
            ].filter(p => {
              const orden = { free: 0, basico: 1, pro: 2, premium: 3 }
              return orden[p.id] > orden[concesionaria?.plan || 'free']
            }).map(p => (
              <button key={p.id} onClick={() => window.open(`${WA_PLANES}?text=${encodeURIComponent(p.msg)}`, '_blank')}
                style={{ background: 'var(--black)', border: `1px solid ${p.color}22`, borderRadius: 'var(--radius)', padding: '12px', textAlign: 'left', cursor: 'pointer', transition: 'border-color .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = `${p.color}22`}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: p.color, marginBottom: '4px' }}>{p.nombre}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--white)', marginBottom: '2px' }}>{p.precio}<span style={{ fontSize: '10px', color: 'var(--gray4)', marginLeft: '3px' }}>/mes</span></div>
                <div style={{ fontSize: '11px', color: 'var(--gray4)' }}>{p.limite}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[['Stock Activo', autos.filter(a => a.activo).length], ['Stock Pausado', autos.filter(a => !a.activo).length], ['Vistas Totales', autos.reduce((s, a) => s + (a.vistas || 0), 0)], ['Total Consultas', consultas.length], ['Consultas (7 días)', consultas.filter(c => new Date(c.created_at) > new Date(Date.now()-7*86400000)).length]].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--gray1)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)' }}>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--white)', lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

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
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  const plan = concesionaria?.plan || 'free'
  const destacadosActivos = autos.filter(a => a.destacado).length
  const urgentesActivos = autos.filter(a => a.urgente).length
  const limiteDestacados = plan === 'premium' ? Infinity : plan === 'pro' ? 3 : 0

  async function toggleDestacado(auto) {
    if (!auto.destacado) {
      if (limiteDestacados === 0) {
        alert('Tu plan no incluye boosts. Upgradá a Pro o Premium.')
        return
      }
      if (limiteDestacados !== Infinity && destacadosActivos >= limiteDestacados) {
        alert(`Tu plan Pro permite hasta ${limiteDestacados} destacados simultáneos. Ya tenés ${destacadosActivos} activos.`)
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
        alert('Tu plan no incluye boosts. Upgradá a Pro o Premium.')
        return
      }
      if (limiteDestacados !== Infinity && urgentesActivos >= limiteDestacados) {
        alert(`Tu plan Pro permite hasta ${limiteDestacados} urgentes simultáneos. Ya tenés ${urgentesActivos} activos.`)
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
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => toggleDestacado(a)}
                        style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all .2s',
                          background: a.destacado ? 'rgba(201,168,76,.25)' : 'rgba(255,255,255,.08)',
                          color: a.destacado ? '#c9a84c' : 'var(--gray4)' }}>
                        ★ Destacar
                      </button>
                      <button onClick={() => toggleUrgente(a)}
                        style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all .2s',
                          background: a.urgente ? 'rgba(230,51,41,.25)' : 'rgba(255,255,255,.08)',
                          color: a.urgente ? 'var(--accent)' : 'var(--gray4)' }}>
                        ⚡ Urgente
                      </button>
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

function NuevoAuto({ concesionaria, autos, esPremium, limiteAlcanzado, onSuccess }) {
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '', kilometraje: '0', tipo: 'nuevo', combustible: 'Nafta', transmision: 'Manual', color: '', precio_ars: '', precio_usd: '', descripcion: '' })
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleFotos(e) {
    const files = Array.from(e.target.files)
    if (files.length < 5) { setError('Debés subir mínimo 5 fotos.'); setFotos([]); return }
    setError('')
    setFotos(files)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!concesionaria?.aprobada) { setError('Tu cuenta debe estar aprobada para publicar.'); return }
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
      tipo: form.tipo, combustible: form.combustible, transmision: form.transmision,
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
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>GALERÍA DE IMÁGENES</div>
          <label style={{ display: 'block', border: `2px dashed ${fotos.length >= 5 ? 'var(--green)' : 'var(--gray3)'}`, borderRadius: 'var(--radius)', padding: '3rem', textAlign: 'center', cursor: 'pointer', marginBottom: '2rem', transition: 'border .2s' }}>
            <input type="file" accept="image/*" multiple onChange={handleFotos} style={{ display: 'none' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: fotos.length >= 5 ? '#4ade80' : 'var(--white)', marginBottom: '4px' }}>
              {fotos.length > 0 ? `${fotos.length} fotos seleccionadas ${fotos.length >= 5 ? '✓' : `(faltan ${5 - fotos.length})`}` : 'Click para subir fotografías'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gray5)' }}>Mínimo 5 fotos · Sin límite máximo · JPG, PNG</div>
          </label>

          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>ESPECIFICACIONES TÉCNICAS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-field"><label>Marca *</label><input type="text" placeholder="Ej: KTM, BMW, Honda..." value={form.marca} onChange={e => setF('marca', e.target.value)} required /></div>
            <div className="form-field"><label>Modelo Exacto *</label><input type="text" placeholder="Ej: Amarok 2.0 TDI" value={form.modelo} onChange={e => setF('modelo', e.target.value)} required /></div>
            <div className="form-field"><label>Año *</label><input type="number" placeholder="2024" min="1900" max="2030" value={form.anio} onChange={e => setF('anio', e.target.value)} required /></div>
            <div className="form-field"><label>Kilometraje *</label><input type="number" placeholder="0" min="0" value={form.kilometraje} onChange={e => setF('kilometraje', e.target.value)} required /></div>
            <div className="form-field"><label>Condición *</label><select value={form.tipo} onChange={e => setF('tipo', e.target.value)} required><option value="nuevo">0KM / Nuevo</option><option value="usado">Usado</option></select></div>
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
