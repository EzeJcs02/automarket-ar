import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { DetalleSkeleton, EmptyState } from '../components/Estados'
import { useAuth } from '../context/AuthContext'
import { useComparador } from '../context/ComparadorContext'
import CarCard from '../components/CarCard'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Field from '../components/ui/Field'
import Icon from '../components/ui/Icon'
import { setMeta, setCanonical, resetMeta } from '../lib/seo'
import { getDolarBlue } from '../lib/dolarBlue'
import { useModalA11y } from '../lib/useModalA11y'
import { formatKm, formatPrecio } from '../lib/formato'
import './AutoDetalle.css'

const waLink = (numero, texto) => `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`

function Lightbox({ fotos, idx, setIdx, alt, onClose }) {
  const ref = useRef(null)
  useModalA11y(ref, onClose)
  const mover = d => setIdx(i => (i + d + fotos.length) % fotos.length)

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % fotos.length)
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + fotos.length) % fotos.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [fotos.length, setIdx])

  return (
    <div className="lightbox" ref={ref} role="dialog" aria-modal="true" aria-label="Fotos del vehículo" onClick={onClose}>
      <button type="button" className="lightbox__close" onClick={onClose} aria-label="Cerrar"><Icon name="close" size={22} /></button>
      <img src={fotos[idx]} alt={`${alt}, foto ${idx + 1} de ${fotos.length}`} onClick={e => e.stopPropagation()} />
      {fotos.length > 1 && (
        <>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={e => { e.stopPropagation(); mover(-1) }} aria-label="Foto anterior"><Icon name="arrowLeft" size={22} /></button>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={e => { e.stopPropagation(); mover(1) }} aria-label="Foto siguiente"><Icon name="arrowRight" size={22} /></button>
          <p className="lightbox__count tabular" aria-live="polite">{idx + 1} / {fotos.length}</p>
        </>
      )}
    </div>
  )
}

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
      setFotoIdx(0)
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
    // Dedupe: 1 vista por auto por sesión del navegador
    try {
      const key = `viewed:${id}`
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        supabase.rpc('incrementar_vistas', { auto_id: id })
      }
    } catch {
      supabase.rpc('incrementar_vistas', { auto_id: id })
    }
    return () => {
      mounted = false
      resetMeta()
    }
  }, [id])

  useEffect(() => {
    if (!esParticular) return
    supabase.from('favoritos').select('id').eq('user_id', user.id).eq('auto_id', id).single()
      .then(({ data }) => setIsFavorito(!!data))
  }, [user, id, esParticular])

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

  async function enviarConsulta(e) {
    e.preventDefault()
    const errs = {}
    if (!consulta.nombre.trim()) errs.nombre = 'Ingresá tu nombre'
    if (!consulta.email.trim()) errs.email = 'Ingresá tu email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(consulta.email)) errs.email = 'Ingresá un email válido'
    if (!consulta.mensaje.trim()) errs.mensaje = 'Escribí un mensaje'
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
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'consulta', auto_id: auto.id, nombre: consulta.nombre, email: consulta.email, mensaje: consulta.mensaje, telefono: consulta.telefono || null }),
    }).catch(() => {})
    // Confirmación al comprador
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'confirma',
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

  function setCampo(k, v) {
    setConsulta(p => ({ ...p, [k]: v }))
    setErroresConsulta(p => ({ ...p, [k]: '' }))
  }

  function copiar(texto, setOk) {
    navigator.clipboard.writeText(texto)
    setOk(true)
    setTimeout(() => setOk(false), 2000)
  }

  if (loading) return <div className="page-wrapper"><div className="container"><DetalleSkeleton /></div></div>
  if (fetchError) return (
    <div className="page-wrapper"><div className="container detalle__estado">
      <div className="estado-box" role="alert">
        <div className="estado-box__titulo">No pudimos cargar el vehículo</div>
        <p className="estado-box__texto">{fetchError}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    </div></div>
  )
  if (!auto) return <div className="page-wrapper"><div className="container detalle__estado"><EmptyState titulo="Vehículo no encontrado" texto="Puede que la publicación haya sido pausada o eliminada." accion="Ver el catálogo" to="/catalogo" /></div></div>

  const fotos = auto.fotos || []
  const c = auto.concesionarias
  const nombre = `${auto.marca} ${auto.modelo}`
  const telContacto = c ? (c.whatsapp || c.telefono) : auto.whatsapp
  const textoWa = `Hola! Me interesa el ${nombre} que vi en FIORA MARKET`
  const ars = Number(auto.precio_ars)
  const usd = Number(auto.precio_usd)
  const usdCalc = (!usd && ars > 0 && dolarBlue && isFinite(ars / dolarBlue)) ? Math.round(ars / dolarBlue) : usd
  const usdAprox = !usd && !!usdCalc
  const enComparador = estaEnLista(auto.id)

  const specs = [
    ['Año', auto.anio],
    ['Kilometraje', formatKm(auto.kilometraje)],
    ['Combustible', auto.combustible],
    ['Transmisión', auto.transmision],
    ['Color', auto.color],
    ['Condición', auto.tipo === 'nuevo' ? 'Nuevo' : 'Usado'],
  ].filter(([, v]) => v)

  let cuotaDisplay = null
  if (ars > 0) {
    const safeTNA = Math.min(Math.max(Number(cuotasTNA) || 0, 0), 500)
    const tem = safeTNA / 100 / 12
    const cuota = tem === 0 ? ars / cuotasMeses : ars * (tem * Math.pow(1 + tem, cuotasMeses)) / (Math.pow(1 + tem, cuotasMeses) - 1)
    cuotaDisplay = isFinite(cuota) && cuota > 0 ? `$${Math.round(cuota).toLocaleString('es-AR')}` : '—'
  }

  return (
    <div className="page-wrapper detalle">
      {zoom && fotos.length > 0 && <Lightbox fotos={fotos} idx={fotoIdx} setIdx={setFotoIdx} alt={nombre} onClose={() => setZoom(false)} />}

      <div className="container">
        <nav className="migas" aria-label="Ruta">
          <ol>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to={`/catalogo?q=${encodeURIComponent(auto.marca)}`}>{auto.marca}</Link></li>
            <li aria-current="page">{auto.modelo}</li>
          </ol>
        </nav>

        <div className="detalle__layout">
          {/* COLUMNA PRINCIPAL */}
          <div className="detalle__main">
            <section className="galeria" aria-label="Fotos">
              <div className="galeria__main">
                {fotos.length > 0
                  ? <button type="button" className="galeria__open" onClick={() => setZoom(true)} aria-label="Ampliar foto">
                      <img src={fotos[fotoIdx]} alt={`${nombre}, foto ${fotoIdx + 1} de ${fotos.length}`} />
                    </button>
                  : <div className="galeria__empty"><Icon name="car" size={64} strokeWidth={1} /></div>}
                {fotos.length > 1 && (
                  <>
                    <button type="button" className="galeria__nav galeria__nav--prev" onClick={() => setFotoIdx(i => (i - 1 + fotos.length) % fotos.length)} aria-label="Foto anterior"><Icon name="arrowLeft" size={20} /></button>
                    <button type="button" className="galeria__nav galeria__nav--next" onClick={() => setFotoIdx(i => (i + 1) % fotos.length)} aria-label="Foto siguiente"><Icon name="arrowRight" size={20} /></button>
                  </>
                )}
                {fotos.length > 0 && (
                  <span className="galeria__count tabular"><Icon name="expand" size={14} />{fotoIdx + 1} / {fotos.length}</span>
                )}
              </div>
              {fotos.length > 1 && (
                <ul className="galeria__thumbs">
                  {fotos.map((f, i) => (
                    <li key={i}>
                      <button type="button" className="galeria__thumb" onClick={() => setFotoIdx(i)} aria-label={`Ver foto ${i + 1}`} aria-pressed={i === fotoIdx}>
                        <img src={f} alt="" loading="lazy" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="detalle__block" aria-labelledby="specs-title">
              <h2 id="specs-title" className="detalle__h2">Ficha técnica</h2>
              <dl className="specs">
                {specs.map(([label, val]) => (
                  <div key={label} className="specs__item">
                    <dt>{label}</dt>
                    <dd className="tabular">{val}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {auto.descripcion && (
              <section className="detalle__block" aria-labelledby="desc-title">
                <h2 id="desc-title" className="detalle__h2">Descripción</h2>
                <p className="detalle__desc">{auto.descripcion}</p>
              </section>
            )}

            {cuotaDisplay && (
              <section className="detalle__block" aria-labelledby="cuotas-title">
                <h2 id="cuotas-title" className="detalle__h2">Calculá tus cuotas</h2>
                <div className="cuotas surface">
                  <div className="cuotas__inputs">
                    <Field label="Plazo">
                      <select value={cuotasMeses} onChange={e => setCuotasMeses(Number(e.target.value))}>
                        {[6, 12, 18, 24, 36, 48, 60].map(m => <option key={m} value={m}>{m} meses</option>)}
                      </select>
                    </Field>
                    <Field label="Tasa nominal anual (%)">
                      <input type="number" inputMode="decimal" min="0" max="500" value={cuotasTNA}
                        onChange={e => {
                          const v = Number(e.target.value)
                          if (!isFinite(v)) return
                          setCuotasTNA(Math.min(Math.max(v, 0), 500))
                        }} />
                    </Field>
                  </div>
                  <div className="cuotas__result">
                    <span>{cuotasMeses} cuotas de</span>
                    <strong className="tabular" aria-live="polite">{cuotaDisplay}</strong>
                  </div>
                  <p className="cuotas__nota">Estimación orientativa sobre el precio de lista. Consultá con tu banco o financiera.</p>
                </div>
              </section>
            )}

            <section className="detalle__block" id="consulta" aria-labelledby="consulta-title">
              <h2 id="consulta-title" className="detalle__h2">Consultá por este vehículo</h2>
              {enviado
                ? <div className="consulta__ok surface" role="status">
                    <Icon name="check" size={20} strokeWidth={2.25} />
                    <div><strong>Consulta enviada.</strong><p>Te va a llegar una confirmación por email y {c?.nombre || 'el vendedor'} te va a responder a la brevedad.</p></div>
                  </div>
                : <form className="consulta surface" onSubmit={enviarConsulta} noValidate>
                    <div className="consulta__grid">
                      <Field label="Nombre" error={erroresConsulta.nombre}>
                        <input type="text" autoComplete="name" placeholder="Juan Pérez" value={consulta.nombre} onChange={e => setCampo('nombre', e.target.value)} />
                      </Field>
                      <Field label="Email" error={erroresConsulta.email}>
                        <input type="email" autoComplete="email" placeholder="tu@email.com" value={consulta.email} onChange={e => setCampo('email', e.target.value)} />
                      </Field>
                      <Field label="Teléfono (opcional)" className="consulta__full">
                        <input type="tel" autoComplete="tel" placeholder="+54 387 000-0000" value={consulta.telefono} onChange={e => setCampo('telefono', e.target.value)} />
                      </Field>
                      <Field label="Mensaje" error={erroresConsulta.mensaje} className="consulta__full">
                        <textarea placeholder={`Hola, me interesa el ${nombre}. ¿Sigue disponible?`} value={consulta.mensaje} onChange={e => setCampo('mensaje', e.target.value)} />
                      </Field>
                    </div>
                    {errorConsulta && <p className="field__error" role="alert"><Icon name="alert" size={14} />{errorConsulta}</p>}
                    <Button type="submit" disabled={enviando} size="lg">{enviando ? 'Enviando…' : 'Enviar consulta'}</Button>
                  </form>}
            </section>
          </div>

          {/* CAJA DE COMPRA */}
          <aside className="compra" aria-label="Precio y contacto">
            <div className="compra__card surface">
              <div className="compra__badges">
                {auto.urgente ? <Badge tone="brand">Urgente</Badge> : auto.destacado ? <Badge tone="champagne">Destacado</Badge> : null}
                <Badge tone={auto.tipo === 'nuevo' ? 'light' : 'neutral'}>{auto.tipo === 'nuevo' ? 'Nuevo' : 'Usado'}</Badge>
              </div>
              <p className="compra__brand">{auto.marca}</p>
              <h1 className="compra__title">{auto.modelo}</h1>
              <ul className="compra__specs tabular">
                <li>{auto.anio}</li>
                <li>{formatKm(auto.kilometraje)}</li>
                {auto.combustible && <li>{auto.combustible}</li>}
              </ul>

              {(ars > 0 || usdCalc > 0) && (
                <div className="compra__precio">
                  <span className="compra__precio-label">Precio de lista</span>
                  <strong className="tabular">{ars > 0 ? formatPrecio(ars) : `USD ${usdCalc.toLocaleString('es-AR')}`}</strong>
                  {ars > 0 && usdCalc > 0 && (
                    <span className="compra__usd tabular">USD {usdCalc.toLocaleString('es-AR')}{usdAprox && <em> · aprox. dólar blue</em>}</span>
                  )}
                </div>
              )}

              <div className="compra__ctas">
                {telContacto && (
                  <Button variant="whatsapp" size="lg" block href={waLink(telContacto, textoWa)}>
                    <Icon name="whatsapp" size={18} />Escribir por WhatsApp
                  </Button>
                )}
                <Button variant="secondary" size="lg" block href="#consulta">
                  <Icon name="mail" size={18} />Enviar consulta
                </Button>
                {c && telContacto && (
                  <button type="button" className="compra__copy" onClick={() => copiar(telContacto, setTelCopiado)}>
                    <Icon name={telCopiado ? 'check' : 'copy'} size={14} />{telCopiado ? 'Número copiado' : `Copiar número ${telContacto}`}
                  </button>
                )}
              </div>

              <div className="compra__tools">
                {esParticular && (
                  <button type="button" className={`compra__tool ${isFavorito ? 'is-on' : ''}`} onClick={toggleFavorito} aria-pressed={isFavorito}>
                    <Icon name="heart" size={16} filled={isFavorito} />{isFavorito ? 'Guardado' : 'Guardar'}
                  </button>
                )}
                <button type="button" className={`compra__tool ${enComparador ? 'is-on' : ''}`}
                  onClick={() => enComparador ? quitar(auto.id) : agregar(auto)}
                  disabled={!enComparador && lista.length >= 3} aria-pressed={enComparador}
                  title={!enComparador && lista.length >= 3 ? 'Comparador lleno (máx. 3)' : undefined}>
                  <Icon name={enComparador ? 'check' : 'compare'} size={16} />{enComparador ? 'En comparador' : 'Comparar'}
                </button>
                <button type="button" className="compra__tool" onClick={() => copiar(window.location.href, setLinkCopiado)}>
                  <Icon name={linkCopiado ? 'check' : 'link'} size={16} />{linkCopiado ? 'Link copiado' : 'Copiar link'}
                </button>
                <a className="compra__tool" target="_blank" rel="noopener noreferrer"
                  href={`https://wa.me/?text=${encodeURIComponent(`${nombre} ${auto.anio} en FIORA MARKET\n${window.location.href}`)}`}>
                  <Icon name="whatsapp" size={15} />Compartir
                </a>
                <a className="compra__tool" target="_blank" rel="noopener noreferrer" aria-label="Compartir en X"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${nombre} ${auto.anio} en FIORA MARKET`)}&url=${encodeURIComponent(window.location.href)}`}>
                  𝕏
                </a>
              </div>
              {enComparador && lista.length >= 2 && (
                <Link to="/comparador" className="compra__compare-go">Ver comparación ({lista.length})<Icon name="arrowRight" size={14} /></Link>
              )}
            </div>

            <div className="vendedor surface">
              {c ? (
                <>
                  <span className="avatar" style={{ '--avatar': '48px' }}>
                    {c.logo_url ? <img src={c.logo_url} alt="" /> : c.nombre?.[0]?.toUpperCase()}
                  </span>
                  <div className="vendedor__info">
                    <span className="vendedor__label">Publicado por</span>
                    <Link to={`/concesionaria/${c.id}`} className="vendedor__name">{c.nombre}</Link>
                    {c.ciudad && <span className="vendedor__city"><Icon name="pin" size={13} />{c.ciudad}</span>}
                  </div>
                  {c.plan === 'premium' && <Badge tone="ok"><Icon name="shield" size={12} strokeWidth={2} />Verificada</Badge>}
                </>
              ) : (
                <>
                  <span className="avatar" style={{ '--avatar': '48px' }}><Icon name="user" size={22} /></span>
                  <div className="vendedor__info">
                    <span className="vendedor__label">Publicado por</span>
                    <span className="vendedor__name">{auto.nombre_vendedor || 'Particular'}</span>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>

        {autosSimilares.length > 0 && (
          <section className="detalle__similares" aria-labelledby="similares-title">
            <h2 id="similares-title" className="section-head__title">Más {auto.marca} disponibles</h2>
            <div className="vgrid">
              {autosSimilares.map(a => <CarCard key={a.id} auto={a} />)}
            </div>
          </section>
        )}
      </div>

      {/* Barra de contacto fija en el celular */}
      <div className="contacto-bar">
        <div className="contacto-bar__precio tabular">{ars > 0 ? formatPrecio(ars) : 'Consultar precio'}</div>
        {telContacto
          ? <Button variant="whatsapp" href={waLink(telContacto, textoWa)}><Icon name="whatsapp" size={18} />WhatsApp</Button>
          : <Button href="#consulta">Consultar</Button>}
      </div>
    </div>
  )
}
