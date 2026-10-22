import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'
import CarCardSkeleton from '../components/CarCardSkeleton'
import { setPageMeta } from '../lib/seo'
import { GuiaBoton } from '../components/GuiaModal'
import { EmptyState, ErrorState } from '../components/Estados'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import { CATEGORIAS, GRUPOS } from '../lib/categorias'
import './Catalogo.css'

const MARCAS = ['Toyota', 'Ford', 'Volkswagen', 'Chevrolet', 'Renault', 'Peugeot', 'Fiat', 'Honda', 'Nissan', 'Jeep', 'Citroën']
const KM_MAX = [10000, 30000, 50000, 100000, 150000, 200000]
const PAGE_SIZE = 24
const VACIO = { busqueda: '', tipo: '', categoria: '', marca: '', precioMin: '', precioMax: '', anioDesde: '', anioHasta: '', concesionaria: '', combustible: '', ciudad: '', kmMax: '', transmision: '' }

const soloDigitos = v => v.replace(/\D/g, '')
const miles = v => (v ? Number(v).toLocaleString('es-AR') : '')

function sortByPriority(lista) {
  const planScore = { premium: 1000, pro: 100, basico: 10 }
  return [...lista].sort((a, b) => {
    if (a.urgente !== b.urgente) return (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0)
    if (a.destacado !== b.destacado) return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0)
    const sa = planScore[a.concesionarias?.plan] || 0
    const sb = planScore[b.concesionarias?.plan] || 0
    if (sb !== sa) return sb - sa
    return new Date(b.created_at) - new Date(a.created_at)
  })
}

function applySort(lista, ord) {
  if (ord === 'precio_asc') return [...lista].sort((a, b) => (Number(a.precio_ars) || 0) - (Number(b.precio_ars) || 0))
  if (ord === 'precio_desc') return [...lista].sort((a, b) => (Number(b.precio_ars) || 0) - (Number(a.precio_ars) || 0))
  if (ord === 'anio_desc') return [...lista].sort((a, b) => b.anio - a.anio)
  if (ord === 'anio_asc') return [...lista].sort((a, b) => a.anio - b.anio)
  return sortByPriority(lista)
}

// Texto de cada filtro aplicado, para los chips removibles sobre los resultados
function etiquetaFiltro(k, v, concesionarias) {
  switch (k) {
    case 'busqueda': return `“${v}”`
    case 'tipo': return v === 'nuevo' ? 'Nuevo' : 'Usado'
    case 'precioMin': return `Desde $${miles(v)}`
    case 'precioMax': return `Hasta $${miles(v)}`
    case 'anioDesde': return `Año desde ${v}`
    case 'anioHasta': return `Año hasta ${v}`
    case 'kmMax': return `Hasta ${miles(v)} km`
    case 'concesionaria': return concesionarias.find(c => String(c.id) === String(v))?.nombre || 'Concesionaria'
    default: return v
  }
}

function Grupo({ titulo, children }) {
  return (
    <fieldset className="filtros__grupo">
      <legend className="filtros__legend">{titulo}</legend>
      {children}
    </fieldset>
  )
}

