import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { colorDe, rgbaMarca, COLOR_MARCA_DEFAULT, FONDO_SHOWROOM_DEFAULT as FONDO_DEFAULT } from '../lib/marca'

const MAX_MB = 6

const PALETA = [COLOR_MARCA_DEFAULT, '#185FA5', '#1a7a4a', '#c9a84c', '#7F77DD', '#D85A30', '#e8e6e1', '#6b7280']

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

function borrador(c) {
  return {
    nombre: c.nombre || '',
    logo_url: c.logo_url || '',
    portada_url: c.portada_url || '',
    color_marca: colorDe(c),
    portada_vehiculo_url: c.portada_vehiculo_url || '',
    portada_vehiculo_escala: Number(c.portada_vehiculo_escala) || 1,
    portada_vehiculo_x: c.portada_vehiculo_x ?? 58,
    portada_vehiculo_y: c.portada_vehiculo_y ?? 66,
  }
}

async function subirImagen(file, concId, slot) {
  if (!file.type.startsWith('image/')) throw new Error('El archivo tiene que ser una imagen.')
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`La imagen supera los ${MAX_MB} MB.`)
  const ext = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${concId}/portada/${slot}_${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('fotos-autos').upload(path, file)
  if (error) throw new Error('No se pudo subir la imagen. Probá de nuevo.')
  return supabase.storage.from('fotos-autos').getPublicUrl(path).data.publicUrl
}

