import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MARCAS = ['Toyota','Ford','Volkswagen','Chevrolet','Renault','Peugeot','Fiat','Honda','Nissan','Jeep','Citroën','Otro']

export default function Panel() {
  const { user, concesionaria, fetchConcesionaria, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [autos, setAutos] = useState([])
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (isAdmin) { navigate('/admin'); return }
    if (concesionaria) loadData()
  }, [user, concesionaria])

  async function loadData() {
    const [autosRes, consultasRes] = await Promise.all([
      supabase.from('autos').select('*').eq('concesionaria_id', concesionaria.id).order('created_at', { ascending: false }),
      supabase.from('consultas').select('*, autos(marca, modelo)').eq('concesionaria_id', concesionaria.id).order('created_at', { ascending: false }).limit(20)
    ])
    setAutos(autosRes.data || [])
    setConsultas(consultasRes.data || [])
    setLoading(false)
  }

  if (!concesionaria && !loading) return (
    <div className="page-wrapper" style={{ padding: '4rem', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', marginBottom: '1rem', color: 'var(--gold)' }}>CUENTA PENDIENTE</div>
      <p style={{ color: 'var(--gray4)', fontSize: '15px', lineHeight: 1.7 }}>Tu solicitud está siendo revisada. Te avisamos por email cuando esté aprobada.</p>
    </div>
  )

  /* --- MENÚ LATERAL SIN EMOJIS, SUPER PROFESIONAL --- */
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'mis-autos', label: 'Inventario de Autos' },
    { id: 'nuevo-auto', label: 'Nueva Publicación' },
    { id: 'perfil', label: 'Perfil de Agencia' },
  ]

  return (
    <div className="page-wrapper" style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>
      {/* SIDEBAR */}
      <div style={{ width: '250px', flexShrink: 0, borderRight: '1px solid var(--gray2)', padding: '2rem 0', background: '#080808' }}>
        
        {/* LOGO O INICIAL EN EL MENÚ */}
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
            <div style={{ fontSize: '11px', color: 'var(--gray5)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>ID: {concesionaria?.id?.substring(0,6)}</div>
          </div>
        </div>

        {navItems.map(item => (
          <div key={item.id} onClick={() => setTab(item.id)}
            style={{ 
              padding: '14px 1.5rem', 
              fontSize: '13px', 
              fontWeight: tab === item.id ? '600' : '400',
              color: tab === item.id ? 'var(--white)' : 'var(--gray4)', 
              cursor: 'pointer', 
              transition: 'all .2s', 
              borderLeft: `3px solid ${tab === item.id ? 'var(--accent)' : 'transparent'}`, 
              background: tab === item.id ? 'var(--gray1)' : 'transparent',
              textTransform: 'uppercase',
              letterSpacing: '.05em'
            }}>
            {item.label}
          </div>
        ))}
      </div>
      
      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto' }}>
        {loading ? <div className="spinner" /> : (
          <>
            {tab === 'dashboard' && <Dashboard autos={autos} consultas={consultas} concesionaria={concesionaria} />}
            {tab === 'mis-autos' && <MisAutos autos={autos} reload={loadData} setTab={setTab} />}
            {tab === 'nuevo-auto' && <NuevoAuto concesionaria={concesionaria} onSuccess={() => { loadData(); setTab('mis-autos') }} />}
            {tab === 'perfil' && <Perfil concesionaria={concesionaria} onSave={() => fetchConcesionaria(user.id)} />}
          </>
        )}
      </div>
    </div>
  )
}

function Dashboard({ autos, consultas, concesionaria }) {
  if (!concesionaria?.aprobada) return (
    <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', border: '1px solid rgba(201,168,76,.3)', maxWidth: '600px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', color: 'var(--gold)', marginBottom: '1rem' }}>CUENTA EN REVISIÓN</div>
      <p style={{ color: 'var(--gray4)', fontSize: '15px', lineHeight: 1.7 }}>Tu perfil comercial está siendo validado por el equipo de AutoMarket AR. Esto garantiza la seguridad de la plataforma. Recibirás un correo cuando puedas comenzar a publicar stock.</p>
    </div>
  )

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>RESUMEN DE ACTIVIDAD</div>
      <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Métricas en tiempo real de tu concesionaria.</div>
      
      {/* TARJETAS PREMIUM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        {[['Stock Activo', autos.filter(a => a.activo).length], ['Stock Pausado', autos.filter(a => !a.activo).length], ['Total Consultas', consultas.length], ['Consultas (7 días)', consultas.filter(c => new Date(c.created_at) > new Date(Date.now()-7*86400000)).length]].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--gray1)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', color: 'var(--white)', lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* TABLA DE CONSULTAS LIMPIA */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.1em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>Bandeja de Entrada</div>
      {consultas.length === 0
        ? <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', color: 'var(--gray4)' }}>No hay consultas pendientes.</div>
        : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Vehículo','Interesado','Mensaje','Fecha'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '12px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {consultas.map(c => (
                <tr key={c.id} style={{ transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gray1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--gray2)', color: 'var(--white)', fontSize: '14px', fontWeight: '500' }}>{c.autos?.marca} {c.autos?.modelo}</td>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--gray2)', color: 'var(--gray4)', fontSize: '14px' }}>{c.nombre_comprador}</td>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--gray2)', color: 'var(--gray4)', fontSize: '13px' }}>{c.mensaje}</td>
                  <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--gray2)', color: 'var(--gray5)', fontSize: '12px' }}>{new Date(c.created_at).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  )
}

function MisAutos({ autos, reload, setTab }) {
  async function toggleActivo(auto) {
    await supabase.from('autos').update({ activo: !auto.activo }).eq('id', auto.id)
    reload()
  }
  async function eliminar(id) {
    if (!confirm('¿Seguro que querés eliminar permanentemente este vehículo?')) return
    await supabase.from('autos').delete().eq('id', id)
    reload()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>INVENTARIO</div>
          <div style={{ fontSize: '14px', color: 'var(--gray5)' }}>Administrá los vehículos de tu catálogo.</div>
        </div>
        <button className="btn-primary" onClick={() => setTab('nuevo-auto')}>NUEVA PUBLICACIÓN</button>
      </div>

      {autos.length === 0
        ? <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)' }}><p style={{ color: 'var(--gray4)', fontSize: '15px' }}>Inventario vacío.</p></div>
        : <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <thead><tr>{['Vehículo','Precio (ARS)','Estado','Administrar'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: '11px', color: 'var(--gray5)', padding: '16px 20px', borderBottom: '1px solid var(--gray2)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {autos.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--gray2)' }}>
                  <td style={{ padding: '16px 20px', color: 'var(--white)', fontSize: '14px', fontWeight: 600 }}>{a.marca} {a.modelo} <span style={{ color: 'var(--gray5)', fontWeight: 'normal', marginLeft: '6px' }}>{a.anio}</span></td>
                  <td style={{ padding: '16px 20px', color: 'var(--white)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>${Number(a.precio_ars || 0).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: a.activo ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.1)', color: a.activo ? '#4ade80' : 'var(--gray4)' }}>
                      {a.activo ? 'ACTIVO' : 'PAUSADO'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={() => toggleActivo(a)} style={{ padding: '6px 14px', fontSize: '11px' }}>{a.activo ? 'Pausar' : 'Reactivar'}</button>
                    <button onClick={() => eliminar(a.id)} style={{ padding: '6px 14px', borderRadius: 'var(--radius)', border: '1px solid rgba(230, 51, 41, 0.3)', background: 'transparent', color: 'var(--accent)', fontSize: '11px', cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(230, 51, 41, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  )
}

function NuevoAuto({ concesionaria, onSuccess }) {
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '', kilometraje: '0', tipo: 'nuevo', combustible: 'Nafta', transmision: 'Manual', color: '', precio_ars: '', precio_usd: '', descripcion: '' })
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleFotos(e) {
    const files = Array.from(e.target.files).slice(0, 6)
    setFotos(files)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!concesionaria?.aprobada) { setError('Tu cuenta debe estar aprobada para publicar.'); return }
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

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>ALTA DE STOCK</div>
      <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Ingresá las especificaciones del nuevo vehículo.</div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--gray1)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>GALERÍA DE IMÁGENES</div>
          <label style={{ display: 'block', border: '2px dashed var(--gray3)', borderRadius: 'var(--radius)', padding: '3rem', textAlign: 'center', cursor: 'pointer', marginBottom: '2rem', transition: 'border .2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--white)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray3)'}>
            <input type="file" accept="image/*" multiple onChange={handleFotos} style={{ display: 'none' }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>{fotos.length > 0 ? `${fotos.length} archivos adjuntos` : 'Click para subir fotografías'}</div>
            <div style={{ fontSize: '13px', color: 'var(--gray5)' }}>Máximo 6 fotos · JPG, PNG · Alta resolución sugerida</div>
          </label>

          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>ESPECIFICACIONES TÉCNICAS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-field"><label>Marca *</label><select value={form.marca} onChange={e => setF('marca', e.target.value)} required><option value="">Seleccioná</option>{MARCAS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div className="form-field"><label>Modelo Exacto *</label><input type="text" placeholder="Ej: Amarok 2.0 TDI" value={form.modelo} onChange={e => setF('modelo', e.target.value)} required /></div>
            <div className="form-field"><label>Año *</label><input type="number" placeholder="2024" min="1900" max="2030" value={form.anio} onChange={e => setF('anio', e.target.value)} required /></div>
            <div className="form-field"><label>Kilometraje</label><input type="number" placeholder="0" min="0" value={form.kilometraje} onChange={e => setF('kilometraje', e.target.value)} /></div>
            <div className="form-field"><label>Condición</label><select value={form.tipo} onChange={e => setF('tipo', e.target.value)}><option value="nuevo">0KM / Nuevo</option><option value="usado">Usado</option></select></div>
            <div className="form-field"><label>Combustible</label><select value={form.combustible} onChange={e => setF('combustible', e.target.value)}><option>Nafta</option><option>Diesel</option><option>Híbrido</option><option>Eléctrico</option></select></div>
            <div className="form-field"><label>Transmisión</label><select value={form.transmision} onChange={e => setF('transmision', e.target.value)}><option>Manual</option><option>Automática</option><option>CVT</option></select></div>
            <div className="form-field"><label>Color Exterior</label><input type="text" placeholder="Ej: Plata Metalizado" value={form.color} onChange={e => setF('color', e.target.value)} /></div>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>VALOR COMERCIAL</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-field"><label>Precio de Lista (ARS)</label><input type="number" placeholder="Dejar vacío para consultar" value={form.precio_ars} onChange={e => setF('precio_ars', e.target.value)} /></div>
            <div className="form-field"><label>Referencia USD (Opcional)</label><input type="number" placeholder="Ej: 15000" value={form.precio_usd} onChange={e => setF('precio_usd', e.target.value)} /></div>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--white)', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray2)', paddingBottom: '10px' }}>INFORMACIÓN ADICIONAL</div>
          <div className="form-field">
            <label>Descripción detallada</label>
            <textarea style={{ height: '140px', resize: 'vertical' }} placeholder="Detallar estado general, mantenimientos realizados, accesorios extra, etc." value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} />
          </div>

          {error && <div style={{ padding: '1rem', background: 'rgba(230, 51, 41, 0.1)', color: 'var(--accent)', border: '1px solid rgba(230, 51, 41, 0.3)', borderRadius: 'var(--radius)', marginTop: '1rem' }}>{error}</div>}
          
          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'PROCESANDO...' : 'PUBLICAR EN CATÁLOGO'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Perfil({ concesionaria, onSave }) {
  // ACA SUMAMOS EL LOGO_URL
  const [form, setForm] = useState({ 
    nombre: concesionaria?.nombre || '', 
    responsable: concesionaria?.responsable || '', 
    telefono: concesionaria?.telefono || '', 
    whatsapp: concesionaria?.whatsapp || '', 
    email: concesionaria?.email || '', 
    ciudad: concesionaria?.ciudad || '', 
    direccion: concesionaria?.direccion || '', 
    descripcion: concesionaria?.descripcion || '',
    logo_url: concesionaria?.logo_url || '' 
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
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', marginBottom: '.5rem' }}>PERFIL COMERCIAL</div>
      <div style={{ fontSize: '14px', color: 'var(--gray5)', marginBottom: '3rem' }}>Configuración pública de la identidad de la concesionaria.</div>
      
      <form onSubmit={handleSave} style={{ background: 'var(--gray1)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)' }}>
        
        {/* SECCION LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--gray2)', marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gray2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--gray3)' }}>
             {form.logo_url ? <img src={form.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '32px', color: 'var(--gray5)' }}>🏢</span>}
          </div>
          <div style={{ flex: 1 }} className="form-field">
            <label style={{ color: 'var(--white)', fontWeight: 'bold' }}>Logo de la Empresa (URL)</label>
            <input type="text" placeholder="Pegar enlace de la imagen (ej: https://imgur.com/logo.png)" value={form.logo_url} onChange={e => setF('logo_url', e.target.value)} style={{ marginTop: '8px' }} />
            <span style={{ fontSize: '12px', color: 'var(--gray5)', marginTop: '4px' }}>Esta imagen aparecerá en tus publicaciones y perfil.</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-field"><label>Razón Social / Nombre Comercial</label><input type="text" value={form.nombre} onChange={e => setF('nombre', e.target.value)} /></div>
          <div className="form-field"><label>Responsable de Ventas</label><input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)} /></div>
          <div className="form-field"><label>Teléfono Fijo (con código de área)</label><input type="text" value={form.telefono} onChange={e => setF('telefono', e.target.value)} /></div>
          <div className="form-field"><label>Línea WhatsApp Comercial</label><input type="text" placeholder="+54 9 387 421-0000" value={form.whatsapp} onChange={e => setF('whatsapp', e.target.value)} /></div>
          <div className="form-field"><label>Correo Electrónico Oficial</label><input type="email" value={form.email} onChange={e => setF('email', e.target.value)} /></div>
          <div className="form-field"><label>Provincia y Localidad</label><input type="text" value={form.ciudad} onChange={e => setF('ciudad', e.target.value)} /></div>
        </div>
        <div className="form-field" style={{ marginTop: '1.5rem' }}><label>Dirección del Local</label><input type="text" placeholder="Calle, Número, Barrio" value={form.direccion} onChange={e => setF('direccion', e.target.value)} /></div>
        <div className="form-field" style={{ marginTop: '1.5rem' }}><label>Breve Reseña de la Empresa</label><textarea style={{ height: '100px', resize: 'vertical' }} placeholder="Trayectoria, servicios que ofrecen, métodos de pago..." value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} /></div>
        
        <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--gray2)', paddingTop: '2rem' }}>
          <div>{ok && <span style={{ color: '#4ade80', fontSize: '14px', fontWeight: 500 }}>✓ Configuración guardada exitosamente</span>}</div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'ACTUALIZANDO...' : 'GUARDAR CONFIGURACIÓN'}</button>
        </div>
      </form>
    </div>
  )
}