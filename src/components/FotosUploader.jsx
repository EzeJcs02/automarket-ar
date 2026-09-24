import { useEffect, useRef, useState } from 'react'
import { comprimirImagen } from '../lib/fotos'

const MAX_FOTOS = 20

const btnMini = {
  background: 'rgba(0,0,0,.75)', border: 'none', color: '#fff', borderRadius: '100px',
  width: '28px', height: '28px', cursor: 'pointer', fontSize: '13px', lineHeight: 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
}

// fotos: [{ id, url }] ya subidas o [{ id, file, preview, nombre }] nuevas.
// setFotos: el setter de useState del padre (acepta función).
export default function FotosUploader({ fotos, setFotos, minimo = 0 }) {
  const [procesando, setProcesando] = useState(0)
  const [error, setError] = useState('')
  const [arrastrando, setArrastrando] = useState(false)
  const [inputKey, setInputKey] = useState(0)
  const arrastradoRef = useRef(null)
  const fotosRef = useRef(fotos)
  useEffect(() => { fotosRef.current = fotos }, [fotos])

  // Libera las vistas previas al desmontar.
  useEffect(() => () => fotosRef.current.forEach(f => f.preview && URL.revokeObjectURL(f.preview)), [])

  async function agregar(fileList) {
    const archivos = Array.from(fileList || [])
    if (!archivos.length) return
    setError('')
    const lugar = MAX_FOTOS - fotosRef.current.length
    if (lugar <= 0) { setError(`Podés subir hasta ${MAX_FOTOS} fotos.`); return }
    const aProcesar = archivos.slice(0, lugar)
    const errores = []
    setProcesando(aProcesar.length)
    const nuevas = []
    for (const file of aProcesar) {
      try {
        const comprimido = await comprimirImagen(file)
        nuevas.push({ id: crypto.randomUUID(), file: comprimido, preview: URL.createObjectURL(comprimido), nombre: file.name })
      } catch {
        errores.push(file.name)
      }
      setProcesando(n => n - 1)
    }
    setFotos(prev => [...prev, ...nuevas])
    if (errores.length) {
      const heic = errores.some(n => /\.hei[cf]$/i.test(n))
      setError(heic
        ? 'Algunas fotos están en formato HEIC y este navegador no las puede leer. En el iPhone: Ajustes > Cámara > Formatos > "Más compatible", o subilas desde el celular.'
        : `No pudimos leer: ${errores.join(', ')}. Usá fotos JPG, PNG o WebP.`)
    }
    if (archivos.length > lugar) setError(`Se agregaron ${lugar}. El máximo es ${MAX_FOTOS} fotos.`)
    setInputKey(k => k + 1)
  }

  function quitar(id) {
    const foto = fotos.find(f => f.id === id)
    if (foto?.preview) URL.revokeObjectURL(foto.preview)
    setFotos(prev => prev.filter(f => f.id !== id))
  }

  function mover(desde, hasta) {
    if (hasta < 0 || hasta >= fotos.length || desde === hasta) return
    setFotos(prev => {
      const copia = [...prev]
      const [item] = copia.splice(desde, 1)
      copia.splice(hasta, 0, item)
      return copia
    })
  }

  function onDrop(e) {
    e.preventDefault()
    setArrastrando(false)
    if (e.dataTransfer.files?.length) agregar(e.dataTransfer.files)
  }

  const faltan = Math.max(0, minimo - fotos.length)

  return (
    <div
      onDragOver={e => { if (arrastradoRef.current === null) { e.preventDefault(); setArrastrando(true) } }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setArrastrando(false) }}
      onDrop={onDrop}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--white)' }}>FOTOS</div>
        <div style={{ fontSize: '12px', color: faltan ? 'var(--gray4)' : '#4ade80' }} aria-live="polite">
          {fotos.length} foto{fotos.length !== 1 ? 's' : ''}{minimo ? ` · mínimo ${minimo}` : ''}{minimo && !faltan ? ' ✓' : ''}
        </div>
      </div>

      {fotos.length > 0 && (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {fotos.map((f, i) => (
              <li key={f.id}
                draggable
                onDragStart={() => { arrastradoRef.current = i }}
                onDragOver={e => { if (arrastradoRef.current !== null) e.preventDefault() }}
                onDrop={e => { if (arrastradoRef.current === null) return; e.preventDefault(); e.stopPropagation(); mover(arrastradoRef.current, i); arrastradoRef.current = null }}
                onDragEnd={() => { arrastradoRef.current = null }}
                style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 'var(--radius)', overflow: 'hidden', border: `1px solid ${i === 0 ? 'var(--accent)' : 'var(--gray2)'}`, background: 'var(--black)', cursor: 'grab' }}>
                <img src={f.preview || f.url} alt={`Foto ${i + 1}${i === 0 ? ' (portada)' : ''}`} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                {i === 0 && (
                  <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'var(--accent)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 7px', borderRadius: '4px', letterSpacing: '.05em' }}>PORTADA</div>
                )}
                <button type="button" aria-label={`Quitar foto ${i + 1}`} onClick={() => quitar(f.id)} style={{ ...btnMini, position: 'absolute', top: '6px', right: '6px' }}>✕</button>
                <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
                  <button type="button" aria-label={`Mover foto ${i + 1} a la izquierda`} disabled={i === 0} onClick={() => mover(i, i - 1)} style={{ ...btnMini, opacity: i === 0 ? .3 : 1 }}>◀</button>
                  {i !== 0 && (
                    <button type="button" onClick={() => mover(i, 0)} style={{ ...btnMini, width: 'auto', padding: '0 9px', fontSize: '11px', fontWeight: 700 }}>Portada</button>
                  )}
                  <button type="button" aria-label={`Mover foto ${i + 1} a la derecha`} disabled={i === fotos.length - 1} onClick={() => mover(i, i + 1)} style={{ ...btnMini, opacity: i === fotos.length - 1 ? .3 : 1 }}>▶</button>
                </div>
              </li>
            ))}
          </ul>
          <div style={{ fontSize: '12px', color: 'var(--gray4)', marginBottom: '12px' }}>La primera es la portada. Reordená con las flechas<span className="solo-desktop"> o arrastrando</span>.</div>
        </>
      )}

      <label
        style={{ position: 'relative', display: 'block', border: `2px dashed ${arrastrando ? 'var(--accent)' : faltan ? 'var(--gray3)' : 'var(--gray2)'}`, background: arrastrando ? 'rgba(230,51,41,.06)' : 'transparent', borderRadius: 'var(--radius)', padding: fotos.length ? '1.25rem' : '2.5rem 1rem', textAlign: 'center', cursor: 'pointer', transition: 'all .2s' }}>
        <input key={inputKey} type="file" accept="image/*" multiple onChange={e => agregar(e.target.files)} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)' }}>
          {procesando ? `Preparando ${procesando} foto${procesando !== 1 ? 's' : ''}…` : fotos.length ? '+ Agregar más fotos' : 'Elegí las fotos del vehículo'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--gray4)', marginTop: '4px' }}>
          Podés seleccionar varias a la vez{' '}<span className="solo-desktop">o arrastrarlas acá</span>
        </div>
        {faltan > 0 && fotos.length > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '6px' }}>{faltan === 1 ? 'Falta 1' : `Faltan ${faltan}`} para el mínimo</div>
        )}
      </label>

      {error && <div role="alert" style={{ fontSize: '13px', color: '#f87171', marginTop: '8px', lineHeight: 1.5 }}>{error}</div>}
    </div>
  )
}
