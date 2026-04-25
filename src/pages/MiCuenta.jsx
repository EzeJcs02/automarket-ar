import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'

async function pagarConMP(tipo, user_id, user_email) {
  try {
    const res = await fetch('/api/mp-create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, user_id, user_email, origen: 'mi-cuenta' }),
    })
    const data = await res.json()
    if (data.init_point) window.location.href = data.init_point
    else alert('Error al iniciar el pago. Intente nuevamente.')
  } catch {
    alert('Error de conexión. Intente nuevamente.')
  }
}

export default function MiCuenta() {
  const { user, concesionaria, isAdmin, loading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const [favoritos, setFavoritos] = useState([])
  const [favoritoIds, setFavoritoIds] = useState(new Set())
  const [consultas, setConsultas] = useState([])
  const [misAutos, setMisAutos] = useState([])
  const [pagos, setPagos] = useState([])
  const [tab, setTab] = useState('publicaciones')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

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
    if (!user || concesionaria || isAdmin) { navigate('/'); return }
    fetchData()
  }, [user, concesionaria, isAdmin, authLoading])

  async function fetchData() {
    setLoading(true)
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

  const tabStyle = active => ({
    padding: '10px 20px', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, letterSpacing: '.05em', transition: 'all .2s',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--white)' : 'var(--gray4)',
  })

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>

  return (
    <div className="page-wrapper">
      <div style={{ padding: '3rem 4rem', borderBottom: '1px solid var(--gray2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '.5rem' }}>Mi cuenta</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', lineHeight: 1 }}>{nombre.toUpperCase()}</div>
          <div style={{ fontSize: '13px', color: 'var(--gray4)', marginTop: '6px' }}>{user?.email}</div>
        </div>
        <button className="btn-secondary" onClick={handleSignOut}>Cerrar sesión</button>
      </div>

      <div style={{ padding: '1.5rem 4rem', borderBottom: '1px solid var(--gray2)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button style={tabStyle(tab === 'publicaciones')} onClick={() => { setTab('publicaciones'); setShowForm(false) }}>Mis publicaciones ({misAutos.length})</button>
        <button style={tabStyle(tab === 'consultas')} onClick={() => setTab('consultas')}>Consultas enviadas ({consultas.length})</button>
        <button style={tabStyle(tab === 'favoritos')} onClick={() => setTab('favoritos')}>Favoritos ({favoritos.length})</button>
        <button
          style={{ ...tabStyle(tab === 'planes'), ...(tab !== 'planes' ? { color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '3px' } : {}) }}
          onClick={() => setTab('planes')}>
          Mi Plan
        </button>
      </div>

      {tab === 'favoritos' && (
        <div style={{ padding: '2rem 4rem' }}>
          {favoritos.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '1rem' }}>NINGÚN FAVORITO AÚN</div>
              <p style={{ color: 'var(--gray4)', fontSize: '15px', marginBottom: '2rem' }}>Explorá el catálogo y guardá los vehículos que te interesen.</p>
              <button className="btn-primary" onClick={() => navigate('/catalogo')}>Ver catálogo →</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
              {favoritos.map(a => (
                <CarCard key={a.id} auto={a} isFavorito={favoritoIds.has(a.id)} onToggleFavorito={toggleFavorito} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'consultas' && (
        <div style={{ padding: '2rem 4rem' }}>
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
        <div style={{ padding: '2rem 4rem' }}>
          {showForm ? (
            <PublicarForm user={user} onSuccess={() => { setShowForm(false); fetchData() }} onCancel={() => setShowForm(false)} />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '4px' }}>MIS PUBLICACIONES</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray4)' }}>Plan gratuito: 1 publicación activa por 30 días.</div>
                </div>
                {misAutos.length === 0 && (
                  <button className="btn-primary" onClick={() => setShowForm(true)}>+ Publicar vehículo</button>
                )}
                {misAutos.length > 0 && (
                  <button className="btn-secondary" onClick={() => setShowForm(true)} style={{ opacity: .5, cursor: 'not-allowed' }} title="Ya tenés una publicación activa">+ Publicar vehículo</button>
                )}
              </div>
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
                        <button onClick={() => despublicar(a.id)} style={{ fontSize: '12px', padding: '6px 14px', borderRadius: 'var(--radius)', border: '1px solid rgba(230,51,41,.4)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'planes' && (
        <div style={{ padding: '2rem 4rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '900px', marginBottom: '3rem' }}>
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
                  const LABELS = { subir_tope: 'Subir al tope', destacado_individual: 'Destacado', urgente_individual: 'Urgente', renovar: 'Renovar 30 días', destacado: 'Destacado', urgente: 'Urgente', fijado_home: 'Fijado en Home' }
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
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '', kilometraje: '', tipo: 'usado', categoria: '', combustible: 'Nafta', transmision: 'Manual', color: '', precio_ars: '', descripcion: '' })
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  function handleFotos(e) {
    setFotos(Array.from(e.target.files))
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
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '8px' }}>FOTOS</div>
          <label style={{ display: 'block', border: `2px dashed ${fotos.length >= 3 ? 'var(--green)' : 'var(--gray3)'}`, borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" accept="image/*" multiple onChange={handleFotos} style={{ display: 'none' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: fotos.length >= 3 ? '#4ade80' : 'var(--white)', marginBottom: '4px' }}>
              {fotos.length > 0 ? `${fotos.length} fotos seleccionadas ${fotos.length >= 5 ? '✓' : `(faltan ${5 - fotos.length})`}` : 'Click para subir fotos'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray5)' }}>Mínimo 5 fotos · JPG, PNG</div>
          </label>
        </div>

        <div style={{ background: 'var(--gray1)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '8px' }}>DATOS DEL VEHÍCULO</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-field"><label>Marca *</label><input type="text" placeholder="Ej: Honda" value={form.marca} onChange={e => setF('marca', e.target.value)} required /></div>
            <div className="form-field"><label>Modelo *</label><input type="text" placeholder="Ej: Civic" value={form.modelo} onChange={e => setF('modelo', e.target.value)} required /></div>
            <div className="form-field"><label>Año *</label><input type="number" placeholder="2022" min="1900" max="2030" value={form.anio} onChange={e => setF('anio', e.target.value)} required /></div>
            <div className="form-field"><label>Kilometraje *</label><input type="number" placeholder="0" min="0" value={form.kilometraje} onChange={e => setF('kilometraje', e.target.value)} required /></div>
            <div className="form-field"><label>Condición *</label><select value={form.tipo} onChange={e => setF('tipo', e.target.value)} required><option value="usado">Usado</option><option value="nuevo">0KM / Nuevo</option></select></div>
            <div className="form-field"><label>Categoría</label><select value={form.categoria} onChange={e => setF('categoria', e.target.value)}><option value="">— Seleccionar —</option><optgroup label="Autos"><option value="Sedan">Sedán</option><option value="SUV">SUV</option><option value="Pickup">Pickup</option><option value="Hatchback">Hatchback</option><option value="Camioneta">Camioneta</option><option value="Deportivo">Deportivo</option></optgroup><optgroup label="Motos"><option value="Naked">Naked</option><option value="Cruiser">Cruiser</option><option value="Enduro">Enduro</option><option value="Scooter">Scooter</option></optgroup><optgroup label="Náutica"><option value="Lancha">Lancha</option><option value="Yate">Yate</option><option value="Jet Ski">Jet Ski</option></optgroup></select></div>
            <div className="form-field"><label>Combustible *</label><select value={form.combustible} onChange={e => setF('combustible', e.target.value)} required><option>Nafta</option><option>Diesel</option><option>Híbrido</option><option>Eléctrico</option></select></div>
            <div className="form-field"><label>Transmisión *</label><select value={form.transmision} onChange={e => setF('transmision', e.target.value)} required><option>Manual</option><option>Automática</option></select></div>
            <div className="form-field"><label>Color *</label><input type="text" placeholder="Ej: Blanco" value={form.color} onChange={e => setF('color', e.target.value)} required /></div>
            <div className="form-field"><label>Precio ARS *</label><input type="number" placeholder="Ej: 8000000" value={form.precio_ars} onChange={e => setF('precio_ars', e.target.value)} required /></div>
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

function ExtrasConMP({ user, autoId }) {
  const [paying, setPaying] = useState(null)

  async function pagar(tipo) {
    if (!autoId) { alert('Necesitás tener una publicación activa para usar este boost.'); return }
    setPaying(tipo)
    try {
      const res = await fetch('/api/mp-create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, user_id: user.id, user_email: user.email, auto_id: autoId, origen: 'mi-cuenta' }),
      })
      const data = await res.json()
      if (data.init_point) window.location.href = data.init_point
      else alert('Error al iniciar el pago. Intente nuevamente.')
    } catch { alert('Error de conexión.') }
    setPaying(null)
  }

  const extras = [
    { id: 'publicacion_adicional', nombre: 'Publicación adicional', precio: '$15.000', desc: 'A partir de la 1ra (gratis). Por 30 días.' },
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
