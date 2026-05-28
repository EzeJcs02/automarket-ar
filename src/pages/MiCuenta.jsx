import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'
import { useToast } from '../context/ToastContext'

export default function MiCuenta() {
  const { user, concesionaria, isAdmin, loading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [favoritos, setFavoritos] = useState([])
  const [favoritoIds, setFavoritoIds] = useState(new Set())
  const [consultas, setConsultas] = useState([])
  const [consultasRecibidas, setConsultasRecibidas] = useState([])
  const [misAutos, setMisAutos] = useState([])
  const [pagos, setPagos] = useState([])
  const [tab, setTab] = useState('publicaciones')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [editandoAuto, setEditandoAuto] = useState(null)
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [perfilForm, setPerfilForm] = useState({ nombre: '', telefono: '' })
  const [savingPerfil, setSavingPerfil] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mp = params.get('mp')
    if (mp === 'ok') {
      toast('¡Pago exitoso! Tu boost se activará en breve.', 'success')
      window.history.replaceState({}, '', '/mi-cuenta')
    } else if (mp === 'fail') {
      toast('El pago no se completó. Podés intentarlo nuevamente.', 'error')
      window.history.replaceState({}, '', '/mi-cuenta')
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user || concesionaria || isAdmin) { navigate('/'); return }
    fetchData()
  }, [user, concesionaria, isAdmin, authLoading])

  async function fetchData() {
    const [{ data: favData }, { data: consData }, { data: autosData }, { data: pagosData }] = await Promise.all([
      supabase.from('favoritos').select('auto_id, autos(*, concesionarias(nombre, ciudad, plan))').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('consultas').select('*, autos(marca, modelo)').eq('email_comprador', user.email).order('created_at', { ascending: false }),
      supabase.from('autos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('pagos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    const lista = favData?.map(f => f.autos).filter(Boolean) || []
    setFavoritos(lista)
    setFavoritoIds(new Set(lista.map(a => a.id)))
    setConsultas(consData || [])
    setMisAutos(autosData || [])
    setPagos(pagosData || [])
    const autoIds = autosData?.map(a => a.id) || []
    if (autoIds.length > 0) {
      const { data: consRecibidas } = await supabase.from('consultas').select('*, autos(marca, modelo)').in('auto_id', autoIds).order('created_at', { ascending: false })
      setConsultasRecibidas(consRecibidas || [])
    } else {
      setConsultasRecibidas([])
    }
    setLoading(false)
  }

  async function toggleFavorito(autoId) {
    await supabase.from('favoritos').delete().eq('user_id', user.id).eq('auto_id', autoId)
    setFavoritos(prev => prev.filter(a => a.id !== autoId))
    setFavoritoIds(prev => { const s = new Set(prev); s.delete(autoId); return s })
  }

  async function despublicar(autoId) {
    if (!confirm('¿Desactivar esta publicación?')) return
    await supabase.from('autos').update({ activo: false }).eq('id', autoId)
    setMisAutos(prev => prev.filter(a => a.id !== autoId))
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const nombre = user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'

  function abrirEditarPerfil() {
    setPerfilForm({ nombre: user?.user_metadata?.nombre || '', telefono: user?.user_metadata?.telefono || '' })
    setEditandoPerfil(true)
  }

  async function guardarPerfil(e) {
    e.preventDefault()
    setSavingPerfil(true)
    await supabase.auth.updateUser({ data: { nombre: perfilForm.nombre, telefono: perfilForm.telefono } })
    setSavingPerfil(false)
    setEditandoPerfil(false)
  }

  const tabStyle = active => ({
    padding: '10px 20px', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, letterSpacing: '.05em', transition: 'all .2s',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--white)' : 'var(--gray4)',
  })

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>

  return (
    <div className="page-wrapper">
      <div className="responsive-section" style={{ padding: '3rem 4rem', borderBottom: '1px solid var(--gray2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '.5rem' }}>Mi cuenta</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', lineHeight: 1 }}>{nombre.toUpperCase()}</div>
          <div style={{ fontSize: '13px', color: 'var(--gray4)', marginTop: '6px' }}>{user?.email}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={abrirEditarPerfil}>Editar perfil</button>
          <button className="btn-secondary" onClick={handleSignOut}>Cerrar sesión</button>
        </div>
      </div>

      {editandoPerfil && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setEditandoPerfil(false)}>
          <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '460px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '2rem' }}>EDITAR PERFIL</div>
            <form onSubmit={guardarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label>Nombre</label>
                <input type="text" placeholder="Tu nombre" value={perfilForm.nombre} onChange={e => setPerfilForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Teléfono / WhatsApp</label>
                <input type="tel" placeholder="Ej: 3874123456" value={perfilForm.telefono} onChange={e => setPerfilForm(p => ({ ...p, telefono: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" disabled={savingPerfil} style={{ flex: 1 }}>
                  {savingPerfil ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditandoPerfil(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HALLAZGO 4 FIX: Acceso directo al Botón de Arrepentimiento — Res. 424/2020 */}
      <div className="responsive-section" style={{ padding: '10px 4rem', background: 'rgba(230,51,41,.05)', borderBottom: '1px solid rgba(230,51,41,.12)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: 'var(--gray4)' }}>¿Querés cancelar una compra o reserva?</span>
        <Link
          to="/arrepentimiento"
          style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '3px', whiteSpace: 'nowrap' }}
        >
          Botón de Arrepentimiento (Res. 424/2020) →
        </Link>
      </div>

      <div className="responsive-section" style={{ padding: '1.5rem 4rem', borderBottom: '1px solid var(--gray2)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button style={tabStyle(tab === 'publicaciones')} onClick={() => { setTab('publicaciones'); setShowForm(false) }}>Mis publicaciones ({misAutos.length})</button>
        <button style={tabStyle(tab === 'consultas-recibidas')} onClick={() => setTab('consultas-recibidas')}>
          Consultas recibidas {consultasRecibidas.filter(c => !c.leido).length > 0 && <span style={{ marginLeft: '6px', background: tab === 'consultas-recibidas' ? 'rgba(255,255,255,.3)' : 'var(--accent)', color: 'var(--white)', padding: '1px 7px', borderRadius: '100px', fontSize: '10px' }}>{consultasRecibidas.filter(c => !c.leido).length}</span>}
        </button>
        <button style={tabStyle(tab === 'consultas')} onClick={() => setTab('consultas')}>Consultas enviadas ({consultas.length})</button>
        <button style={tabStyle(tab === 'favoritos')} onClick={() => setTab('favoritos')}>Favoritos ({favoritos.length})</button>
        <button
          style={{ ...tabStyle(tab === 'planes'), ...(tab !== 'planes' ? { color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '3px' } : {}) }}
          onClick={() => setTab('planes')}>
          Mi Plan
        </button>
      </div>

      {tab === 'favoritos' && (
        <div className="responsive-section" style={{ padding: '2rem 4rem' }}>
          {favoritos.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '1rem' }}>NINGÚN FAVORITO AÚN</div>
              <p style={{ color: 'var(--gray4)', fontSize: '15px', marginBottom: '2rem' }}>Explorá el catálogo y guardá los vehículos que te interesen.</p>
              <button className="btn-primary" onClick={() => navigate('/catalogo')}>Ver catálogo →</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px,100%), 1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
              {favoritos.map(a => (
                <CarCard key={a.id} auto={a} isFavorito={favoritoIds.has(a.id)} onToggleFavorito={toggleFavorito} />
              ))}
            </div>
          )}
        </div>
      )}

      {editandoAuto && (
        <EditarAutoModal auto={editandoAuto} onClose={() => setEditandoAuto(null)} onSave={() => { setEditandoAuto(null); fetchData() }} />
      )}

      {tab === 'consultas-recibidas' && (
        <div className="responsive-section" style={{ padding: '2rem 4rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '4px' }}>CONSULTAS RECIBIDAS</div>
          <div style={{ fontSize: '13px', color: 'var(--gray4)', marginBottom: '2rem' }}>Mensajes de interesados en tus publicaciones.</div>
          {consultasRecibidas.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '1rem' }}>SIN CONSULTAS AÚN</div>
              <p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Cuando alguien contacte tus publicaciones, aparecerá aquí.</p>
            </div>
          ) : (
            <ConsultasRecibidasList consultas={consultasRecibidas} onRead={fetchData} />
          )}
        </div>
      )}

      {tab === 'consultas' && (
        <div className="responsive-section" style={{ padding: '2rem 4rem' }}>
          {consultas.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '1rem' }}>SIN CONSULTAS AÚN</div>
              <p style={{ color: 'var(--gray4)', fontSize: '15px', marginBottom: '2rem' }}>Cuando contactes a una concesionaria, tus consultas aparecerán aquí.</p>
              <button className="btn-primary" onClick={() => navigate('/catalogo')}>Ver catálogo →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '700px' }}>
              {consultas.map(c => (
                <Link to={`/auto/${c.auto_id}`} key={c.id} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', transition: 'border-color .2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray2)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '15px' }}>{c.autos ? `${c.autos.marca} ${c.autos.modelo}` : 'Vehículo'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray4)' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--gray4)', lineHeight: 1.5 }}>{c.mensaje}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'publicaciones' && (
        <div className="responsive-section" style={{ padding: '2rem 4rem' }}>
          <div style={{ display: showForm ? 'block' : 'none' }}>
            <PublicarForm key={formKey} user={user} onSuccess={() => { setShowForm(false); setFormKey(k => k + 1); fetchData() }} onCancel={() => { setShowForm(false); setFormKey(k => k + 1) }} />
          </div>
          {!showForm ? (
            <>
              {(() => {
                const limite = 4
                const puedePublicar = misAutos.length < limite
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '4px' }}>MIS PUBLICACIONES</div>
                        <div style={{ fontSize: '13px', color: 'var(--gray4)' }}>
                          Plan gratuito: hasta 4 publicaciones activas por 30 días.
                        </div>
                      </div>
                      {puedePublicar && (
                        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Publicar vehículo</button>
                      )}
                    </div>
                    {!puedePublicar && (
                      <div style={{ background: 'rgba(224,160,32,.08)', border: '1px solid rgba(224,160,32,.3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e0a020', marginBottom: '2px' }}>Límite alcanzado</div>
                        <div style={{ fontSize: '13px', color: 'var(--gray4)' }}>El plan gratuito permite hasta 4 publicaciones activas. Eliminá una para poder publicar otra.</div>
                      </div>
                    )}
                  </>
                )
              })()}
              {misAutos.length === 0 ? (
                <div style={{ padding: '5rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '1rem' }}>SIN PUBLICACIONES AÚN</div>
                  <p style={{ color: 'var(--gray4)', fontSize: '15px', marginBottom: '2rem' }}>Publicá tu vehículo gratis por 30 días.</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>+ Publicar ahora</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '700px' }}>
                  {misAutos.map(a => (
                    <div key={a.id} style={{ background: 'var(--gray1)', border: `1px solid ${a.destacado ? 'rgba(201,168,76,.4)' : a.urgente ? 'rgba(230,51,41,.4)' : 'var(--gray2)'}`, borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {a.fotos?.[0] && <img src={a.fotos[0]} alt="" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius)', flexShrink: 0 }} />}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '15px' }}>{a.marca} {a.modelo}</div>
                            {a.destacado && <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(201,168,76,.2)', color: '#c9a84c', padding: '2px 8px', borderRadius: '100px', letterSpacing: '.05em' }}>★ DESTACADO</span>}
                            {a.urgente && <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(230,51,41,.2)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '100px', letterSpacing: '.05em' }}>⚡ URGENTE</span>}
                            {a.fijado_home && <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(74,222,128,.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '100px', letterSpacing: '.05em' }}>📌 FIJADO HOME</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--gray4)', marginTop: '4px' }}>{a.anio} · {Number(a.kilometraje || 0).toLocaleString('es-AR')} km</div>
                          <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, marginTop: '4px' }}>${Number(a.precio_ars).toLocaleString('es-AR')}</div>
                          {a.destacado && a.destacado_expira_at && (
                            <div style={{ fontSize: '11px', color: '#c9a84c', marginTop: '4px' }}>Destacado hasta {new Date(a.destacado_expira_at).toLocaleDateString('es-AR')}</div>
                          )}
                          {a.urgente && a.urgente_expira_at && (
                            <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px' }}>Urgente hasta {new Date(a.urgente_expira_at).toLocaleDateString('es-AR')}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to={`/auto/${a.id}`} style={{ textDecoration: 'none' }}>
                          <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>Ver →</button>
                        </Link>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => setEditandoAuto(a)}>Editar</button>
                        <button onClick={() => despublicar(a.id)} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: 'var(--radius)', border: '1px solid rgba(230,51,41,.4)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {tab === 'planes' && (
        <div className="responsive-section" style={{ padding: '2rem 4rem' }}>
          <div className="mi-cuenta-planes-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '900px', marginBottom: '3rem' }}>
            <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1rem' }}>Base</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '56px', color: '#4ade80', lineHeight: 1, marginBottom: '2rem' }}>GRATIS</div>
              {['1 publicación activa por 30 días', 'Sin prioridad en resultados', 'Acceso al catálogo completo', 'Consultas directas a agencias', 'Guardado de favoritos'].map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: '14px', color: 'var(--gray4)' }}>{b}</span>
                </div>
              ))}
            </div>
            <ExtrasConMP user={user} autoId={misAutos[0]?.id || null} />
          </div>
          {pagos.length > 0 && (
            <div style={{ maxWidth: '900px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1rem' }}>Historial de pagos</div>
              <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {pagos.map((p, i) => {
                  const LABELS = { subir_tope: 'Subir al tope', destacado_individual: 'Destacado individual', urgente_individual: 'Urgente individual', renovar: 'Renovar 30 días', destacado: 'Destacado', urgente: 'Urgente', fijado_home: 'Fijado en Home', banner_home: 'Banner en Home', pack_destacados_10: 'Pack 10 destacados', publicidad_lateral: 'Publicidad lateral', plan_profesional_base: 'Plan Profesional Base', plan_profesional_destacado: 'Plan Profesional Destacado' }
                  return (
                    <div key={p.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < pagos.length - 1 ? '1px solid var(--gray2)' : 'none', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.estado === 'approved' ? '#4ade80' : 'var(--gray3)', flexShrink: 0, display: 'inline-block' }} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--white)' }}>{LABELS[p.tipo] || p.tipo}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gray4)', marginTop: '2px' }}>{new Date(p.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--accent)' }}>${Number(p.monto).toLocaleString('es-AR')}</div>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', background: p.estado === 'approved' ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.08)', color: p.estado === 'approved' ? '#4ade80' : 'var(--gray4)', letterSpacing: '.05em' }}>
                          {p.estado === 'approved' ? 'APROBADO' : p.estado?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PublicarForm({ user, onSuccess, onCancel }) {
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '', kilometraje: '', tipo: 'usado', categoria: '', combustible: 'Nafta', transmision: 'Manual', color: '', precio_ars: '', descripcion: '', whatsapp: '' })
  const [fotos, setFotos] = useState([])
  const [inputKey, setInputKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  function handleFotos(e) {
    const nuevas = Array.from(e.target.files)
    setFotos(prev => [...prev, ...nuevas])
    setInputKey(k => k + 1)
  }

  function eliminarFoto(idx) {
    setFotos(prev => prev.filter((_, i) => i !== idx))
    setInputKey(k => k + 1)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (fotos.length < 5) { setError('Debés subir mínimo 5 fotos.'); return }
    setLoading(true)
    setError('')
    let fotoUrls = []
    for (const file of fotos) {
      const ext = file.name.split('.').pop()
      const path = `particulares/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('fotos-autos').upload(path, file)
      if (!upErr) {
        const { data } = supabase.storage.from('fotos-autos').getPublicUrl(path)
        fotoUrls.push(data.publicUrl)
      }
    }
    const { error: insErr } = await supabase.from('autos').insert({
      user_id: user.id,
      concesionaria_id: null,
      marca: form.marca, modelo: form.modelo, anio: parseInt(form.anio),
      kilometraje: parseInt(form.kilometraje) || 0,
      tipo: form.tipo, categoria: form.categoria || null,
      combustible: form.combustible, transmision: form.transmision,
      color: form.color, precio_ars: form.precio_ars || null,
      descripcion: form.descripcion, fotos: fotoUrls, activo: true,
      whatsapp: form.whatsapp || null,
      nombre_vendedor: user.user_metadata?.nombre || null,
    })
    setLoading(false)
    if (insErr) setError(insErr.message)
    else onSuccess()
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px' }}>PUBLICAR VEHÍCULO</div>
        <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
      {error && <div style={{ background: 'rgba(230,51,41,.1)', border: '1px solid rgba(230,51,41,.3)', borderRadius: 'var(--radius)', padding: '12px 16px', color: 'var(--accent)', fontSize: '13px', marginBottom: '1.5rem' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--gray1)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--white)' }}>FOTOS</div>
            <div style={{ fontSize: '12px', color: fotos.length >= 5 ? '#4ade80' : 'var(--gray4)' }}>
              {fotos.length}/5 mínimo {fotos.length >= 5 ? '✓' : ''}
            </div>
          </div>
          {fotos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px', marginBottom: '1rem' }}>
              {fotos.map((f, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--gray2)' }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => eliminarFoto(i)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', borderRadius: '100px', width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ×
                  </button>
                  {i === 0 && (
                    <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'var(--accent)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>PORTADA</div>
                  )}
                </div>
              ))}
            </div>
          )}
          <label style={{ display: 'block', border: `2px dashed ${fotos.length >= 5 ? 'var(--gray2)' : 'var(--gray3)'}`, borderRadius: 'var(--radius)', padding: fotos.length > 0 ? '1rem' : '2rem', textAlign: 'center', cursor: 'pointer' }}>
            <input key={inputKey} type="file" accept="image/*" multiple onChange={handleFotos} style={{ display: 'none' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray4)' }}>
              {fotos.length === 0 ? 'Click para subir fotos' : '+ Agregar más fotos'}
            </div>
            {fotos.length === 0 && <div style={{ fontSize: '12px', color: 'var(--gray5)', marginTop: '4px' }}>Mínimo 5 fotos · JPG, PNG</div>}
            {fotos.length > 0 && fotos.length < 5 && (
              <div style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '4px' }}>Faltan {5 - fotos.length} foto{5 - fotos.length !== 1 ? 's' : ''} para el mínimo</div>
            )}
          </label>
        </div>

        <div style={{ background: 'var(--gray1)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '8px' }}>DATOS DEL VEHÍCULO</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px,100%), 1fr))', gap: '1rem' }}>
            <div className="form-field"><label>Marca *</label><input type="text" placeholder="Ej: Honda" value={form.marca} onChange={e => setF('marca', e.target.value)} required /></div>
            <div className="form-field"><label>Modelo *</label><input type="text" placeholder="Ej: Civic" value={form.modelo} onChange={e => setF('modelo', e.target.value)} required /></div>
            <div className="form-field"><label>Año *</label><input type="number" placeholder="2022" min="1900" max="2030" value={form.anio} onChange={e => setF('anio', e.target.value)} required /></div>
            <div className="form-field"><label>Kilometraje *</label><input type="number" placeholder="0" min="0" value={form.kilometraje} onChange={e => setF('kilometraje', e.target.value)} required /></div>
            <div className="form-field"><label>Condición *</label><select value={form.tipo} onChange={e => setF('tipo', e.target.value)} required><option value="usado">Usado</option><option value="nuevo">0KM / Nuevo</option></select></div>
            <div className="form-field"><label>Categoría</label><select value={form.categoria} onChange={e => setF('categoria', e.target.value)}><option value="">— Seleccionar —</option><optgroup label="Autos"><option value="SUV">SUV</option><option value="Hatchback">Hatchback</option><option value="Sedán">Sedán</option><option value="Pickup">Pickup</option><option value="Minivan">Minivan</option><option value="Coupé">Coupé</option></optgroup><optgroup label="Motos"><option value="Naked">Naked</option><option value="Deportiva">Deportiva</option><option value="Touring">Touring</option><option value="Scooter">Scooter</option><option value="Enduro">Enduro</option><option value="Custom">Custom</option></optgroup><optgroup label="Náutica"><option value="Lancha">Lancha</option><option value="Velero">Velero</option><option value="Yate">Yate</option><option value="Moto de Agua">Moto de Agua</option><option value="Semi-rígido">Semi-rígido</option></optgroup></select></div>
            <div className="form-field"><label>Combustible *</label><select value={form.combustible} onChange={e => setF('combustible', e.target.value)} required><option>Nafta</option><option>Diesel</option><option>Híbrido</option><option>Eléctrico</option></select></div>
            <div className="form-field"><label>Transmisión *</label><select value={form.transmision} onChange={e => setF('transmision', e.target.value)} required><option>Manual</option><option>Automática</option></select></div>
            <div className="form-field"><label>Color *</label><input type="text" placeholder="Ej: Blanco" value={form.color} onChange={e => setF('color', e.target.value)} required /></div>
            <div className="form-field"><label>Precio ARS *</label><input type="number" placeholder="Ej: 8000000" value={form.precio_ars} onChange={e => setF('precio_ars', e.target.value)} required /></div>
            <div className="form-field"><label>WhatsApp *</label><input type="tel" placeholder="Ej: 3874123456" value={form.whatsapp} onChange={e => setF('whatsapp', e.target.value)} required /></div>
          </div>
          <div className="form-field" style={{ marginTop: '1rem' }}><label>Descripción</label><textarea rows={3} placeholder="Describí el estado, equipamiento, historial..." value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} style={{ width: '100%', background: 'var(--gray2)', border: '1px solid var(--gray3)', borderRadius: 'var(--radius)', color: 'var(--white)', padding: '10px 12px', fontSize: '14px', resize: 'vertical' }} /></div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '14px' }}>
          {loading ? 'Publicando...' : 'Publicar vehículo →'}
        </button>
      </form>
    </div>
  )
}

function EditarAutoModal({ auto, onClose, onSave }) {
  const [form, setForm] = useState({
    marca: auto.marca || '', modelo: auto.modelo || '', anio: auto.anio || '', kilometraje: auto.kilometraje || '',
    tipo: auto.tipo || 'usado', categoria: auto.categoria || '', combustible: auto.combustible || 'Nafta',
    transmision: auto.transmision || 'Manual', color: auto.color || '', precio_ars: auto.precio_ars || '',
    descripcion: auto.descripcion || '', whatsapp: auto.whatsapp || '',
  })
  const [fotos, setFotos] = useState(auto.fotos || [])
  const [fotosNuevas, setFotosNuevas] = useState([])
  const [inputKey, setInputKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    let fotoUrls = [...fotos]
    for (const file of fotosNuevas) {
      const ext = file.name.split('.').pop()
      const path = `${auto.user_id || auto.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('fotos-autos').upload(path, file)
      if (!upErr) {
        const { data } = supabase.storage.from('fotos-autos').getPublicUrl(path)
        fotoUrls.push(data.publicUrl)
      }
    }
    const { error: err } = await supabase.from('autos').update({
      marca: form.marca, modelo: form.modelo, anio: parseInt(form.anio),
      kilometraje: parseInt(form.kilometraje) || 0, tipo: form.tipo,
      categoria: form.categoria || null, combustible: form.combustible,
      transmision: form.transmision, color: form.color,
      precio_ars: form.precio_ars || null, descripcion: form.descripcion,
      whatsapp: form.whatsapp || null, fotos: fotoUrls,
    }).eq('id', auto.id)
    setSaving(false)
    if (err) setError(err.message)
    else onSave()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
      <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--gray2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>EDITAR PUBLICACIÓN</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--gray4)', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>
        {error && <div style={{ background: 'rgba(230,51,41,.1)', border: '1px solid rgba(230,51,41,.3)', borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--accent)', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px,100%), 1fr))', gap: '1rem' }}>
            <div className="form-field"><label>Marca *</label><input type="text" required value={form.marca} onChange={e => setF('marca', e.target.value)} /></div>
            <div className="form-field"><label>Modelo *</label><input type="text" required value={form.modelo} onChange={e => setF('modelo', e.target.value)} /></div>
            <div className="form-field"><label>Año *</label><input type="number" required value={form.anio} onChange={e => setF('anio', e.target.value)} /></div>
            <div className="form-field"><label>Kilometraje *</label><input type="number" required min="0" value={form.kilometraje} onChange={e => setF('kilometraje', e.target.value)} /></div>
            <div className="form-field"><label>Condición *</label><select required value={form.tipo} onChange={e => setF('tipo', e.target.value)}><option value="usado">Usado</option><option value="nuevo">0KM / Nuevo</option></select></div>
            <div className="form-field"><label>Categoría</label><select value={form.categoria} onChange={e => setF('categoria', e.target.value)}><option value="">— Seleccionar —</option><optgroup label="Autos"><option value="SUV">SUV</option><option value="Hatchback">Hatchback</option><option value="Sedán">Sedán</option><option value="Pickup">Pickup</option><option value="Minivan">Minivan</option><option value="Coupé">Coupé</option></optgroup><optgroup label="Motos"><option value="Naked">Naked</option><option value="Deportiva">Deportiva</option><option value="Touring">Touring</option><option value="Scooter">Scooter</option><option value="Enduro">Enduro</option><option value="Custom">Custom</option></optgroup><optgroup label="Náutica"><option value="Lancha">Lancha</option><option value="Velero">Velero</option><option value="Yate">Yate</option><option value="Moto de Agua">Moto de Agua</option><option value="Semi-rígido">Semi-rígido</option></optgroup></select></div>
            <div className="form-field"><label>Combustible *</label><select required value={form.combustible} onChange={e => setF('combustible', e.target.value)}><option>Nafta</option><option>Diesel</option><option>Híbrido</option><option>Eléctrico</option></select></div>
            <div className="form-field"><label>Transmisión *</label><select required value={form.transmision} onChange={e => setF('transmision', e.target.value)}><option>Manual</option><option>Automática</option></select></div>
            <div className="form-field"><label>Color *</label><input type="text" required placeholder="Ej: Blanco" value={form.color} onChange={e => setF('color', e.target.value)} /></div>
            <div className="form-field"><label>Precio ARS *</label><input type="number" required value={form.precio_ars} onChange={e => setF('precio_ars', e.target.value)} /></div>
            <div className="form-field"><label>WhatsApp</label><input type="tel" placeholder="Ej: 3874123456" value={form.whatsapp} onChange={e => setF('whatsapp', e.target.value)} /></div>
          </div>
          <div className="form-field" style={{ marginTop: '1rem' }}><label>Descripción</label><textarea rows={3} value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} style={{ width: '100%', background: 'var(--gray2)', border: '1px solid var(--gray3)', borderRadius: 'var(--radius)', color: 'var(--white)', padding: '10px 12px', fontSize: '14px', resize: 'vertical' }} /></div>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--white)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>FOTOS</span>
              <span style={{ color: fotos.length + fotosNuevas.length >= 5 ? '#4ade80' : 'var(--gray4)', fontWeight: 400 }}>{fotos.length + fotosNuevas.length} foto{fotos.length + fotosNuevas.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '10px' }}>
              {fotos.map((url, i) => (
                <div key={url} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--gray2)' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => setFotos(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(0,0,0,.75)', border: 'none', color: '#fff', borderRadius: '100px', width: '20px', height: '20px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
              {fotosNuevas.map((f, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(74,222,128,.3)' }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => setFotosNuevas(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(0,0,0,.75)', border: 'none', color: '#fff', borderRadius: '100px', width: '20px', height: '20px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
            <label style={{ display: 'block', border: '2px dashed var(--gray3)', borderRadius: 'var(--radius)', padding: '10px', textAlign: 'center', cursor: 'pointer' }}>
              <input key={inputKey} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { const nuevas = Array.from(e.target.files); setFotosNuevas(p => [...p, ...nuevas]); setInputKey(k => k + 1) }} />
              <span style={{ fontSize: '13px', color: 'var(--gray4)' }}>+ Agregar fotos</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConsultasRecibidasList({ consultas, onRead }) {
  const [detalle, setDetalle] = useState(null)

  async function verDetalle(c) {
    setDetalle(c)
    if (!c.leido) {
      await supabase.from('consultas').update({ leido: true }).eq('id', c.id)
      onRead()
    }
  }

  return (
    <>
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
                <div style={{ fontSize: '14px', color: 'var(--accent)', wordBreak: 'break-all' }}>{detalle.email_comprador}</div>
              </div>
            </div>
            <div style={{ background: 'var(--gray2)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '8px' }}>Mensaje</div>
              <p style={{ fontSize: '14px', color: 'var(--white)', lineHeight: 1.7 }}>{detalle.mensaje}</p>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)' }}>
              {new Date(detalle.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            {detalle.email_comprador && (
              <button className="btn-primary" style={{ width: '100%' }}
                onClick={() => window.open(`mailto:${detalle.email_comprador}?subject=Re: ${detalle.autos?.marca} ${detalle.autos?.modelo}&body=Hola ${detalle.nombre_comprador},%0D%0A%0D%0A`)}>
                Responder por email
              </button>
            )}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--gray2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', maxWidth: '800px' }}>
        {consultas.map(c => (
          <div key={c.id} onClick={() => verDetalle(c)}
            style={{ background: c.leido ? 'var(--gray1)' : '#0d0d0d', padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', transition: 'background .2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.background = c.leido ? 'var(--gray1)' : '#0d0d0d'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              {!c.leido && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: c.leido ? 500 : 700, color: 'var(--white)', fontSize: '14px' }}>{c.autos?.marca} {c.autos?.modelo}</span>
                  <span style={{ fontSize: '12px', color: 'var(--gray4)' }}>— {c.nombre_comprador}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>{c.mensaje}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <span style={{ fontSize: '12px', color: 'var(--gray5)', fontFamily: 'var(--font-mono)' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</span>
              <span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Ver →</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function ExtrasConMP({ user, autoId }) {
  const [paying, setPaying] = useState(null)
  const { toast } = useToast()

  async function pagar(tipo) {
    if (!autoId) { toast('Necesitás tener una publicación activa para usar este boost.', 'warning'); return }
    setPaying(tipo)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/mp-create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ tipo, user_id: user.id, user_email: user.email, auto_id: autoId, origen: 'mi-cuenta' }),
      })
      const data = await res.json()
      if (data.init_point) window.location.assign(data.init_point)
      else toast('Error al iniciar el pago. Intentá nuevamente.', 'error')
    } catch { toast('Error de conexión.', 'error') }
    setPaying(null)
  }

  const extras = [
    { id: 'subir_tope', nombre: 'Subir al tope', precio: '$10.000', desc: 'Tu publicación vuelve al primer lugar.' },
    { id: 'destacado_individual', nombre: 'Destacado', precio: '$15.000', desc: 'Fondo diferenciado y badge en el catálogo.' },
    { id: 'urgente_individual', nombre: 'Urgente', precio: '$20.000', desc: 'Badge rojo "URGENTE", máxima visibilidad.' },
    { id: 'renovar', nombre: 'Renovar 30 días', precio: '$10.000', desc: 'Extendé tu publicación y volvé arriba.' },
  ]

  return (
    <div style={{ background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Extras pagos</div>
      {extras.map(e => (
        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--gray2)' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--white)', marginBottom: '2px' }}>{e.nombre}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray4)' }}>{e.desc}</div>
          </div>
          <button onClick={() => pagar(e.id)} disabled={!!paying}
            style={{ fontSize: '12px', padding: '6px 14px', marginLeft: '1rem', flexShrink: 0, borderRadius: 'var(--radius)', border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontWeight: 700, cursor: paying ? 'wait' : 'pointer', opacity: paying ? .7 : 1 }}>
            {paying === e.id ? '...' : e.precio}
          </button>
        </div>
      ))}
    </div>
  )
}