export default function Catalogo() {
  const { user, concesionaria, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [concesionarias, setConcesionarias] = useState([])
  const [loading, setLoading] = useState(true)
  const [favoritoIds, setFavoritoIds] = useState(new Set())
  const [page, setPage] = useState(1)
  const [filtros, setFiltros] = useState({ ...VACIO, busqueda: searchParams.get('q') || '', categoria: searchParams.get('categoria') || '', precioMax: soloDigitos(searchParams.get('precioMax') || '') })
  const [aplicados, setAplicados] = useState(VACIO)
  const [alertaError, setAlertaError] = useState('')
  const [alertaOk, setAlertaOk] = useState(false)
  const [alertaGuardando, setAlertaGuardando] = useState(false)
  const [ordenar, setOrdenar] = useState('relevancia')
  const [cargaError, setCargaError] = useState(false)
  const [autosRaw, setAutosRaw] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const autos = useMemo(() => applySort(autosRaw, ordenar), [autosRaw, ordenar])
  const filtrosActivosCount = Object.values(filtros).filter(Boolean).length
  const chipsAplicados = Object.entries(aplicados).filter(([, v]) => v)

  const esParticular = user && !concesionaria && !isAdmin

  useEffect(() => { setPageMeta({ title: 'Catálogo de vehículos', description: 'Buscá entre miles de autos, motos y náutica nuevos y usados. Filtrá por marca, precio, año, ciudad y más.', path: '/catalogo' }) }, [])

  useEffect(() => {
    supabase.from('concesionarias').select('id, nombre').eq('aprobada', true).then(({ data }) => setConcesionarias(data || []))
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAutos(page) }, [page, ordenar])

  useEffect(() => {
    if (!user || concesionaria || isAdmin) return
    supabase.from('favoritos').select('auto_id').eq('user_id', user.id)
      .then(({ data }) => setFavoritoIds(new Set(data?.map(f => f.auto_id) || [])))
  }, [user, concesionaria, isAdmin])

  // Panel de filtros del celular: Escape cierra y el fondo no scrollea
  useEffect(() => {
    if (!filtrosAbiertos) return
    const onKey = e => { if (e.key === 'Escape') setFiltrosAbiertos(false) }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [filtrosAbiertos])

  async function toggleFavorito(autoId) {
    if (!user) { navigate('/login'); return }
    if (favoritoIds.has(autoId)) {
      await supabase.from('favoritos').delete().eq('user_id', user.id).eq('auto_id', autoId)
      setFavoritoIds(prev => { const s = new Set(prev); s.delete(autoId); return s })
    } else {
      await supabase.from('favoritos').insert({ user_id: user.id, auto_id: autoId })
      setFavoritoIds(prev => new Set([...prev, autoId]))
    }
  }

  async function fetchAutos(targetPage = page, filtrosOverride = filtros) {
    setLoading(true)
    const f = filtrosOverride
    const from = (targetPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    // Si hay filtro de ciudad, usamos !inner para que el JOIN sea obligatorio
    const concSelect = f.ciudad ? 'concesionarias!inner(nombre, ciudad, plan)' : 'concesionarias(nombre, ciudad, plan)'
    let q = supabase.from('autos')
      .select(`*, ${concSelect}`, { count: 'exact' })
      .eq('activo', true)
    if (f.tipo) q = q.eq('tipo', f.tipo)
    if (f.categoria) q = q.eq('categoria', f.categoria)
    if (f.marca) q = q.eq('marca', f.marca)
    if (f.precioMin) q = q.gte('precio_ars', f.precioMin)
    if (f.precioMax) q = q.lte('precio_ars', f.precioMax)
    if (f.anioDesde) q = q.gte('anio', f.anioDesde)
    if (f.anioHasta) q = q.lte('anio', f.anioHasta)
    if (f.concesionaria) q = q.eq('concesionaria_id', f.concesionaria)
    if (f.combustible) q = q.eq('combustible', f.combustible)
    if (f.transmision) q = q.eq('transmision', f.transmision)
    if (f.kmMax) q = q.lte('kilometraje', f.kmMax)
    if (f.busqueda) {
      const safe = f.busqueda.replace(/[%_,()]/g, '\\$&')
      q = q.or(`marca.ilike.%${safe}%,modelo.ilike.%${safe}%`)
    }
    if (f.ciudad) {
      const safe = f.ciudad.replace(/[%_,()]/g, '\\$&')
      q = q.ilike('concesionarias.ciudad', `%${safe}%`)
    }
    if (ordenar === 'precio_asc') q = q.order('precio_ars', { ascending: true, nullsFirst: false })
    else if (ordenar === 'precio_desc') q = q.order('precio_ars', { ascending: false, nullsFirst: false })
    else if (ordenar === 'anio_desc') q = q.order('anio', { ascending: false })
    else if (ordenar === 'anio_asc') q = q.order('anio', { ascending: true })
    else q = q.order('urgente', { ascending: false, nullsFirst: false }).order('destacado', { ascending: false, nullsFirst: false })
    q = q.order('created_at', { ascending: false }).order('id')
    const { data, count, error } = await q.range(from, to)
    setCargaError(!!error)
    setAutosRaw(data || [])
    setTotalCount(count || 0)
    setAplicados(f)
    setLoading(false)
  }

  function aplicarFiltros() {
    if (page === 1) fetchAutos(1)
    else setPage(1)
    if (filtrosAbiertos) {
      setFiltrosAbiertos(false)
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
    }
  }

  function setF(k, v) { setFiltros(p => ({ ...p, [k]: v })) }

  function quitarFiltro(k) {
    const nuevos = { ...filtros, [k]: '' }
    setFiltros(nuevos)
    if (page === 1) fetchAutos(1, nuevos)
    else setPage(1)
  }

  function limpiarFiltros() {
    setFiltros(VACIO)
    if (page === 1 && ordenar === 'relevancia') fetchAutos(1, VACIO)
    setOrdenar('relevancia')
    setPage(1)
  }

  async function guardarAlerta() {
    if (!user) { navigate('/login'); return }
    const filtrosActivos = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
    if (Object.keys(filtrosActivos).length === 0) { setAlertaError('Elegí al menos un filtro para crear la alerta.'); return }
    setAlertaError('')
    setAlertaGuardando(true)
    const { error } = await supabase.from('alertas_busqueda').insert({ email: user.email, filtros: filtrosActivos, user_id: user.id })
    setAlertaGuardando(false)
    if (error) { setAlertaError('No pudimos guardar la alerta. Probá de nuevo.'); return }
    setAlertaOk(true)
    setTimeout(() => setAlertaOk(false), 4000)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  function irAPagina(p) {
    if (p < 1 || p > totalPages) return
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const chips = (k, opciones) => (
    <div className="filtros__chips">
      {opciones.map(([valor, label]) => (
        <button key={valor} type="button" className="chip" aria-pressed={filtros[k] === valor} onClick={() => setF(k, valor)}>{label}</button>
      ))}
    </div>
  )

  return (
    <div className="page-wrapper catalogo">
      <header className="page-head">
        <div className="page-head__bg" style={{ backgroundImage: 'url("/img/portada-catalogo.webp")' }} aria-hidden="true" />
        <div className="container page-head__inner">
          <p className="page-head__kicker">Vehículos nuevos y usados</p>
          <h1 className="display-title">Catálogo</h1>
          <div className="page-head__row">
            <p className="page-head__lead">Autos, motos y náutica de concesionarias verificadas y particulares.</p>
            <GuiaBoton seccion="compradores" />
          </div>
        </div>
      </header>

      <div className="container catalogo__layout">
        {/* FILTROS: columna fija en escritorio, panel deslizable en el celular */}
        <div className={`filtros-backdrop ${filtrosAbiertos ? 'is-open' : ''}`} onClick={() => setFiltrosAbiertos(false)} aria-hidden="true" />
        <aside id="filtros" className={`filtros ${filtrosAbiertos ? 'is-open' : ''}`} aria-label="Filtros">
          <div className="filtros__head">
            <h2>Filtros</h2>
            <button type="button" className="icon-btn filtros__close" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros"><Icon name="close" size={20} /></button>
          </div>

          <div className="filtros__body">
            <Grupo titulo="Búsqueda">
              <input className="input" aria-label="Buscar por marca o modelo" placeholder="Marca, modelo…" value={filtros.busqueda}
                onChange={e => setF('busqueda', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') aplicarFiltros() }} />
            </Grupo>

            <Grupo titulo="Condición">
              {chips('tipo', [['', 'Todos'], ['nuevo', 'Nuevo'], ['usado', 'Usado']])}
            </Grupo>

            <Grupo titulo="Categoría">
              <select className="input" aria-label="Categoría" value={filtros.categoria} onChange={e => setF('categoria', e.target.value)}>
                <option value="">Todas</option>
                {GRUPOS.map(([key, label]) => (
                  <optgroup key={key} label={label}>
                    {CATEGORIAS[key].map(({ tipo }) => <option key={tipo} value={tipo}>{tipo}</option>)}
                  </optgroup>
                ))}
              </select>
            </Grupo>

            <Grupo titulo="Marca">
              <select className="input" aria-label="Marca" value={filtros.marca} onChange={e => setF('marca', e.target.value)}>
                <option value="">Todas las marcas</option>
                {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Grupo>

            <Grupo titulo="Precio (ARS)">
              <div className="filtros__pair">
                <label className="filtros__money">
                  <span>$</span>
                  <input className="input tabular" inputMode="numeric" aria-label="Precio mínimo" placeholder="Mínimo"
                    value={miles(filtros.precioMin)} onChange={e => setF('precioMin', soloDigitos(e.target.value))} />
                </label>
                <label className="filtros__money">
                  <span>$</span>
                  <input className="input tabular" inputMode="numeric" aria-label="Precio máximo" placeholder="Máximo"
                    value={miles(filtros.precioMax)} onChange={e => setF('precioMax', soloDigitos(e.target.value))} />
                </label>
              </div>
            </Grupo>

            <Grupo titulo="Año">
              <div className="filtros__pair">
                <input className="input tabular" inputMode="numeric" maxLength={4} aria-label="Año desde" placeholder="Desde" value={filtros.anioDesde} onChange={e => setF('anioDesde', soloDigitos(e.target.value))} />
                <input className="input tabular" inputMode="numeric" maxLength={4} aria-label="Año hasta" placeholder="Hasta" value={filtros.anioHasta} onChange={e => setF('anioHasta', soloDigitos(e.target.value))} />
              </div>
            </Grupo>

            <Grupo titulo="Kilometraje máximo">
              <select className="input tabular" aria-label="Kilometraje máximo" value={filtros.kmMax} onChange={e => setF('kmMax', e.target.value)}>
                <option value="">Sin límite</option>
                {KM_MAX.map(km => <option key={km} value={km}>Hasta {miles(km)} km</option>)}
              </select>
            </Grupo>

            <Grupo titulo="Combustible">
              {chips('combustible', [['', 'Todos'], ['Nafta', 'Nafta'], ['Diesel', 'Diesel'], ['Híbrido', 'Híbrido'], ['Eléctrico', 'Eléctrico']])}
            </Grupo>

            <Grupo titulo="Transmisión">
              {chips('transmision', [['', 'Todas'], ['Manual', 'Manual'], ['Automática', 'Automática']])}
            </Grupo>

            <Grupo titulo="Concesionaria">
              <select className="input" aria-label="Concesionaria" value={filtros.concesionaria} onChange={e => setF('concesionaria', e.target.value)}>
                <option value="">Todas</option>
                {concesionarias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Grupo>

            <Grupo titulo="Ciudad o localidad">
              <input className="input" aria-label="Ciudad o localidad" placeholder="Ej: Salta, Córdoba…" value={filtros.ciudad}
                onChange={e => setF('ciudad', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') aplicarFiltros() }} />
            </Grupo>

            <div className="alerta">
              <div className="alerta__head"><Icon name="bell" size={16} />Alerta de búsqueda</div>
              <p>Te mandamos un email cuando se publique un vehículo con estos filtros.</p>
              {alertaOk
                ? <p className="alerta__ok" role="status"><Icon name="check" size={14} strokeWidth={2.25} />Alerta guardada</p>
                : <Button variant="secondary" size="sm" block onClick={guardarAlerta} disabled={alertaGuardando}>
                    {alertaGuardando ? 'Guardando…' : user ? 'Guardar alerta' : 'Ingresá para guardar la alerta'}
                  </Button>}
              {alertaError && <p className="field__error" role="alert">{alertaError}</p>}
            </div>
          </div>

          <div className="filtros__foot">
            <Button variant="ghost" onClick={limpiarFiltros}>Limpiar</Button>
            <Button onClick={aplicarFiltros}>Aplicar filtros</Button>
          </div>
        </aside>

        {/* RESULTADOS */}
        <section className="resultados" aria-label="Resultados" aria-busy={loading}>
          <div className="resultados__bar">
            <p className="resultados__count tabular" role="status">
              {loading ? 'Buscando…' : <><strong>{totalCount.toLocaleString('es-AR')}</strong> resultado{totalCount !== 1 ? 's' : ''}{totalPages > 1 ? ` · página ${page} de ${totalPages}` : ''}</>}
            </p>
            <button type="button" className="btn btn--secondary btn--sm resultados__filtros" onClick={() => setFiltrosAbiertos(true)} aria-controls="filtros" aria-expanded={filtrosAbiertos}>
              <Icon name="filter" size={16} />Filtros{filtrosActivosCount > 0 && <span className="resultados__badge tabular">{filtrosActivosCount}</span>}
            </button>
            <label className="resultados__sort">
              <span>Ordenar</span>
              <select className="input" value={ordenar} onChange={e => { setOrdenar(e.target.value); setPage(1) }}>
                <option value="relevancia">Relevancia</option>
                <option value="precio_asc">Menor precio</option>
                <option value="precio_desc">Mayor precio</option>
                <option value="anio_desc">Más nuevos</option>
                <option value="anio_asc">Más antiguos</option>
              </select>
            </label>
          </div>

          {chipsAplicados.length > 0 && (
            <ul className="resultados__chips" aria-label="Filtros aplicados">
              {chipsAplicados.map(([k, v]) => (
                <li key={k}>
                  <button type="button" className="chip is-active" onClick={() => quitarFiltro(k)} aria-label={`Quitar filtro ${etiquetaFiltro(k, v, concesionarias)}`}>
                    {etiquetaFiltro(k, v, concesionarias)}<Icon name="close" size={14} className="chip__x" />
                  </button>
                </li>
              ))}
              <li><button type="button" className="resultados__clear" onClick={limpiarFiltros}>Borrar todo</button></li>
            </ul>
          )}

          {loading
            ? <div className="vgrid">{[1, 2, 3, 4, 5, 6].map(i => <CarCardSkeleton key={i} />)}</div>
            : cargaError
              ? <ErrorState texto="No pudimos cargar los vehículos. Revisá tu conexión." onRetry={() => fetchAutos(page)} />
            : autos.length === 0
              ? <EmptyState titulo="No encontramos vehículos con esos filtros" texto="Probá con menos filtros o limpialos para ver todo el stock." accion={filtrosActivosCount > 0 ? 'Limpiar filtros' : undefined} onClick={limpiarFiltros} />
              : <>
                  <div className="vgrid">
                    {autos.map(a => <CarCard key={a.id} auto={a} isFavorito={favoritoIds.has(a.id)} onToggleFavorito={esParticular ? toggleFavorito : undefined} />)}
                  </div>

                  {totalPages > 1 && (
                    <nav className="paginacion" aria-label="Paginación">
                      <button type="button" className="paginacion__nav" onClick={() => irAPagina(page - 1)} disabled={page === 1}>
                        <Icon name="arrowLeft" size={16} />Anterior
                      </button>
                      <ol>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                          const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1
                          const isDot = (!show && p === 2 && page > 4) || (!show && p === totalPages - 1 && page < totalPages - 3)
                          if (!show && !isDot) return null
                          if (isDot) return <li key={p} className="paginacion__dots" aria-hidden="true">…</li>
                          return (
                            <li key={p}>
                              <button type="button" className="paginacion__num tabular" onClick={() => irAPagina(p)}
                                aria-current={p === page ? 'page' : undefined} aria-label={`Página ${p}`}>{p}</button>
                            </li>
                          )
                        })}
                      </ol>
                      <button type="button" className="paginacion__nav" onClick={() => irAPagina(page + 1)} disabled={page === totalPages}>
                        Siguiente<Icon name="arrowRight" size={16} />
                      </button>
                    </nav>
                  )}
                </>
          }
        </section>
      </div>
    </div>
  )
}
