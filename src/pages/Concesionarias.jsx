import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Skeleton, PanelSkeleton, EmptyState } from '../components/Estados'
import { useAuth } from '../context/AuthContext'
import { setPageMeta, resetMeta } from '../lib/seo'
import { GuiaBoton } from '../components/GuiaModal'
import { ConcesionariaPortada } from '../components/ConcesionariaPortada'
import CarCard from '../components/CarCard'
import DealerCard from '../components/DealerCard'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Icon from '../components/ui/Icon'
import { colorDe, FONDO_SHOWROOM_DEFAULT } from '../lib/marca'
import './Concesionarias.css'

export function Concesionarias() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    setPageMeta({ title: 'Concesionarias', description: 'Encontrá la concesionaria ideal. Red de agencias verificadas en toda Argentina con catálogo online, reseñas y contacto directo.', path: '/concesionarias' })
    supabase
      .from('concesionarias')
      .select('*, autos(count)')
      .eq('aprobada', true)
      .order('destacada', { ascending: false })
      .order('nombre')
      .then(({ data }) => { setLista(data || []); setLoading(false) })
  }, [])

  const q = busqueda.trim().toLowerCase()
  const filtradas = q
    ? lista.filter(c => c.nombre?.toLowerCase().includes(q) || c.ciudad?.toLowerCase().includes(q))
    : lista

  const destacadas = filtradas.filter(c => c.destacada)
  const resto = filtradas.filter(c => !c.destacada)

  return (
    <div className="page-wrapper">
      <header className="page-head">
        <div className="page-head__bg" style={{ backgroundImage: `url("${FONDO_SHOWROOM_DEFAULT}")` }} aria-hidden="true" />
        <div className="container page-head__inner">
          <p className="page-head__kicker">Red oficial de agencias</p>
          <h1 className="display-title">Concesionarias</h1>
          <div className="page-head__row">
            <p className="page-head__lead">Agencias verificadas con catálogo online, reseñas reales y contacto directo.</p>
            <GuiaBoton seccion="agencias" />
          </div>
          <div className="conc-buscar">
            <label className="conc-buscar__field">
              <Icon name="search" size={18} />
              <span className="sr-only">Buscar concesionarias por nombre o ciudad</span>
              <input type="search" placeholder="Buscar por nombre o ciudad…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </label>
            {!loading && (
              <p className="conc-buscar__count tabular" role="status">
                {q ? `${filtradas.length} resultado${filtradas.length !== 1 ? 's' : ''}` : `${lista.length} agencia${lista.length !== 1 ? 's' : ''} activa${lista.length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="container conc-listado">
        {loading ? (
          <div className="conc-grid">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} h={232} r="12px" />)}</div>
        ) : filtradas.length === 0 ? (
          <EmptyState
            titulo={lista.length === 0 ? 'Todavía no hay concesionarias registradas' : 'Sin resultados'}
            texto={lista.length === 0 ? undefined : 'Probá con otro nombre o ciudad.'}
            accion={q ? 'Borrar búsqueda' : undefined} onClick={() => setBusqueda('')} />
        ) : (
          <>
            {destacadas.length > 0 && (
              <section className="conc-listado__grupo" aria-labelledby="destacadas-title">
                <h2 id="destacadas-title" className="conc-listado__titulo">Agencias destacadas</h2>
                <ul className="conc-grid">{destacadas.map(c => <li key={c.id}><DealerCard c={c} /></li>)}</ul>
              </section>
            )}
            {resto.length > 0 && (
              <section className="conc-listado__grupo" aria-labelledby="todas-title">
                {destacadas.length > 0
                  ? <h2 id="todas-title" className="conc-listado__titulo">Todas las agencias</h2>
                  : <h2 id="todas-title" className="sr-only">Agencias</h2>}
                <ul className="conc-grid">{resto.map(c => <li key={c.id}><DealerCard c={c} /></li>)}</ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Estrellas({ valor, size = 14 }) {
  return (
    <span className="estrellas" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(n => <Icon key={n} name="star" size={size} filled={n <= valor} strokeWidth={1.5} className={n <= valor ? 'is-on' : ''} />)}
    </span>
  )
}

export function ConcesionariaDetalle() {
  const { user } = useAuth()
  const [c, setC] = useState(null)
  const [autos, setAutos] = useState([])
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [resenaForm, setResenaForm] = useState({ nombre: '', rating: 5, comentario: '' })
  const [resenaEnviando, setResenaEnviando] = useState(false)
  const [resenaOk, setResenaOk] = useState(false)
  const [resenaError, setResenaError] = useState('')

  const { id } = useParams()

  useEffect(() => {
    supabase.from('concesionarias').select('*').eq('id', id).single().then(({ data }) => {
      setC(data)
      if (data) {
        setPageMeta({
          title: data.nombre,
          description: `${data.nombre} en ${data.ciudad || 'Argentina'}. ${data.descripcion?.slice(0, 120) || 'Catálogo online de vehículos nuevos y usados.'}`,
          image: data.logo_url || data.portada_url || undefined,
          path: `/concesionaria/${data.id}`,
        })
      }
    })
    supabase.from('autos').select('*').eq('concesionaria_id', id).eq('activo', true).then(({ data }) => {
      setAutos(data || [])
      setLoading(false)
    })
    supabase.from('resenas').select('*').eq('concesionaria_id', id).order('created_at', { ascending: false }).then(({ data }) => setResenas(data || []))
    return () => resetMeta()
  }, [id])

  async function enviarResena(e) {
    e.preventDefault()
    if (!resenaForm.nombre.trim() || !resenaForm.comentario.trim()) return
    setResenaEnviando(true)
    setResenaError('')
    const { error } = await supabase.from('resenas').insert({
      concesionaria_id: id,
      user_id: user?.id || null,
      nombre: resenaForm.nombre.trim(),
      rating: resenaForm.rating,
      comentario: resenaForm.comentario.trim(),
    })
    setResenaEnviando(false)
    if (error) {
      setResenaError('No se pudo publicar la reseña. Intentá nuevamente.')
      return
    }
    setResenaOk(true)
    setResenaForm({ nombre: '', rating: 5, comentario: '' })
    const { data } = await supabase.from('resenas').select('*').eq('concesionaria_id', id).order('created_at', { ascending: false })
    setResenas(data || [])
  }

  const promedioRating = resenas.length > 0 ? (resenas.reduce((s, r) => s + r.rating, 0) / resenas.length).toFixed(1) : null

  if (loading) return <div className="page-wrapper"><div className="container conc-estado"><PanelSkeleton stats={0} filas={4} /></div></div>
  if (!c) return <div className="page-wrapper"><div className="container conc-estado"><EmptyState titulo="Concesionaria no encontrada" texto="Puede que ya no esté disponible en FIORA MARKET." accion="Ver concesionarias" to="/concesionarias" /></div></div>

  return (
    <div className="page-wrapper">
      <div className="container">
        <Link to="/concesionarias" className="conc-volver"><Icon name="arrowLeft" size={16} />Concesionarias</Link>
      </div>

      {/* PORTADA PERSONALIZABLE */}
      <ConcesionariaPortada key={c.id} c={c} onUpdate={datos => setC(prev => ({ ...prev, ...datos }))} />

      {/* DATOS DE CONTACTO + MÉTRICAS */}
      <div className="conc-datos responsive-section">
        <div className="conc-datos__contacto">
          {(c.direccion || c.ciudad) && (
            <div className="conc-datos__dir">
              <Icon name="pin" size={15} style={{ color: colorDe(c) }} />
              {[c.direccion, c.ciudad].filter(Boolean).join(', ')}
            </div>
          )}
          {c.descripcion && <p className="conc-datos__desc">{c.descripcion}</p>}
          <div className="conc-datos__btns">
            {c.whatsapp && (
              <a className="conc-chip conc-chip--wa" target="_blank" rel="noopener noreferrer"
                href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola! Vi su concesionaria en FIORA MARKET')}`}>
                <Icon name="whatsapp" size={15} />WhatsApp
              </a>
            )}
            {c.telefono && (
              <a className="conc-chip" href={`tel:${c.telefono}`}>
                <Icon name="phone" size={15} style={{ color: colorDe(c) }} />
                <span className="tabular">{c.telefono}</span>
              </a>
            )}
            {c.email && (
              <a className="conc-chip" href={`mailto:${c.email}`}>
                <Icon name="mail" size={15} style={{ color: colorDe(c) }} />
                {c.email}
              </a>
            )}
          </div>
        </div>

        <div className="conc-datos__metricas">
          <div>
            <div className="conc-metrica__n tabular">{autos.length}</div>
            <div className="conc-metrica__l">Publicados</div>
          </div>
          <div>
            <div className="conc-metrica__n tabular">{autos.filter(a => a.tipo === 'nuevo').length}</div>
            <div className="conc-metrica__l">Nuevos</div>
          </div>
          <div>
            <div className="conc-metrica__n tabular">{autos.filter(a => a.tipo === 'usado').length}</div>
            <div className="conc-metrica__l">Usados</div>
          </div>
          {promedioRating && (
            <div>
              <div className="conc-metrica__n conc-metrica__n--rating tabular">{promedioRating}<Icon name="star" size={22} filled /></div>
              <div className="conc-metrica__l">{resenas.length} reseña{resenas.length !== 1 ? 's' : ''}</div>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        {/* STOCK */}
        <section className="conc-sec" aria-labelledby="stock-title">
          <h2 id="stock-title" className="section-head__title conc-sec__title">Stock disponible</h2>
          {autos.length === 0
            ? <p className="conc-vacio">Esta concesionaria no tiene vehículos publicados todavía.</p>
            : <div className="vgrid">{autos.map(a => <CarCard key={a.id} auto={a} />)}</div>}
        </section>

        {/* RESEÑAS */}
        <section className="conc-sec resenas" aria-labelledby="resenas-title">
          <div className="resenas__col">
            <h2 id="resenas-title" className="section-head__title conc-sec__title">Reseñas</h2>
            {promedioRating && (
              <div className="resenas__resumen">
                <strong className="tabular">{promedioRating}</strong>
                <div><Estrellas valor={Math.round(Number(promedioRating))} size={16} /><span>{resenas.length} opinión{resenas.length !== 1 ? 'es' : ''}</span></div>
              </div>
            )}
            {resenas.length === 0
              ? <p className="conc-vacio">Todavía no hay reseñas. Contá tu experiencia y ayudá a otros compradores.</p>
              : <ul className="resenas__lista">
                  {resenas.map(r => (
                    <li key={r.id} className="resena surface">
                      <div className="resena__head">
                        <div>
                          <strong>{r.nombre}</strong>
                          <Estrellas valor={r.rating} />
                        </div>
                        <time className="tabular" dateTime={r.created_at}>{new Date(r.created_at).toLocaleDateString('es-AR')}</time>
                      </div>
                      {r.comentario && <p>{r.comentario}</p>}
                    </li>
                  ))}
                </ul>}
          </div>

          <div className="resenas__form-col">
            {resenaOk ? (
              <div className="resena-form surface" role="status">
                <h3 className="resena-form__title">¡Gracias por tu reseña!</h3>
                <p className="conc-vacio">Ya está publicada y ayuda a otros compradores a decidir.</p>
              </div>
            ) : (
              <form className="resena-form surface" onSubmit={enviarResena}>
                <h3 className="resena-form__title">Dejá tu reseña</h3>
                <Field label="Tu nombre">
                  <input value={resenaForm.nombre} maxLength={200} placeholder="Juan Pérez" autoComplete="name"
                    onChange={e => setResenaForm(p => ({ ...p, nombre: e.target.value }))} />
                </Field>
                <fieldset className="rating">
                  <legend className="field__label">Puntuación</legend>
                  <div className="rating__stars">
                    {[1, 2, 3, 4, 5].map(n => (
                      <label key={n} className={`rating__star ${n <= resenaForm.rating ? 'is-on' : ''}`}>
                        <input type="radio" name="rating" value={n} checked={resenaForm.rating === n}
                          onChange={() => setResenaForm(p => ({ ...p, rating: n }))} className="sr-only" />
                        <Icon name="star" size={26} filled={n <= resenaForm.rating} strokeWidth={1.5} />
                        <span className="sr-only">{n} estrella{n > 1 ? 's' : ''}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Field label="Comentario">
                  <textarea value={resenaForm.comentario} maxLength={2000} placeholder="Contá tu experiencia…" rows={4}
                    onChange={e => setResenaForm(p => ({ ...p, comentario: e.target.value }))} />
                </Field>
                {resenaError && <p className="field__error" role="alert"><Icon name="alert" size={14} />{resenaError}</p>}
                <Button type="submit" disabled={resenaEnviando || !resenaForm.nombre.trim() || !resenaForm.comentario.trim()}>
                  {resenaEnviando ? 'Publicando…' : 'Publicar reseña'}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
