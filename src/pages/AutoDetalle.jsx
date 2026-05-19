import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useComparador } from '../context/ComparadorContext'
import CarCard from '../components/CarCard'
import { setMeta, setCanonical, resetMeta } from '../lib/seo'
import { getDolarBlue } from '../lib/dolarBlue'

export default function AutoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, concesionaria, isAdmin } = useAuth()
  const [auto, setAuto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fotoIdx, setFotoIdx] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [consulta, setConsulta] = useState({ nombre: '', email: '', telefono: '', mensaje: '' })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [isFavorito, setIsFavorito] = useState(false)
  const [dolarBlue, setDolarBlue] = useState(null)
  const [autosSimilares, setAutosSimilares] = useState([])
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [erroresConsulta, setErroresConsulta] = useState({})
  const [telCopiado, setTelCopiado] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [errorConsulta, setErrorConsulta] = useState(null)

  const esParticular = user && !concesionaria && !isAdmin
  const { agregar, quitar, estaEnLista, lista } = useComparador()
  const [cuotasMeses, setCuotasMeses] = useState(24)
  const [cuotasTNA, setCuotasTNA] = useState(80)

  useEffect(() => {
    getDolarBlue().then(v => { if (v) setDolarBlue(v) })
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadAuto() {
      const { data, error } = await supabase
        .from('autos').select('*, concesionarias(*)').eq('id', id).single()
      if (!mounted) return
      if (error) {
        if (error.code === 'PGRST116') {
          setAuto(null)
        } else {
          setFetchError('No pudimos cargar este vehículo. Revisá tu conexión e intentá de nuevo.')
        }
        setLoading(false)
        return
      }
      setAuto(data)
      setLoading(false)
      if (data) {
        const title = `${data.marca} ${data.modelo} ${data.anio} — FIORA MARKET`
        const desc = `${data.tipo === 'nuevo' ? 'Nuevo' : 'Usado'} · ${Number(data.kilometraje).toLocaleString('es-AR')} km · ${data.combustible}. ${data.descripcion?.slice(0, 120) || 'Consultá precio y condiciones.'}`
        const img = data.fotos?.[0] || 'https://fioramarket.store/og-image.jpg'
        const url = `https://fioramarket.store/auto/${data.id}`
        document.title = title
        setMeta('og:type', 'product')
        setMeta('og:title', title)
        setMeta('og:description', desc)
        setMeta('og:image', img)
        setMeta('og:url', url)
        setMeta('twitter:title', title)
        setMeta('twitter:description', desc)
        setMeta('twitter:image', img)
        setCanonical(url)

        // JSON-LD Schema.org
        const jsonld = {
          '@context': 'https://schema.org',
          '@type': 'Car',
          name: `${data.marca} ${data.modelo} ${data.anio}`,
          brand: { '@type': 'Brand', name: data.marca },
          model: data.modelo,
          modelDate: String(data.anio),
          mileageFromOdometer: { '@type': 'QuantitativeValue', value: data.kilometraje, unitCode: 'KMT' },
          fuelType: data.combustible,
          color: data.color,
          vehicleTransmission: data.transmision,
          description: data.descripcion || '',
          image: data.fotos?.[0] || '',
          url,
          offers: Number(data.precio_ars) > 0 ? {
            '@type': 'Offer',
            price: data.precio_ars,
            priceCurrency: 'ARS',
            availability: 'https://schema.org/InStock',
            seller: data.concesionarias ? { '@type': 'AutoDealer', name: data.concesionarias.nombre, address: data.concesionarias.ciudad } : undefined,
          } : undefined,
        }
        let ldEl = document.getElementById('jsonld-auto')
        if (!ldEl) { ldEl = document.createElement('script'); ldEl.id = 'jsonld-auto'; ldEl.type = 'application/ld+json'; document.head.appendChild(ldEl) }
        ldEl.textContent = JSON.stringify(jsonld)

        // Autos similares (misma marca, excluir el actual)
        if (data.marca) {
          const { data: sim } = await supabase.from('autos').select('*, concesionarias(nombre, ciudad, plan)')
            .eq('activo', true).eq('marca', data.marca).neq('id', id).limit(4)
          if (mounted) setAutosSimilares(sim || [])
        }
      }
    }

    loadAuto()
    supabase.rpc('incrementar_vistas', { auto_id: id })
    return () => {
      mounted = false
      resetMeta()
    }
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
    const errs = {}
    if (!consulta.nombre.trim()) errs.nombre = 'El nombre es requerido'
    if (!consulta.email.trim()) errs.email = 'El email es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(consulta.email)) errs.email = 'Ingresá un email válido'
    if (!consulta.mensaje.trim()) errs.mensaje = 'El mensaje es requerido'
    setErroresConsulta(errs)
    if (Object.keys(errs).length > 0) return
    setEnviando(true)
    setErrorConsulta(null)
    const { error: insertError } = await supabase.from('consultas').insert({
      auto_id: auto.id,
      concesionaria_id: auto.concesionaria_id,
      nombre_comprador: consulta.nombre,
      email_comprador: consulta.email,
      telefono_comprador: consulta.telefono || null,
      mensaje: consulta.mensaje,
      canal: 'formulario'
    })
    if (insertError) {
      setEnviando(false)
      setErrorConsulta('No pudimos enviar tu consulta. Intentá de nuevo en unos minutos.')
      return
    }
    // Notificar al vendedor por email
    fetch('/api/send-consulta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_id: auto.id, nombre: consulta.nombre, email: consulta.email, mensaje: consulta.mensaje, telefono: consulta.telefono || null }),
    }).catch(() => {})
    // Confirmación al comprador
    fetch('/api/send-confirma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: consulta.email,
        nombre: consulta.nombre,
        auto: `${auto.marca} ${auto.modelo} ${auto.anio}`,
        concesionaria: auto.concesionarias?.nombre || 'el vendedor',
        auto_id: auto.id,
      }),
    }).catch(() => {})
    setEnviando(false)
    setEnviado(true)
  }

  function formatPrice(n) {
    if (!n) return 'Consultar'
    return '$' + Number(n).toLocaleString('es-AR')
  }

  if (loading) return <div className="page-wrapper"><div className="spinner" /></div>
  if (fetchError) return (
    <div className="page-wrapper" style={{ padding: '4rem', textAlign: 'center' }}>
      <p style={{ color: '#f87171', marginBottom: '1rem' }}>⚠ {fetchError}</p>
      <button className="btn-secondary" onClick={() => window.location.reload()}>Reintentar</button>
    </div>
  )
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

      <div className="responsive-section" style={{ padding: '1.5rem 4rem', borderBottom: '1px solid var(--gray2)' }}>
        <button onClick={() => navigate('/catalogo')} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
          ← Volver al catálogo
        </button>
      </div>

      <div className="autodetalle-layout">
        {/* COLUMNA IZQUIERDA */}
        <div className="autodetalle-photos" style={{ padding: '3rem 4rem', borderRight: '1px solid var(--gray2)' }}>

          {/* FOTO PRINCIPAL */}
          <div onClick={() => fotos.length > 0 && setZoom(true)}
            style={{ width: '100%', height: 'clamp(200px, 45vw, 450px)', background: 'linear-gradient(135deg, var(--gray2), var(--gray1))', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', cursor: fotos.length > 0 ? 'zoom-in' : 'default', position: 'relative' }}>
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
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
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
              <p style={{ fontSize: '15px', color: 'var(--gray5)', lineHeight: 1.8, background: 'var(--gray1)', padding: '2rem', borderRadius: 'var(--radius-lg)', whiteSpace: 'pre-wrap' }}>
                {auto.descripcion}
              </p>
            </div>
          )}

          {/* AUTOS SIMILARES */}
          {autosSimilares.length > 0 && (
            <div style={{ marginTop: '3rem', paddingTop: '3rem', borderTop: '1px solid var(--gray2)' }}>
              <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.15em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                También te puede interesar
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: 'var(--gray2)' }}>
                {autosSimilares.map(a => <CarCard key={a.id} auto={a} />)}
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA */}
        <div className="autodetalle-sidebar" style={{ padding: '3rem 2rem', position: 'sticky', top: '58px', height: 'calc(100vh - 58px)', overflowY: 'auto' }}>
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
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 42px)', lineHeight: 1.1, marginBottom: '1.5rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{auto.modelo.toUpperCase()}</div>

          {/* PUBLICADO POR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--gray1)', border: '1px solid var(--gray2)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: '1.5rem' }}>
            {c ? (
              <>
                {c.logo
                  ? <img src={c.logo} alt={c.nombre} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--gray3)' }} />
                  : <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gray2)', border: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--accent)' }}>
                      {c.nombre?.[0]?.toUpperCase() || 'C'}
                    </div>
                }
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '2px' }}>Publicado por</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)' }}>{c.nombre}</div>
                  {c.ciudad && <div style={{ fontSize: '12px', color: 'var(--gray4)' }}>{c.ciudad}</div>}
                </div>
              </>
            ) : (
              <>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gray2)', border: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--gray4)', fontFamily: 'var(--font-mono)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '2px' }}>Publicado por</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)' }}>{auto.nombre_vendedor || 'Particular'}</div>
                </div>
              </>
            )}
          </div>

          {/* COMPARTIR */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
            <button onClick={() => {
              const url = window.location.href
              const txt = `${auto.marca} ${auto.modelo} ${auto.anio} — ${auto.tipo === 'nuevo' ? 'Nuevo' : 'Usado'}`
              window.open(`https://wa.me/?text=${encodeURIComponent(txt + '\n' + url)}`, '_blank')
            }} style={{ flex: 1, padding: '8px', background: '#25D366', border: 'none', borderRadius: 'var(--radius)', color: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              Compartir WA
            </button>
            <button onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              setLinkCopiado(true)
              setTimeout(() => setLinkCopiado(false), 2000)
            }} style={{ flex: 1, padding: '8px', background: 'var(--gray2)', border: '1px solid var(--gray3)', borderRadius: 'var(--radius)', color: linkCopiado ? '#4ade80' : 'var(--white)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'color .2s' }}>
              {linkCopiado ? '✓ Copiado' : 'Copiar link'}
            </button>
            <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${auto.marca} ${auto.modelo} ${auto.anio} en FIORA MARKET`)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
              style={{ padding: '8px 12px', background: '#000', border: '1px solid #333', borderRadius: 'var(--radius)', color: '#fff', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              𝕏
            </button>
          </div>

          {(Number(auto.precio_ars) > 0 || Number(auto.precio_usd) > 0) && (
            <div style={{ padding: '1.25rem', background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', marginTop: '2rem', marginBottom: '2rem', border: '1px solid var(--gray2)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gray4)', marginBottom: '8px', letterSpacing: '.1em', textTransform: 'uppercase' }}>PRECIO DE LISTA</div>
              {Number(auto.precio_ars) > 0 && (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', color: 'var(--white)', lineHeight: 1 }}>
                  {formatPrice(auto.precio_ars)}
                </div>
              )}
              {(() => {
                const usd = Number(auto.precio_usd)
                const ars = Number(auto.precio_ars)
                const usdCalc = (!usd && ars > 0 && dolarBlue && isFinite(ars / dolarBlue)) ? Math.round(ars / dolarBlue) : usd
                const esAprox = !usd && !!usdCalc
                if (!usdCalc) return null
                return (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: ars > 0 ? '8px' : '0' }}>
                    <div style={{ fontFamily: ars > 0 ? 'var(--font-body)' : 'var(--font-display)', fontSize: ars > 0 ? '16px' : '40px', color: 'var(--accent)', fontWeight: 600 }}>
                      USD {usdCalc.toLocaleString('es-AR')}
                    </div>
                    {esAprox && <div style={{ fontSize: '11px', color: 'var(--gray4)' }}>(aprox. dólar blue)</div>}
                  </div>
                )
              })()}
            </div>
          )}

          {/* COMPARADOR */}
          <div style={{ marginBottom: '1.5rem' }}>
            {estaEnLista(auto.id) ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#4ade80' }}>✓ Agregado al comparador</span>
                <button onClick={() => quitar(auto.id)} style={{ fontSize: '12px', color: 'var(--gray4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Quitar</button>
                {lista.length >= 2 && (
                  <button onClick={() => navigate('/comparador')} style={{ fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Ver comparación →</button>
                )}
              </div>
            ) : (
              <button onClick={() => agregar(auto)} disabled={lista.length >= 3}
                className="btn-secondary" style={{ width: '100%', fontSize: '13px', padding: '10px' }}>
                {lista.length >= 3 ? 'Comparador lleno (máx. 3)' : '⇄ Agregar al comparador'}
              </button>
            )}
          </div>

          {/* CALCULADORA DE CUOTAS */}
          {Number(auto.precio_ars) > 0 && (() => {
            const capital = Number(auto.precio_ars)
            const safeTNA = Math.min(Math.max(Number(cuotasTNA) || 0, 0), 500)
            const tnaDecimal = safeTNA / 100
            const tem = tnaDecimal / 12
            const cuota = tem === 0 ? capital / cuotasMeses : capital * (tem * Math.pow(1 + tem, cuotasMeses)) / (Math.pow(1 + tem, cuotasMeses) - 1)
            const cuotaDisplay = isFinite(cuota) && cuota > 0 ? `$${Math.round(cuota).toLocaleString('es-AR')}` : '—'
            return (
              <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--gray2)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '1rem' }}>Calculadora de cuotas</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--gray4)', marginBottom: '4px' }}>Plazo</div>
                    <select value={cuotasMeses} onChange={e => setCuotasMeses(Number(e.target.value))}
                      style={{ width: '100%', background: 'var(--gray2)', border: '1px solid var(--gray3)', color: 'var(--white)', padding: '7px 10px', borderRadius: 'var(--radius)', fontSize: '13px', outline: 'none' }}>
                      {[6,12,18,24,36,48,60].map(m => <option key={m} value={m}>{m} meses</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--gray4)', marginBottom: '4px' }}>TNA %</div>
                    <input type="number" value={cuotasTNA}
                      onChange={e => {
                        const v = Number(e.target.value)
                        if (!isFinite(v)) return
                        setCuotasTNA(Math.min(Math.max(v, 0), 500))
                      }}
                      min="0" max="500"
                      style={{ width: '100%', background: 'var(--gray2)', border: '1px solid var(--gray3)', color: 'var(--white)', padding: '7px 10px', borderRadius: 'var(--radius)', fontSize: '13px', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray2)', padding: '12px 14px', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--gray4)' }}>{cuotasMeses} cuotas de</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--white)' }}>{cuotaDisplay}</div>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--gray3)', marginTop: '6px' }}>Estimación orientativa. Consultá con tu banco o financiera.</div>
              </div>
            )
          })()}

          {!c && auto.whatsapp && (
            <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--gray2)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '1rem', color: 'var(--white)' }}>Contactar al vendedor</div>
              <button onClick={() => window.open(`https://wa.me/${auto.whatsapp.replace(/\D/g,'')}?text=Hola! Me interesa el ${auto.marca} ${auto.modelo}`, '_blank')}
                className="btn-primary"
                style={{ width: '100%', background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,211,102,0.2)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.99 0C5.37 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.83L.057 23.998l6.306-1.654A11.954 11.954 0 0011.99 24C18.627 24 24 18.627 24 12S18.627 0 11.99 0zm.01 21.818a9.818 9.818 0 01-5.002-1.368l-.36-.214-3.733.979 1-3.64-.234-.374a9.818 9.818 0 119.33 4.617z"/></svg>
                WhatsApp
              </button>
            </div>
          )}

          {c && (
            <div style={{ background: 'var(--gray1)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--gray2)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '1rem', color: 'var(--white)' }}>Contactar concesionaria</div>
              {c.whatsapp && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button onClick={() => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g,'')}?text=Hola! Me interesa el ${auto.marca} ${auto.modelo}`, '_blank')}
                    className="btn-primary"
                    style={{ flex: 1, background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,211,102,0.2)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.99 0C5.37 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.83L.057 23.998l6.306-1.654A11.954 11.954 0 0011.99 24C18.627 24 24 18.627 24 12S18.627 0 11.99 0zm.01 21.818a9.818 9.818 0 01-5.002-1.368l-.36-.214-3.733.979 1-3.64-.234-.374a9.818 9.818 0 119.33 4.617z"/></svg>
                    WhatsApp
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(c.whatsapp); setTelCopiado(true); setTimeout(() => setTelCopiado(false), 2000) }}
                    style={{ padding: '0 14px', borderRadius: 'var(--radius)', border: '1px solid var(--gray3)', background: 'transparent', color: telCopiado ? '#4ade80' : 'var(--gray4)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color .2s' }}>
                    {telCopiado ? '✓ Copiado' : '📋 Número'}
                  </button>
                </div>
              )}
              {c.telefono && !c.whatsapp && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => window.open(`https://wa.me/${c.telefono.replace(/\D/g,'')}?text=Hola! Me interesa el ${auto.marca} ${auto.modelo}`, '_blank')}
                    className="btn-primary"
                    style={{ flex: 1, background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,211,102,0.2)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.99 0C5.37 0 0 5.373 0 12c0 2.117.554 4.104 1.523 5.83L.057 23.998l6.306-1.654A11.954 11.954 0 0011.99 24C18.627 24 24 18.627 24 12S18.627 0 11.99 0zm.01 21.818a9.818 9.818 0 01-5.002-1.368l-.36-.214-3.733.979 1-3.64-.234-.374a9.818 9.818 0 119.33 4.617z"/></svg>
                    WhatsApp
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(c.telefono); setTelCopiado(true); setTimeout(() => setTelCopiado(false), 2000) }}
                    style={{ padding: '0 14px', borderRadius: 'var(--radius)', border: '1px solid var(--gray3)', background: 'transparent', color: telCopiado ? '#4ade80' : 'var(--gray4)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color .2s' }}>
                    {telCopiado ? '✓ Copiado' : '📋 Número'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="form-field">
            <div style={{ fontSize: '13px', color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '1rem' }}>Enviar Mensaje</div>
            {enviado
              ? <div style={{ padding: '1rem', background: 'rgba(74,222,128,0.1)', color: '#4ade80', borderRadius: 'var(--radius)', border: '1px solid rgba(74,222,128,0.2)', textAlign: 'center' }}>✓ Mensaje enviado con éxito.</div>
              : <>
                  <input type="text" placeholder="Tu nombre *" value={consulta.nombre} onChange={e => { setConsulta(p => ({ ...p, nombre: e.target.value })); setErroresConsulta(p => ({ ...p, nombre: '' })) }} style={erroresConsulta.nombre ? { borderColor: '#f87171' } : {}} />
                  {erroresConsulta.nombre && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '-8px', marginBottom: '4px' }}>⚠ {erroresConsulta.nombre}</div>}
                  <input type="email" placeholder="Tu email *" value={consulta.email} onChange={e => { setConsulta(p => ({ ...p, email: e.target.value })); setErroresConsulta(p => ({ ...p, email: '' })) }} style={erroresConsulta.email ? { borderColor: '#f87171' } : {}} />
                  {erroresConsulta.email && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '-8px', marginBottom: '4px' }}>⚠ {erroresConsulta.email}</div>}
                  <input type="tel" placeholder="Tu teléfono (opcional)" value={consulta.telefono} onChange={e => setConsulta(p => ({ ...p, telefono: e.target.value }))} />
                  <textarea placeholder="Hola, me interesa este vehículo... *" value={consulta.mensaje} onChange={e => { setConsulta(p => ({ ...p, mensaje: e.target.value })); setErroresConsulta(p => ({ ...p, mensaje: '' })) }} style={{ minHeight: '100px', ...(erroresConsulta.mensaje ? { borderColor: '#f87171' } : {}) }} />
                  {erroresConsulta.mensaje && <div style={{ color: '#f87171', fontSize: '12px', marginTop: '-8px', marginBottom: '4px' }}>⚠ {erroresConsulta.mensaje}</div>}
                  <button className="btn-primary" onClick={enviarConsulta} disabled={enviando} style={{ marginTop: '0.5rem', width: '100%' }}>
                    {enviando ? 'Enviando...' : 'Enviar consulta'}
                  </button>
                  {errorConsulta && (
                    <div style={{ color: '#f87171', fontSize: '13px', marginTop: '8px' }}>⚠ {errorConsulta}</div>
                  )}
                </>
            }
          </div>
        </div>
      </div>
    </div>
  )
}