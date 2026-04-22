import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [pendientes, setPendientes] = useState([])
  const [aprobadas, setAprobadas] = useState([])
  const [publicaciones, setPublicaciones] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [tab, setTab] = useState('pendientes')

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (!isAdmin) { navigate('/panel'); return }
    loadData()
  }, [user, isAdmin, authLoading])

  async function loadData() {
    const [p, a, pub] = await Promise.all([
      supabase.from('concesionarias').select('*').eq('aprobada', false).order('created_at'),
      supabase.from('concesionarias').select('*, autos(count)').eq('aprobada', true).order('nombre'),
      supabase.from('autos').select('*, concesionarias(nombre)').eq('activo', true).order('created_at', { ascending: false })
    ])
    setPendientes(p.data || [])
    setAprobadas(a.data || [])
    setPublicaciones(pub.data || [])
    setDataLoading(false)
  }

  async function aprobar(id) {
    await supabase.from('concesionarias').update({ aprobada: true }).eq('id', id)
    loadData()
  }

  async function rechazar(id) {
    if (!confirm('¿Seguro que querés rechazar y eliminar permanentemente esta solicitud?')) return
    await supabase.from('concesionarias').delete().eq('id', id)
    loadData()
  }

  async function suspender(id) {
    if (!confirm('¿Suspender esta concesionaria? Sus publicaciones dejarán de ser visibles.')) return
    await supabase.from('concesionarias').update({ aprobada: false }).eq('id', id)
    loadData()
  }

  async function toggleDestacada(c) {
    await supabase.from('concesionarias').update({ destacada: !c.destacada }).eq('id', c.id)
    loadData()
  }

  async function cambiarPlan(c, nuevoPlan) {
    await supabase.from('concesionarias').update({ plan: nuevoPlan }).eq('id', c.id)
    loadData()
  }

  async function toggleDestacadoAuto(auto) {
    await supabase.from('autos').update({ destacado: !auto.destacado, urgente: false }).eq('id', auto.id)
    loadData()
  }

  async function toggleUrgenteAuto(auto) {
    await supabase.from('autos').update({ urgente: !auto.urgente, destacado: false }).eq('id', auto.id)
    loadData()
  }

  const navItems = [
    { id: 'pendientes', label: 'Solicitudes Pendientes', count: pendientes.length },
    { id: 'aprobadas', label: 'Agencias Activas', count: aprobadas.length },
    { id: 'publicaciones', label: 'Publicaciones', count: publicaciones.length },
  ]

  return (
    <div className="page-wrapper" style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>

      {/* SIDEBAR */}
      <div style={{ width: '250px', flexShrink: 0, borderRight: '1px solid var(--gray2)', padding: '2rem 0', background: '#080808' }}>
        <div style={{ padding: '0 1.5rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent)', letterSpacing: '.15em', borderBottom: '1px solid var(--gray2)', marginBottom: '1.5rem', fontWeight: 'bold' }}>
          MODO SUPERADMIN
        </div>
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

      {/* CONTENIDO */}
      <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto' }}>
        {dataLoading ? <div className="spinner" /> : (
          <>
            {/* PENDIENTES */}
            {tab === 'pendientes' && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>REVISIÓN DE CUENTAS</div>
                <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Aprobá o rechazá las nuevas solicitudes de concesionarias.</div>
                {pendientes.length === 0
                  ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>No hay solicitudes de alta pendientes.</p></div>
                  : <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
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
                    </table>
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
                  : <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                      <thead>
                        <tr>
                          {['Vehículo', 'Agencia', 'Precio', 'Destacado', 'Urgente'].map(h => (
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  : <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                      <thead><tr>{['Concesionaria','Ciudad','Plan','Destacada','Acciones'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
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
                              <button className="btn-secondary" onClick={() => suspender(c.id)} style={{ padding: '6px 16px', fontSize: '12px' }}>Suspender</button>
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