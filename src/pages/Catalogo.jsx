import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CarCard from '../components/CarCard'

const MARCAS = ['Toyota', 'Ford', 'Volkswagen', 'Chevrolet', 'Renault', 'Peugeot', 'Fiat', 'Honda', 'Nissan', 'Jeep', 'Citroën']
const PAGE_SIZE = 24

export default function Catalogo() {
  const { user, concesionaria, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [autos, setAutos] = useState([])
  const [concesionarias, setConcesionarias] = useState([])
  const [loading, setLoading] = useState(true)
  const [favoritoIds, setFavoritoIds] = useState(new Set())
  const [page, setPage] = useState(1)
  const [filtros, setFiltros] = useState({ busqueda: searchParams.get('q') || '', tipo: '', categoria: searchParams.get('categoria') || '', marca: '', precioMin: '', precioMax: '', anioDesde: '', anioHasta: '', concesionaria: '', combustible: '' })

  const esParticular = user && !concesionaria && !isAdmin

  useEffect(() => { document.title = 'Catálogo de vehículos — FIORA.MARKET' }, [])

  useEffect(() => {
    supabase.from('concesionarias').select('id, nombre').eq('aprobada', true).then(({ data }) => setConcesionarias(data || []))
    fetchAutos()
  }, [])

  useEffect(() => {
    if (!user || concesionaria || isAdmin) return
    supabase.from('favoritos').select('auto_id').eq('user_id', user.id)
      .then(({ data }) => setFavoritoIds(new Set(data?.map(f => f.auto_id) || [])))
  }, [user])

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

  function sortByPriority(lista) {
    const planScore = { premium: 1000, pro: 100, basico: 10 }
    return [...lista].sort((a, b) => {
      const sa = (planScore[a.concesionarias?.plan] || 0) + (a.urgente ? 5 : 0) + (a.destacado ? 3 : 0)
      const sb = (planScore[b.concesionarias?.plan] || 0) + (b.urgente ? 5 : 0) + (b.destacado ? 3 : 0)
      if (sb !== sa) return sb - sa
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }

  async function fetchAutos() {
    setLoading(true)
    let q = supabase.from('autos').select('*, concesionarias(nombre, ciudad, plan)').eq('activo', true)
    if (filtros.tipo) q = q.eq('tipo', filtros.tipo)
    if (filtros.categoria) q = q.eq('categoria', filtros.categoria)
    if (filtros.marca) q = q.eq('marca', filtros.marca)
    if (filtros.precioMin) q = q.gte('precio_ars', filtros.precioMin)
    if (filtros.precioMax) q = q.lte('precio_ars', filtros.precioMax)
    if (filtros.anioDesde) q = q.gte('anio', filtros.anioDesde)
    if (filtros.anioHasta) q = q.lte('anio', filtros.anioHasta)
    if (filtros.concesionaria) q = q.eq('concesionaria_id', filtros.concesionaria)
    if (filtros.combustible) q = q.eq('combustible', filtros.combustible)
    if (filtros.busqueda) q = q.or(`marca.ilike.%${filtros.busqueda}%,modelo.ilike.%${filtros.busqueda}%`)
    const { data } = await q
    setAutos(sortByPriority(data || []))
    setPage(1)
    setLoading(false)
  }

  function setF(k, v) { setFiltros(p => ({ ...p, [k]: v })) }

  const totalPages = Math.ceil(autos.length / PAGE_SIZE)
  const autosPagina = autos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function irAPagina(p) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const inputStyle = { width: '100%', background: 'var(--gray1)', border: '1px solid var(--gray2)', color: 'var(--white)', padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none' }
  const chipBase = { padding: '6px 14px', borderRadius: '100px', border: '1px solid var(--gray3)', fontSize: '12px', cursor: 'pointer', transition: 'all .2s', color: 'var(--gray4)', background: 'transparent' }
  const chipActive = { ...chipBase, background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--white)' }

  return (
    <div className="page-wrapper">
      <div style={{ padding: '3rem 4rem 2rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', marginBottom: '.5rem' }}>CATÁLOGO</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gray4)' }}>
          {loading ? 'Cargando...' : `${autos.length} resultado${autos.length !== 1 ? 's' : ''}${totalPages > 1 ? ` · Página ${page} de ${totalPages}` : ''}`}
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        {/* SIDEBAR */}
        <div style={{ width: '280px', flexShrink: 0, borderRight: '1px solid var(--gray2)', padding: '2rem', position: 'sticky', top: '58px', height: 'calc(100vh - 58px)', overflowY: 'auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Búsqueda</div>
            <input style={inputStyle} placeholder="Marca, modelo..." value={filtros.busqueda} onChange={e => setF('busqueda', e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Condición</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['', 'nuevo', 'usado'].map(t => (
                <button key={t} style={filtros.tipo === t ? chipActive : chipBase} onClick={() => setF('tipo', t)}>
                  {t === '' ? 'Todos' : t === 'nuevo' ? 'Nuevo' : 'Usado'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Categoría</div>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={filtros.categoria} onChange={e => setF('categoria', e.target.value)}>
              <option value="">Todas</option>
              <optgroup label="Autos">
                {['SUV','Hatchback','Sedán','Pickup','Minivan','Coupé'].map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
              <optgroup label="Motos">
                {['Naked','Deportiva','Touring','Scooter','Enduro','Custom'].map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
              <optgroup label="Náutica">
                {['Lancha','Velero','Yate','Moto de Agua','Semi-rígido'].map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Marca</div>
            <select style={inputStyle} value={filtros.marca} onChange={e => setF('marca', e.target.value)}>
              <option value="">Todas las marcas</option>
              {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Precio (ARS)</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={inputStyle} placeholder="Mínimo" value={filtros.precioMin} onChange={e => setF('precioMin', e.target.value)} />
              <input style={inputStyle} placeholder="Máximo" value={filtros.precioMax} onChange={e => setF('precioMax', e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Año</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={inputStyle} placeholder="Desde" value={filtros.anioDesde} onChange={e => setF('anioDesde', e.target.value)} />
              <input style={inputStyle} placeholder="Hasta" value={filtros.anioHasta} onChange={e => setF('anioHasta', e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Concesionaria</div>
            <select style={inputStyle} value={filtros.concesionaria} onChange={e => setF('concesionaria', e.target.value)}>
              <option value="">Todas</option>
              {concesionarias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Combustible</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['', 'Nafta', 'Diesel', 'Híbrido', 'Eléctrico'].map(c => (
                <button key={c} style={filtros.combustible === c ? chipActive : chipBase} onClick={() => setF('combustible', c)}>
                  {c === '' ? 'Todos' : c}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={fetchAutos}>Aplicar filtros</button>
          <button className="btn-secondary" style={{ width: '100%', marginTop: '8px' }} onClick={() => { setFiltros({ busqueda:'',tipo:'',categoria:'',marca:'',precioMin:'',precioMax:'',anioDesde:'',anioHasta:'',concesionaria:'',combustible:'' }); setPage(1); setTimeout(fetchAutos, 100) }}>Limpiar</button>
        </div>
        {/* RESULTS */}
        <div style={{ flex: 1, padding: '2rem' }}>
          {loading
            ? <div className="spinner" />
            : autos.length === 0
              ? <p style={{ color: 'var(--gray4)', fontSize: '15px', padding: '2rem 0' }}>No se encontraron autos con esos filtros.</p>
              : <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
                    {autosPagina.map(a => <CarCard key={a.id} auto={a} isFavorito={favoritoIds.has(a.id)} onToggleFavorito={esParticular ? toggleFavorito : undefined} />)}
                  </div>

                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', padding: '2.5rem 0 1rem', flexWrap: 'wrap' }}>
                      <button onClick={() => irAPagina(page - 1)} disabled={page === 1}
                        style={{ padding: '8px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--gray2)', background: 'transparent', color: page === 1 ? 'var(--gray3)' : 'var(--white)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                        ← Anterior
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                        const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1
                        const isDot = !show && (p === 2 && page > 4) || (!show && p === totalPages - 1 && page < totalPages - 3)
                        if (!show && !isDot) return null
                        if (isDot) return <span key={p} style={{ color: 'var(--gray4)', padding: '0 4px' }}>…</span>
                        return (
                          <button key={p} onClick={() => irAPagina(p)}
                            style={{ width: '36px', height: '36px', borderRadius: 'var(--radius)', border: `1px solid ${p === page ? 'var(--accent)' : 'var(--gray2)'}`, background: p === page ? 'var(--accent)' : 'transparent', color: p === page ? 'var(--white)' : 'var(--gray4)', cursor: 'pointer', fontSize: '13px', fontWeight: p === page ? 700 : 400 }}>
                            {p}
                          </button>
                        )
                      })}

                      <button onClick={() => irAPagina(page + 1)} disabled={page === totalPages}
                        style={{ padding: '8px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--gray2)', background: 'transparent', color: page === totalPages ? 'var(--gray3)' : 'var(--white)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                        Siguiente →
                      </button>
                    </div>
                  )}
                </>
          }
        </div>
      </div>
    </div>
  )
}
