import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AutoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, concesionaria, isAdmin } = useAuth()
  const [auto, setAuto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fotoIdx, setFotoIdx] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [consulta, setConsulta] = useState({ nombre: '', email: '', mensaje: '' })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [isFavorito, setIsFavorito] = useState(false)

  const esParticular = user && !concesionaria && !isAdmin

  useEffect(() => {
    supabase.from('autos').select('*, concesionarias(*)').eq('id', id).single().then(({ data }) => {
      setAuto(data)
      setLoading(false)
    })
    supabase.rpc('incrementar_vistas', { auto_id: id }).then()
  }, [id])

  useEffect(() => {
    if (!esParticular) return
    supabase.from('favoritos').select('id').eq('user_id', user.id).eq('auto_id', id).single()
      .then(({ data }) => setIsFavorito(!!data))
  }, [user, id])

  async function toggleFavorito() {
    if (!user) { navigate('/login'); return }
    if (isFavorito) {
      await supabase.from('favoritos').delete().eq('user_id', user.id).eq('auto_id', id)
      setIsFavorito(false)
    } else {
      await supabase.from('favoritos').insert({ user_id: user.id, auto_id: id })
      setIsFavorito(true)
    }
  }

  async function enviarConsulta() {
    if (!consulta.nombre || !consulta.email || !consulta.mensaje) return
    setEnviando(true)
    await supabase.from('consultas').insert({
      auto_id: auto.id,
      concesionaria_id: auto.concesionaria_id,
      nombre_comprador: consulta.nombre,
      email_comprador: consulta.email,
      mensaje: consulta.mensaje,
      canal: 'formulario'
    })
    setEnviando(false)
    setEnviado(true)
  }

  function formatPrice(n) {
    if (!n) return 'Consultar'
    return '$' + Number(n).toLocaleString('es-AR')
  }

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>
  if (!auto) return <div className="page-wrapper" style={{ padding: '4rem' }}><p style={{ color: 'var(--gray4)' }}>Vehículo no encontrado.</p></div>

  const fotos = auto.fotos || []
  const c = auto.concesionarias

  return (
    <div className="page-wrapper">
      {/* ZOOM MODAL */}
      {zoom && (
        <div onClick={() => setZoom(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={fotos[fotoIdx]} alt={auto.modelo} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }} />
          <div style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'var(--white)', fontSize: '28px', cursor: 'pointer', background: 'rgba(255,255,255,.1)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</div>
          {fotos.length > 1 && (
            <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', gap: '8px' }}>
              {fotos.map((_, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setFotoIdx(i) }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === fotoIdx ? 'var(--white)' : 'rgba(255,255,255,.3)', cursor: 'pointer', transition: 'background .2s' }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '1.5rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
        <button onClick={() => navigate('/catalogo')} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
          ← Volver al catálogo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px' }}>
        {/* COLUMNA IZQUIERDA */}
        <div style={{ padding: '3rem 4rem', borderRight: '1px solid var(--gray2)' }}>

          {/* FOTO PRINCIPAL */}
          <div onClick={() => fotos.length > 0 && setZoom(true)}
            style={{ width: '100%', height: '450px', background: 'linear-gradient(135deg, var(--gray2), var(--gray1))', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', marginBottom: '1rem', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', cursor: fotos.length > 0 ? 'zoom-in' : 'default', position: 'relative' }}>
            {fotos.length > 0
              ? <img src={fotos[fotoIdx]} alt={auto.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".2"><path d="M5 17H3a2 2 0 01-2-2v-4l2.5-6h13L19 11v4a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg></div>
            }
            {fotos.length > 0 && (
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,.6)', color: 'var(--white)', fontSize: '10px', padding: '4px 12px', borderRadius: '100px', fontFamily: 'var(--font-mono)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Ampliar
              </div>
            )}
          </div>

          {/* MINIATURAS */}
          {fotos.length > 1 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {fotos.map((f, i) => (
                <div key={i} onClick={() => setFotoIdx(i)}
                  style={{ width: '90px', height: '65px', borderRadius: 'var(--radius)', overflow: 'hidden', border: `2px solid ${i === fotoIdx ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', opacity: i === fotoIdx ? 1 : 0.6, transition: 'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = i === fotoIdx ? 1 : 0.6}>
                  <img src={f} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* ESPECIFICACIONES */}
          <div style={{ marginTop: '3rem' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Especificaciones</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              {[['Año', auto.anio],
                ['Kilometraje', auto.kilometraje === 0 ? '0 km' : `${Number(auto.kilometraje).toLocaleString('es-AR')} km`],
                ['Combustible', auto.combustible],
                ['Transmisión', auto.transmision],
                ['Color', auto.color],
                ['Estado', auto.tipo === 'nuevo' ? 'Nuevo' : 'Usado']]
                .filter(([, v]) => v).map(([label, val]) => (
                <div key={label} style={{ background: 'var(--gray1)', padding: '1.5rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray2)', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--white)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          {auto.descripcion && (
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1rem' }}>Descripción</h3>
              <p style={{ fontSize: '15px', color: 'var(--gray5)', lineHeight: 1.8, background: 'var(--gray1)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                {auto.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ padding: '3rem 2rem', position: 'sticky', top: '58px', height: 'calc(100vh - 58px)', overflowY: 'auto' }}>
          <span className={`car-badge ${auto.tipo === 'nuevo' ? 'badge-new' : 'badge-used'}`} style={{ position: 'static', display: 'inline-block', marginBottom: '1rem' }}>
            {auto.tipo === 'nuevo' ? 'Nuevo' : 'Usado'}
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px' }}>{auto.marca}</div>
            {esParticular && (
              <button onClick={toggleFavorito}
                style={{ background: isFavorito ? 'var(--accent)' : 'var(--gray2)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', transition: 'all .2s', flexShrink: 0 }}
                title={isFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
                {isFavorito ? '♥' : '♡'}
              </button>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', lineHeight: 1, marginBottom: '1rem' }}>{auto.modelo.toUpperCase()}</div>

          {(Number(auto.precio_ars) > 0 || Number(auto.precio_usd) > 0) && (
            <div style={{ padding: '1.25rem', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', marginTop: '2rem', marginBottom: '2rem', border: '1px solid var(--gray2)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gray4)', marginBottom: '8px', letterSpacing: '.1em', textTransform: 'uppercase' }}>PRECIO DE LISTA</div>
              {Number(auto.precio_ars) > 0 && (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: 'var(--white)', lineHeight: 1 }}>
                  {formatPrice(auto.precio_ars)}
                </div>
              )}
              {Number(auto.precio_usd) > 0 && (
                <div style={{ fontFamily: Number(auto.precio_ars) > 0 ? 'var(--font-body)' : 'var(--font-display)', fontSize: Number(auto.precio_ars) > 0 ? '16px' : '40px', color: Number(auto.precio_ars) > 0 ? 'var(--accent)' : 'var(--white)', fontWeight: '600', marginTop: Number(auto.precio_ars) > 0 ? '8px' : '0' }}>
                  USD {Number(auto.precio_usd).toLocaleString('es-AR')}
                </div>
              )}
            </div>
          )}

          {c && (
            <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--gray2)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '1rem', color: 'var(--white)' }}>Contactar concesionaria</div>
              {c.whatsapp && (
                <button onClick={() => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,'')}?text=Hola! Me interesa el ${auto.marca} ${auto.modelo}`, '_blank')}
                  className="btn-primary"
                  style={{ width: '100%', background: '#25D366', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,211,102,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.99 0C5.37 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.83L.057 23.998l6.306-1.654A11.954 11.954 0 0011.99 24C18.627 24 24 18.627 24 12S18.627 0 11.99 0zm.01 21.818a9.818 9.818 0 01-5.002-1.368l-.36-.214-3.733.979 1-3.64-.234-.374a9.818 9.818 0 119.33 4.617z"/></svg>
                  WhatsApp
                </button>
              )}
              {c.telefono && (
                <button onClick={() => window.open(`tel:${c.telefono}`)}
                  className="btn-secondary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--gray2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .15h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  {c.telefono}
                </button>
              )}
            </div>
          )}

          <div className="form-field">
            <div style={{ fontSize: '13px', color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '1rem' }}>Enviar Mensaje</div>
            {enviado
              ? <div style={{ padding: '1rem', background: 'rgba(74,222,128,0.1)', color: '#4ade80', borderRadius: 'var(--radius)', border: '1px solid rgba(74,222,128,0.2)', textAlign: 'center' }}>✓ Mensaje enviado con éxito.</div>
              : <>
                  <input type="text" placeholder="Tu nombre" value={consulta.nombre} onChange={e => setConsulta(p => ({ ...p, nombre: e.target.value }))} />
                  <input type="email" placeholder="Tu email" value={consulta.email} onChange={e => setConsulta(p => ({ ...p, email: e.target.value }))} />
                  <textarea placeholder="Hola, me interesa este vehículo..." value={consulta.mensaje} onChange={e => setConsulta(p => ({ ...p, mensaje: e.target.value }))} style={{ minHeight: '100px' }} />
                  <button className="btn-primary" onClick={enviarConsulta} disabled={enviando} style={{ marginTop: '0.5rem', width: '100%' }}>
                    {enviando ? 'Enviando...' : 'Enviar consulta'}
                  </button>
                </>
            }
          </div>
        </div>
      </div>
    </div>
  )
}