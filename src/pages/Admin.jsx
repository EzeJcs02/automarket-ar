import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pendientes, setPendientes] = useState([])
  const [aprobadas, setAprobadas] = useState([])
  const [publicaciones, setPublicaciones] = useState([])
  const [pagos, setPagos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [publicidades, setPublicidades] = useState([])
  const [consultasAdmin, setConsultasAdmin] = useState([])
  const [profesionalesPendientes, setProfesionalesPendientes] = useState([])
  const [profesionalesActivos, setProfesionalesActivos] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [tab, setTab] = useState('pendientes')
  const [nuevaAd, setNuevaAd] = useState({ nombre: '', imagen_url: '', link_url: '', fondo: 'oscuro' })
  const [adLoading, setAdLoading] = useState(false)
  const [consultaDetalle, setConsultaDetalle] = useState(null)

  async function verConsulta(c) {
    setConsultaDetalle(c)
    if (!c.leido) {
      await supabase.from('consultas').update({ leido: true }).eq('id', c.id)
      setConsultasAdmin(prev => prev.map(x => x.id === c.id ? { ...x, leido: true } : x))
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (!isAdmin) { navigate('/panel'); return }
    loadData()
  }, [user, isAdmin, authLoading])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const [p, a, pub, pag, usersRes, ads, cons, profPend, profActivos] = await Promise.all([
        supabase.from('concesionarias').select('*').eq('aprobada', false).order('created_at'),
        supabase.from('concesionarias').select('*, autos(count)').eq('aprobada', true).order('nombre'),
        supabase.from('autos').select('*, concesionarias(nombre)').eq('activo', true).order('created_at', { ascending: false }),
        supabase.from('pagos').select('*, concesionarias(nombre), autos(marca, modelo)').order('created_at', { ascending: false }).limit(200),
        fetch('/api/admin-users', { headers: { Authorization: `Bearer ${session?.access_token}` } }).then(r => r.json()).catch(() => ({ users: [] })),
        supabase.from('publicidades').select('*').order('created_at', { ascending: false }),
        supabase.from('consultas').select('*, autos(marca, modelo), concesionarias(nombre)').order('created_at', { ascending: false }).limit(300),
        supabase.from('profesionales').select('*').eq('aprobado', false).order('created_at'),
        supabase.from('profesionales').select('*').eq('aprobado', true).order('nombre'),
      ])
      setPendientes(p.data || [])
      setAprobadas(a.data || [])
      setPublicaciones(pub.data || [])
      setPagos(pag.data || [])
      setUsuarios(usersRes.users || [])
      setPublicidades(ads.data || [])
      setConsultasAdmin(cons.data || [])
      setProfesionalesPendientes(profPend.data || [])
      setProfesionalesActivos(profActivos.data || [])
    } catch (err) {
      console.error('Admin loadData failed:', err)
      toast('Error al cargar los datos del panel', 'error')
    } finally {
      setDataLoading(false)
    }
  }

  async function adminAction(action, params = {}) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin-actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ action, ...params }),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}))
      toast(`Error: ${error || res.statusText}`, 'error')
      return false
    }
    return true
  }

  async function aprobar(id) {
    if (await adminAction('aprobar', { id })) loadData()
  }

  async function rechazar(id) {
    if (!confirm('¿Seguro que querés rechazar y eliminar permanentemente esta solicitud?')) return
    if (await adminAction('rechazar', { id })) loadData()
  }

  async function suspender(id) {
    if (!confirm('¿Suspender esta concesionaria? Sus publicaciones dejarán de ser visibles.')) return
    if (await adminAction('suspender', { id })) loadData()
  }

  async function toggleDestacada(c) {
    if (await adminAction('toggleDestacada', { id: c.id, value: !c.destacada })) loadData()
  }

  async function toggleBanner(c) {
    if (await adminAction('toggleBanner', { id: c.id, value: !c.banner_activo })) loadData()
  }

  async function toggleFijado(auto) {
    if (await adminAction('toggleFijado', { id: auto.id, value: !auto.fijado_home })) loadData()
  }

  async function cambiarPlan(c, nuevoPlan) {
    if (await adminAction('cambiarPlan', { id: c.id, plan: nuevoPlan })) loadData()
  }

  async function toggleDestacadoAuto(auto) {
    if (await adminAction('toggleDestacadoAuto', { id: auto.id, value: !auto.destacado })) loadData()
  }

  async function toggleUrgenteAuto(auto) {
    if (await adminAction('toggleUrgenteAuto', { id: auto.id, value: !auto.urgente })) loadData()
  }

  async function agregarAd() {
    const imagen_url = nuevaAd.imagen_url.trim()
    if (!nuevaAd.nombre.trim() || !imagen_url) return
    setAdLoading(true)
    const ok = await adminAction('agregarAd', {
      nombre: nuevaAd.nombre.trim(),
      imagen_url,
      link_url: nuevaAd.link_url.trim() || null,
      fondo: nuevaAd.fondo,
    })
    if (!ok) { setAdLoading(false); return }
    setNuevaAd({ nombre: '', imagen_url: '', link_url: '', fondo: 'oscuro' })
    const { data } = await supabase.from('publicidades').select('*').order('created_at', { ascending: false })
    setPublicidades(data || [])
    setAdLoading(false)
  }

  async function toggleAd(ad) {
    if (await adminAction('toggleAd', { id: ad.id, value: !ad.activo }))
      setPublicidades(prev => prev.map(a => a.id === ad.id ? { ...a, activo: !a.activo } : a))
  }

  async function aprobarProfesional(id) {
    if (await adminAction('aprobarProfesional', { id })) loadData()
  }

  async function eliminarUsuario(id, email) {
    if (!confirm(`¿Eliminar permanentemente al usuario "${email}"?\nSe borrarán también todas sus publicaciones.`)) return
    if (await adminAction('eliminarUsuario', { id })) setUsuarios(prev => prev.filter(u => u.id !== id))
  }

  async function rechazarProfesional(id) {
    if (!confirm('¿Seguro que querés rechazar y eliminar este perfil profesional?')) return
    if (await adminAction('rechazarProfesional', { id })) loadData()
  }

  async function suspenderProfesional(id) {
    if (!confirm('¿Suspender este profesional? Dejará de verse en el directorio.')) return
    if (await adminAction('suspenderProfesional', { id })) loadData()
  }

  async function toggleVerificadoProfesional(p) {
    if (await adminAction('toggleVerificadoProfesional', { id: p.id, value: !p.verificado })) loadData()
  }

  async function toggleDestacadoProfesional(p) {
    if (await adminAction('toggleDestacadoProfesional', { id: p.id, value: !p.destacado })) loadData()
  }

  async function eliminarAd(id) {
    if (!confirm('¿Eliminar esta publicidad?')) return
    if (await adminAction('eliminarAd', { id }))
      setPublicidades(prev => prev.filter(a => a.id !== id))
  }

  const navItems = [
    { id: 'pendientes', label: 'Solicitudes Pendientes', count: pendientes.length },
    { id: 'aprobadas', label: 'Agencias Activas', count: aprobadas.length },
    { id: 'publicaciones', label: 'Publicaciones', count: publicaciones.length },
    { id: 'pagos', label: 'Historial de Pagos', count: pagos.length },
    { id: 'usuarios', label: 'Usuarios Registrados', count: usuarios.length },
    { id: 'publicidades', label: 'Publicidades Laterales', count: publicidades.filter(a => a.activo).length },
    { id: 'consultas-admin', label: 'Consultas Globales', count: consultasAdmin.filter(c => !c.leido).length },
    { id: 'prof-pendientes', label: 'Profesionales Pendientes', count: profesionalesPendientes.length },
    { id: 'profesionales', label: 'Profesionales Activos', count: profesionalesActivos.length },
  ]

  return (
    <div className="page-wrapper panel-layout">

      {/* SIDEBAR */}
      <div className="panel-sidebar" style={{ borderRight: '1px solid var(--gray2)', padding: '2rem 0', background: '#080808' }}>
        <div style={{ padding: '0 1.5rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent)', letterSpacing: '.15em', borderBottom: '1px solid var(--gray2)', marginBottom: '1.5rem', fontWeight: 'bold' }}>
          MODO SUPERADMIN
        </div>
        <div className="sidebar-nav">
          {navItems.map(item => (
            <div key={item.id} onClick={() => setTab(item.id)}
              style={{ padding: '14px 1.5rem', fontSize: '13px', fontWeight: tab === item.id ? '600' : '400', color: tab === item.id ? 'var(--white)' : 'var(--gray4)', cursor: 'pointer', transition: 'all .2s', borderLeft: `3px solid ${tab === item.id ? 'var(--accent)' : 'transparent'}`, background: tab === item.id ? 'var(--gray1)' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {item.label}
              {item.count > 0 && (
                <span style={{ background: tab === item.id ? 'var(--accent)' : 'var(--gray2)', color: 'var(--white)', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 'bold' }}>
                  {item.count}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="panel-content" style={{ flex: 1, overflowY: 'auto' }}>
        {dataLoading ? <div className="spinner" /> : (
          <>
            {/* PENDIENTES */}
            {tab === 'pendientes' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>REVISIÓN DE CUENTAS</div>
                <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Aprobá o rechazá las nuevas solicitudes de concesionarias.</div>
                {pendientes.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay solicitudes de alta pendientes.</p></div>
                  : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: '600px' }}>
                      <thead><tr>{['Concesionaria','Ubicación','Contacto','Fecha','Resolución'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {pendientes.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid var(--gray2)', transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '14px' }}>{c.nombre}</div>
                              <div style={{ color: 'var(--gray4)', fontSize: '12px', marginTop: '4px' }}>Responsable: {c.responsable}</div>
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{c.ciudad}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{c.email}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray5)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</td>
                            <td style={{ padding: '16px 20px', display: 'flex', gap: '8px' }}>
                              <button className="btn-primary" onClick={() => aprobar(c.id)} style={{ padding: '6px 16px', fontSize: '12px', background: '#1a7a4a' }}>APROBAR</button>
                              <button className="btn-secondary" onClick={() => rechazar(c.id)} style={{ padding: '6px 16px', fontSize: '12px', borderColor: 'rgba(230,51,41,0.5)', color: 'var(--accent)' }}>RECHAZAR</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                }
              </div>
            )}

            {/* PUBLICACIONES */}
            {tab === 'publicaciones' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>PUBLICACIONES</div>
                <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Marcá autos como Destacados o Urgentes con un click.</div>
                {publicaciones.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay publicaciones activas.</p></div>
                  : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: '650px' }}>
                      <thead>
                        <tr>
                          {['Vehículo', 'Agencia', 'Precio', 'Destacado', 'Urgente', 'Fijado Home'].map(h => (
                            <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {publicaciones.map(a => (
                          <tr key={a.id} style={{ borderBottom: '1px solid var(--gray2)', transition: 'background .2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '14px' }}>{a.marca} {a.modelo}</div>
                              <div style={{ color: 'var(--gray5)', fontSize: '12px', marginTop: '2px' }}>{a.anio} · {Number(a.kilometraje || 0).toLocaleString('es-AR')} km</div>
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{a.concesionarias?.nombre || '—'}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--white)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                              {a.precio_ars ? '$' + Number(a.precio_ars).toLocaleString('es-AR') : 'Consultar'}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <button onClick={() => toggleDestacadoAuto(a)}
                                style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all .2s',
                                  background: a.destacado ? 'rgba(201,168,76,.25)' : 'rgba(255,255,255,.08)',
                                  color: a.destacado ? '#c9a84c' : 'var(--gray4)' }}>
                                {a.destacado ? 'Destacado' : 'Normal'}
                              </button>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <button onClick={() => toggleUrgenteAuto(a)}
                                style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all .2s',
                                  background: a.urgente ? 'rgba(230,51,41,.25)' : 'rgba(255,255,255,.08)',
                                  color: a.urgente ? 'var(--accent)' : 'var(--gray4)' }}>
                                {a.urgente ? 'Urgente' : 'Normal'}
                              </button>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <button onClick={() => toggleFijado(a)}
                                style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all .2s',
                                  background: a.fijado_home ? 'rgba(230,51,41,.25)' : 'rgba(255,255,255,.08)',
                                  color: a.fijado_home ? 'var(--accent)' : 'var(--gray4)' }}>
                                {a.fijado_home ? 'Fijado' : 'Normal'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                }
              </div>
            )}

            {/* APROBADAS */}
            {tab === 'aprobadas' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>AGENCIAS ACTIVAS</div>
                <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Gestión de concesionarias, planes y publicidad.</div>
                {aprobadas.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay agencias activas actualmente.</p></div>
                  : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: '600px' }}>
                      <thead><tr>{['Concesionaria','Ciudad','Plan','Destacada','Banner Home','Acciones'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {aprobadas.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid var(--gray2)', transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 20px', color: 'var(--white)', fontWeight: 600, fontSize: '14px' }}>{c.nombre}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{c.ciudad}</td>
                            <td style={{ padding: '16px 20px' }}>
                              <select
                                value={c.plan || 'free'}
                                onChange={e => cambiarPlan(c, e.target.value)}
                                style={{ background: 'var(--gray2)', border: '1px solid var(--gray3)', color: c.plan === 'premium' ? 'var(--accent)' : c.plan === 'pro' ? '#e0a020' : c.plan === 'basico' ? '#4ade80' : 'var(--gray4)', borderRadius: 'var(--radius)', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                                <option value="free">FREE</option>
                                <option value="basico">BÁSICO</option>
                                <option value="pro">PRO</option>
                                <option value="premium">PREMIUM</option>
                              </select>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <button onClick={() => toggleDestacada(c)} style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: c.destacada ? 'rgba(230,51,41,.2)' : 'rgba(255,255,255,.1)', color: c.destacada ? 'var(--accent)' : 'var(--gray4)', transition: 'all .2s' }}>
                                {c.destacada ? 'DESTACADA' : 'Normal'}
                              </button>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <button onClick={() => toggleBanner(c)} style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: c.banner_activo ? 'rgba(230,51,41,.2)' : 'rgba(255,255,255,.1)', color: c.banner_activo ? 'var(--accent)' : 'var(--gray4)', transition: 'all .2s' }}>
                                {c.banner_activo ? 'ACTIVO' : 'Inactivo'}
                              </button>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <button className="btn-secondary" onClick={() => suspender(c.id)} style={{ padding: '6px 16px', fontSize: '12px' }}>Suspender</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                }
              </div>
            )}

            {/* PAGOS */}
            {tab === 'pagos' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>HISTORIAL DE PAGOS</div>
                <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Todos los pagos procesados vía MercadoPago.</div>

                {/* RESUMEN DE INGRESOS */}
                {pagos.length > 0 && (() => {
                  const aprobados = pagos.filter(p => p.estado === 'approved')
                  const total = aprobados.reduce((s, p) => s + (Number(p.monto) || 0), 0)
                  const porTipo = aprobados.reduce((acc, p) => {
                    const k = p.tipo || 'otro'
                    acc[k] = (acc[k] || 0) + (Number(p.monto) || 0)
                    return acc
                  }, {})
                  const top = Object.entries(porTipo).sort((a, b) => b[1] - a[1]).slice(0, 6)
                  const hoy = new Date()
                  const mesActual = aprobados.filter(p => {
                    const d = new Date(p.created_at)
                    return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()
                  }).reduce((s, p) => s + (Number(p.monto) || 0), 0)

                  // Evolución mensual
                  const porMes = aprobados.reduce((acc, p) => {
                    const d = new Date(p.created_at)
                    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                    acc[k] = (acc[k] || 0) + (Number(p.monto) || 0)
                    return acc
                  }, {})
                  const meses = Object.entries(porMes).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
                  const maxMes = Math.max(...meses.map(m => m[1]), 1)

                  return (
                    <div style={{ marginBottom: '3rem' }}>
                      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                          { label: 'Total recaudado', value: '$' + total.toLocaleString('es-AR'), sub: `${aprobados.length} pagos aprobados` },
                          { label: 'Este mes', value: '$' + mesActual.toLocaleString('es-AR'), sub: new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' }) },
                          { label: 'Ticket promedio', value: aprobados.length ? '$' + Math.round(total / aprobados.length).toLocaleString('es-AR') : '—', sub: 'por pago aprobado' },
                        ].map(({ label, value, sub }) => (
                          <div key={label} style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem' }}>
                            <div style={{ fontSize: '11px', color: 'var(--gray5)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>{label}</div>
                            <div style={{ fontSize: '28px', fontFamily: 'var(--font-display)', color: 'var(--white)', marginBottom: '4px' }}>{value}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray4)' }}>{sub}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Gráfico por tipo */}
                        {top.length > 0 && (
                          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem' }}>
                            <div style={{ fontSize: '11px', color: 'var(--gray5)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>Ingresos por tipo de servicio</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {top.map(([tipo, monto]) => (
                                <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '120px', fontSize: '12px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tipo.replace(/_/g, ' ')}</div>
                                  <div style={{ flex: 1, background: 'var(--gray2)', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--accent)', borderRadius: '100px', width: `${Math.round((monto / top[0][1]) * 100)}%`, transition: 'width .4s' }} />
                                  </div>
                                  <div style={{ width: '90px', textAlign: 'right', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--white)', flexShrink: 0 }}>${monto.toLocaleString('es-AR')}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Gráfico evolución mensual */}
                        <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem' }}>
                          <div style={{ fontSize: '11px', color: 'var(--gray5)', textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>Evolución mensual</div>
                          {meses.length === 0 ? (
                            <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray4)', fontSize: '13px' }}>Sin datos históricos</div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '150px', paddingTop: '20px' }}>
                              {meses.map(([mes, monto]) => (
                                <div key={mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%' }}>
                                  <div style={{ flex: 1, width: '100%', background: 'var(--gray2)', borderRadius: '4px', position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                                    <div style={{ width: '100%', background: 'linear-gradient(to top, var(--accent), #f05040)', borderRadius: '4px', height: `${Math.round((monto / maxMes) * 100)}%`, transition: 'height .4s' }}>
                                      {monto > 0 && (
                                        <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--white)', fontWeight: 700 }}>
                                          ${Math.round(monto/1000)}k
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)' }}>{mes}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {pagos.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay pagos registrados aún.</p></div>
                  : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: '620px' }}>
                      <thead><tr>{['Fecha','Tipo','Vehículo / Agencia','Monto','Estado','MP ID'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {pagos.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--gray2)', transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 20px', color: 'var(--gray5)', fontSize: '12px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleString('es-AR')}</td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ background: 'rgba(201,168,76,.15)', color: '#c9a84c', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{p.tipo?.replace(/_/g, ' ')}</span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              {p.autos ? <div style={{ color: 'var(--white)', fontSize: '13px', fontWeight: 600 }}>{p.autos.marca} {p.autos.modelo}</div> : null}
                              {p.concesionarias ? <div style={{ color: 'var(--gray4)', fontSize: '12px', marginTop: '2px' }}>{p.concesionarias.nombre}</div> : null}
                              {!p.autos && !p.concesionarias ? <span style={{ color: 'var(--gray5)', fontSize: '12px' }}>—</span> : null}
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--white)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700 }}>
                              {p.monto ? '$' + Number(p.monto).toLocaleString('es-AR') : '—'}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
                                background: p.estado === 'approved' ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.08)',
                                color: p.estado === 'approved' ? '#4ade80' : 'var(--gray4)' }}>
                                {p.estado}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray5)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{p.mp_payment_id || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                }
              </div>
            )}

            {/* PUBLICIDADES LATERALES */}
            {tab === 'publicidades' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>PUBLICIDADES LATERALES</div>
                <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Ads externas (mecánicos, lubricentros, etc.) que aparecen en la columna derecha del home.</div>

                {/* FORM NUEVA AD */}
                <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Agregar nueva publicidad</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-field" style={{ margin: 0 }}>
                      <label>Nombre del negocio *</label>
                      <input placeholder="Ej: Lubricentro López" value={nuevaAd.nombre} onChange={e => setNuevaAd(p => ({ ...p, nombre: e.target.value }))} />
                    </div>
                    <div className="form-field" style={{ margin: 0 }}>
                      <label>URL de imagen * — subí tu imagen a <a href="https://imgur.com/upload" target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>Imgur</a> o similar y pegá el link</label>
                      <input placeholder="https://i.imgur.com/..." value={nuevaAd.imagen_url} onChange={e => setNuevaAd(p => ({ ...p, imagen_url: e.target.value }))} />
                    </div>
                    <div className="form-field" style={{ margin: 0 }}>
                      <label>Link al hacer click (opcional)</label>
                      <input placeholder="https://wa.me/..." value={nuevaAd.link_url} onChange={e => setNuevaAd(p => ({ ...p, link_url: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--gray4)', marginBottom: '8px', fontWeight: 500 }}>Fondo de la imagen</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['oscuro', 'claro'].map(f => (
                        <button key={f} onClick={() => setNuevaAd(p => ({ ...p, fondo: f }))}
                          style={{ padding: '7px 20px', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 500, border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .2s',
                            background: nuevaAd.fondo === f ? (f === 'oscuro' ? '#111' : '#fff') : 'transparent',
                            color: nuevaAd.fondo === f ? (f === 'oscuro' ? '#fff' : '#111') : 'var(--gray4)',
                            borderColor: nuevaAd.fondo === f ? (f === 'oscuro' ? 'var(--gray3)' : '#ccc') : 'var(--gray2)',
                          }}>
                          {f === 'oscuro' ? '■ Oscuro' : '□ Claro'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {nuevaAd.imagen_url && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--gray4)', marginBottom: '6px' }}>Preview:</div>
                      <img src={nuevaAd.imagen_url} alt="preview" style={{ width: '90px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--gray2)' }} onError={e => e.target.style.display='none'} />
                    </div>
                  )}
                  <button className="btn-primary" onClick={agregarAd} disabled={adLoading || !nuevaAd.nombre.trim() || !nuevaAd.imagen_url.trim()} style={{ padding: '8px 24px', fontSize: '13px' }}>
                    {adLoading ? 'Guardando...' : '+ Agregar publicidad'}
                  </button>
                </div>

                {/* LISTA */}
                {publicidades.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay publicidades cargadas aún.</p></div>
                  : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {publicidades.map(ad => (
                        <div key={ad.id} style={{ background: 'var(--gray1)', border: `1px solid ${ad.activo ? 'rgba(230,51,41,0.3)' : 'var(--gray2)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                          {ad.imagen_url
                            ? <img src={ad.imagen_url} alt={ad.nombre} style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                            : <div style={{ width: '100%', height: '130px', background: 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--gray4)' }}>Sin imagen</div>
                          }
                          <div style={{ padding: '12px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>{ad.nombre}</div>
                            {ad.link_url && <div style={{ fontSize: '10px', color: 'var(--gray4)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.link_url}</div>}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              <button onClick={() => toggleAd(ad)} style={{ flex: 1, padding: '5px 0', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: ad.activo ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.08)', color: ad.activo ? '#4ade80' : 'var(--gray4)', transition: 'all .2s' }}>
                                {ad.activo ? 'Activa' : 'Inactiva'}
                              </button>
                              <button onClick={() => eliminarAd(ad.id)} style={{ padding: '5px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(230,51,41,0.3)', cursor: 'pointer', background: 'transparent', color: 'var(--accent)', transition: 'all .2s' }}>
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* CONSULTAS GLOBALES */}
            {tab === 'consultas-admin' && (
              <div>
                {consultaDetalle && (
                  <div onClick={() => setConsultaDetalle(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '500px', border: '1px solid var(--gray2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>CONSULTA</div>
                        <button onClick={() => setConsultaDetalle(null)} style={{ background: 'transparent', border: 'none', color: 'var(--gray4)', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                      </div>
                      <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>VEHÍCULO</div>
                        <div style={{ fontWeight: 600 }}>{consultaDetalle.autos?.marca} {consultaDetalle.autos?.modelo}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray4)', marginTop: '2px' }}>Concesionaria: {consultaDetalle.concesionarias?.nombre || '—'}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                          <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>NOMBRE</div>
                          <div style={{ fontSize: '14px' }}>{consultaDetalle.nombre_comprador}</div>
                        </div>
                        <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                          <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>EMAIL</div>
                          <div style={{ fontSize: '13px', color: 'var(--accent)' }}>{consultaDetalle.email_comprador}</div>
                        </div>
                      </div>
                      <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>MENSAJE</div>
                        <p style={{ fontSize: '14px', lineHeight: 1.7, margin: 0 }}>{consultaDetalle.mensaje}</p>
                      </div>
                      <button className="btn-primary" style={{ width: '100%' }}
                        onClick={() => window.open(`mailto:${consultaDetalle.email_comprador}?subject=Re: ${consultaDetalle.autos?.marca} ${consultaDetalle.autos?.modelo}`)}>
                        Responder por email
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>CONSULTAS GLOBALES</div>
                <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Todas las consultas recibidas en la plataforma ({consultasAdmin.length} total).</div>
                {consultasAdmin.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay consultas registradas.</p></div>
                  : <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                      <thead><tr>{['Fecha','Vehículo','Agencia','Comprador','Mensaje',''].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {consultasAdmin.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid var(--gray2)', cursor: 'pointer', transition: 'background .2s', background: c.leido ? 'transparent' : 'rgba(230,51,41,0.04)' }}
                            onClick={() => verConsulta(c)}
                            onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'}
                            onMouseLeave={e => e.currentTarget.style.background = c.leido ? 'transparent' : 'rgba(230,51,41,0.04)'}>
                            <td style={{ padding: '14px 20px', color: 'var(--gray5)', fontSize: '11px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</td>
                            <td style={{ padding: '14px 20px', color: 'var(--white)', fontSize: '13px', fontWeight: 600 }}>{c.autos?.marca} {c.autos?.modelo}</td>
                            <td style={{ padding: '14px 20px', color: 'var(--gray4)', fontSize: '12px' }}>{c.concesionarias?.nombre || '—'}</td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ color: 'var(--white)', fontSize: '13px' }}>{c.nombre_comprador}</div>
                              <div style={{ color: 'var(--accent)', fontSize: '11px' }}>{c.email_comprador}</div>
                            </td>
                            <td style={{ padding: '14px 20px', color: 'var(--gray4)', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.mensaje}</td>
                            <td style={{ padding: '14px 20px' }}><span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Ver →</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                }
              </div>
            )}

            {/* USUARIOS */}
            {tab === 'usuarios' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>USUARIOS REGISTRADOS</div>
                <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Todos los usuarios particulares registrados en la plataforma.</div>
                {usuarios.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay usuarios registrados aún.</p></div>
                  : <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                      <thead><tr>{['Nombre','Email','Registro','Último acceso',''].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {usuarios.map(u => (
                          <tr key={u.id} style={{ borderBottom: '1px solid var(--gray2)', transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 20px', color: 'var(--white)', fontWeight: 600, fontSize: '14px' }}>{u.nombre || <span style={{ color: 'var(--gray4)', fontWeight: 400 }}>—</span>}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{u.email}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray5)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{new Date(u.created_at).toLocaleDateString('es-AR')}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray5)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('es-AR') : '—'}</td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              <button onClick={() => eliminarUsuario(u.id, u.email)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(230,51,41,0.3)', cursor: 'pointer', background: 'transparent', color: 'var(--accent)', transition: 'all .2s' }}>
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                }
              </div>
            )}
            {/* PROFESIONALES PENDIENTES */}
            {tab === 'prof-pendientes' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>PROFESIONALES PENDIENTES</div>
                <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Solicitudes de alta de profesionales automotores.</div>
                {profesionalesPendientes.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay solicitudes pendientes.</p></div>
                  : <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                      <thead><tr>{['Nombre','Categoría','Ciudad','Email','Fecha','Resolución'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {profesionalesPendientes.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--gray2)', transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 20px', color: 'var(--white)', fontWeight: 600, fontSize: '14px' }}>{p.nombre}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{p.categoria}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{p.ciudad || '—'}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{p.email}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray5)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{new Date(p.created_at).toLocaleDateString('es-AR')}</td>
                            <td style={{ padding: '16px 20px', display: 'flex', gap: '8px' }}>
                              <button className="btn-primary" onClick={() => aprobarProfesional(p.id)} style={{ padding: '6px 16px', fontSize: '12px', background: '#1a7a4a' }}>APROBAR</button>
                              <button className="btn-secondary" onClick={() => rechazarProfesional(p.id)} style={{ padding: '6px 16px', fontSize: '12px', borderColor: 'rgba(230,51,41,0.5)', color: 'var(--accent)' }}>RECHAZAR</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                }
              </div>
            )}

            {/* PROFESIONALES ACTIVOS */}
            {tab === 'profesionales' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>PROFESIONALES ACTIVOS</div>
                <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Gestión de profesionales del directorio.</div>
                {profesionalesActivos.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay profesionales activos aún.</p></div>
                  : <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                      <thead><tr>{['Nombre','Categoría','Ciudad','Plan','Verificado','Destacado','Acciones'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {profesionalesActivos.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--gray2)', transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1e1e1e'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 20px', color: 'var(--white)', fontWeight: 600, fontSize: '14px' }}>{p.nombre}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{p.categoria}</td>
                            <td style={{ padding: '16px 20px', color: 'var(--gray4)', fontSize: '13px' }}>{p.ciudad || '—'}</td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
                                background: p.plan === 'destacado' ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.08)',
                                color: p.plan === 'destacado' ? '#c9a84c' : 'var(--gray4)' }}>
                                {(p.plan || 'base').toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <button onClick={() => toggleVerificadoProfesional(p)}
                                style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                  background: p.verificado ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.1)',
                                  color: p.verificado ? '#4ade80' : 'var(--gray4)', transition: 'all .2s' }}>
                                {p.verificado ? 'Verificado ✔' : 'No'}
                              </button>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <button onClick={() => toggleDestacadoProfesional(p)}
                                style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                  background: p.destacado ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.1)',
                                  color: p.destacado ? '#c9a84c' : 'var(--gray4)', transition: 'all .2s' }}>
                                {p.destacado ? 'Destacado' : 'Normal'}
                              </button>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <button className="btn-secondary" onClick={() => suspenderProfesional(p.id)} style={{ padding: '6px 16px', fontSize: '12px' }}>Suspender</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                }
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}