function LogoMarca({ c, size, className }) {
  if (c.logo_url) return <img className={className} src={c.logo_url} alt="" style={{ width: size, height: size }} />
  return (
    <div className={`${className} conc-logo--fallback`} style={{ width: size, height: size, fontSize: size * 0.46 }}>
      {c.nombre?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

export function ConcesionariaPortada({ c, onUpdate }) {
  const { concesionaria } = useAuth()
  const esDueno = concesionaria?.id === c.id

  const [draft, setDraft] = useState(() => borrador(c))
  const [abierto, setAbierto] = useState(false)
  const [moviendo, setMoviendo] = useState(false)
  const heroRef = useRef(null)

  const vista = esDueno ? { ...c, ...draft } : c
  const color = colorDe(vista)
  const fondo = vista.portada_url || FONDO_DEFAULT
  const setD = (parcial) => setDraft(p => ({ ...p, ...parcial }))

  function arrastrar(e) {
    if (!moviendo || !heroRef.current) return
    const r = heroRef.current.getBoundingClientRect()
    setD({
      portada_vehiculo_x: Math.round(clamp(((e.clientX - r.left) / r.width) * 100, 0, 100)),
      portada_vehiculo_y: Math.round(clamp(((e.clientY - r.top) / r.height) * 100, 0, 100)),
    })
  }

  return (
    <section
      ref={heroRef}
      className={`conc-hero${esDueno && moviendo ? ' is-moviendo' : ''}`}
      style={{ '--marca': color, '--marca-30': rgbaMarca(color, .3), '--marca-15': rgbaMarca(color, .15) }}
    >
      <div className="conc-hero__escena" />
      <div className="conc-hero__bg" style={{ backgroundImage: `url("${fondo}")` }} />

      <div className="conc-hero__pared">
        <LogoMarca c={vista} size={92} className="conc-logo" />
        <div className="conc-hero__pared-nombre">{vista.nombre?.toUpperCase()}</div>
      </div>

      <div className="conc-hero__scrim" />

      {vista.portada_vehiculo_url && (
        <img
          className="conc-hero__auto"
          src={vista.portada_vehiculo_url}
          alt=""
          draggable={false}
          style={{
            left: `${vista.portada_vehiculo_x}%`,
            top: `${vista.portada_vehiculo_y}%`,
            '--auto-w': `${(Number(vista.portada_vehiculo_escala) || 1) * 62}%`,
          }}
          onPointerDown={e => { if (moviendo) { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId) } }}
          onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) arrastrar(e) }}
        />
      )}

      <div className="conc-hero__top">
        <LogoMarca c={vista} size={56} className="conc-logo" />
        <span className="conc-hero__top-nombre">{vista.nombre?.toUpperCase()}</span>
      </div>

      {esDueno && !abierto && (
        <button type="button" className="conc-hero__editar" onClick={() => setAbierto(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" /></svg>
          <span>Personalizá tu portada</span>
        </button>
      )}

      {esDueno && abierto && (
        <PortadaEditor
          c={c}
          draft={draft}
          setD={setD}
          color={color}
          moviendo={moviendo}
          setMoviendo={setMoviendo}
          onCerrar={() => { setMoviendo(false); setAbierto(false) }}
          onUpdate={onUpdate}
        />
      )}
    </section>
  )
}

function PortadaEditor({ c, draft, setD, color, moviendo, setMoviendo, onCerrar, onUpdate }) {
  const [subiendo, setSubiendo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  async function elegirImagen(e, slot, campo) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setSubiendo(slot)
    try {
      setD({ [campo]: await subirImagen(file, c.id, slot) })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo('')
    }
  }

  async function guardar() {
    setGuardando(true)
    setError('')
    const datos = {
      nombre: draft.nombre.trim() || c.nombre,
      logo_url: draft.logo_url || null,
      portada_url: draft.portada_url || null,
      color_marca: draft.color_marca,
      portada_vehiculo_url: draft.portada_vehiculo_url || null,
      portada_vehiculo_escala: draft.portada_vehiculo_escala,
      portada_vehiculo_x: draft.portada_vehiculo_x,
      portada_vehiculo_y: draft.portada_vehiculo_y,
    }
    const { error: err } = await supabase.from('concesionarias').update(datos).eq('id', c.id)
    setGuardando(false)
    if (err) { setError('No se pudieron guardar los cambios.'); return }
    setMoviendo(false)
    onUpdate(datos)
    setOk(true)
    setTimeout(() => setOk(false), 2500)
  }

  return (
    <aside className="portada-editor" aria-label="Personalizá tu portada">
      <header className="portada-editor__head">
        <div>
          <div className="portada-editor__titulo">Personalizá tu portada</div>
          <div className="portada-editor__ojo">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            Vista del propietario
          </div>
        </div>
        <button type="button" className="portada-editor__cerrar" onClick={onCerrar} aria-label="Cerrar editor">✕</button>
      </header>

      <div className="portada-editor__body">
        <div className="portada-editor__grupo">
          <div className="portada-editor__label">Identidad</div>
          <div className="portada-editor__identidad">
            <label className="portada-editor__thumb portada-editor__thumb--logo">
              {draft.logo_url
                ? <img src={draft.logo_url} alt="" />
                : <span className="portada-editor__inicial">{draft.nombre?.[0]?.toUpperCase() || '?'}</span>}
              <span className="portada-editor__lapiz">{subiendo === 'logo' ? '…' : '✎'}</span>
              <input type="file" accept="image/*" onChange={e => elegirImagen(e, 'logo', 'logo_url')} />
            </label>
            <input
              className="portada-editor__nombre"
              value={draft.nombre}
              onChange={e => setD({ nombre: e.target.value })}
              placeholder="Nombre de la concesionaria"
              maxLength={60}
            />
          </div>
        </div>

        <div className="portada-editor__grupo">
          <div className="portada-editor__label">Fondo de portada</div>
          <div className="portada-editor__fondo" style={{ backgroundImage: `url("${draft.portada_url || FONDO_DEFAULT}")` }} />
          <label className="portada-editor__btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
            {subiendo === 'fondo' ? 'Subiendo…' : 'Cambiar fondo'}
            <input type="file" accept="image/*" onChange={e => elegirImagen(e, 'fondo', 'portada_url')} />
          </label>
          <p className="portada-editor__hint">Tu logo y nombre van sobre la pared.</p>
        </div>

        <div className="portada-editor__grupo">
          <div className="portada-editor__label">Vehículo destacado</div>
          <div className="portada-editor__auto">
            {draft.portada_vehiculo_url
              ? <img src={draft.portada_vehiculo_url} alt="" />
              : <span className="portada-editor__hint" style={{ margin: 0 }}>Sin vehículo</span>}
          </div>
          <label className="portada-editor__btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
            {subiendo === 'vehiculo' ? 'Subiendo…' : 'Subir auto sin fondo'}
            <input type="file" accept="image/png,image/webp" onChange={e => elegirImagen(e, 'vehiculo', 'portada_vehiculo_url')} />
          </label>
          <p className="portada-editor__hint">PNG o WebP con fondo transparente.</p>

          <div className="portada-editor__controles">
            <div>
              <div className="portada-editor__label">Tamaño</div>
              <input
                type="range" min="0.4" max="1.6" step="0.02"
                value={draft.portada_vehiculo_escala}
                onChange={e => setD({ portada_vehiculo_escala: Number(e.target.value) })}
                disabled={!draft.portada_vehiculo_url}
                aria-label="Tamaño del vehículo"
              />
            </div>
            <div>
              <div className="portada-editor__label">Posición</div>
              <button
                type="button"
                className={`portada-editor__mover${moviendo ? ' is-on' : ''}`}
                onClick={() => setMoviendo(v => !v)}
                disabled={!draft.portada_vehiculo_url}
                aria-pressed={moviendo}
                title={moviendo ? 'Arrastrá el vehículo sobre la portada' : 'Activar para mover el vehículo'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" /></svg>
              </button>
            </div>
          </div>
          {moviendo && <p className="portada-editor__hint">Arrastrá el vehículo sobre la portada.</p>}
        </div>

        <div className="portada-editor__grupo">
          <div className="portada-editor__label">Color de marca</div>
          <div className="portada-editor__paleta">
            {PALETA.map(hex => (
              <button
                key={hex}
                type="button"
                className={`portada-editor__color${color.toLowerCase() === hex.toLowerCase() ? ' is-on' : ''}`}
                style={{ background: hex }}
                onClick={() => setD({ color_marca: hex })}
                aria-label={`Color ${hex}`}
                aria-pressed={color.toLowerCase() === hex.toLowerCase()}
              />
            ))}
          </div>
        </div>

        {error && <p className="portada-editor__error">{error}</p>}
        {ok && <p className="portada-editor__ok">✓ Portada actualizada</p>}
      </div>

      <button type="button" className="portada-editor__guardar" onClick={guardar} disabled={guardando || !!subiendo}>
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </aside>
  )
}
