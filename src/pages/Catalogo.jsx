import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CarCard from '../components/CarCard'

const MARCAS = ['Toyota', 'Ford', 'Volkswagen', 'Chevrolet', 'Renault', 'Peugeot', 'Fiat', 'Honda', 'Nissan', 'Jeep', 'Citroën']

export default function Catalogo() {
  const [autos, setAutos] = useState([])
  const [concesionarias, setConcesionarias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ busqueda: '', tipo: '', marca: '', precioMin: '', precioMax: '', anioDesde: '', anioHasta: '', concesionaria: '', combustible: '' })

  useEffect(() => {
    supabase.from('concesionarias').select('id, nombre').eq('aprobada', true).then(({ data }) => setConcesionarias(data || []))
    fetchAutos()
  }, [])

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
    setLoading(false)
  }

  function setF(k, v) { setFiltros(p => ({ ...p, [k]: v })) }

  const inputStyle = { width: '100%', background: 'var(--gray1)', border: '1px solid var(--gray2)', color: 'var(--white)', padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: '14px', outline: 'none' }
  const chipBase = { padding: '6px 14px', borderRadius: '100px', border: '1px solid var(--gray3)', fontSize: '12px', cursor: 'pointer', transition: 'all .2s', color: 'var(--gray4)', background: 'transparent' }
  const chipActive = { ...chipBase, background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--white)' }

  return (
    <div className="page-wrapper">
      <div style={{ padding: '3rem 4rem 2rem', borderBottom: '1px solid var(--gray2)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', marginBottom: '.5rem' }}>CATÁLOGO</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--gray4)' }}>
          {loading ? 'Cargando...' : `${autos.length} resultado${autos.length !== 1 ? 's' : ''}`}
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
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.12em', color: 'var(--gray4)', textTransform: 'uppercase', marginBottom: '.75rem' }}>Tipo</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['', 'nuevo', 'usado'].map(t => (
                <button key={t} style={filtros.tipo === t ? chipActive : chipBase} onClick={() => setF('tipo', t)}>
                  {t === '' ? 'Todos' : t === 'nuevo' ? 'Nuevo' : 'Usado'}
                </button>
              ))}
            </div>
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
          <button className="btn-secondary" style={{ width: '100%', marginTop: '8px' }} onClick={() => { setFiltros({ busqueda:'',tipo:'',marca:'',precioMin:'',precioMax:'',anioDesde:'',anioHasta:'',concesionaria:'',combustible:'' }); setTimeout(fetchAutos, 100) }}>Limpiar</button>
        </div>
        {/* RESULTS */}
        <div style={{ flex: 1, padding: '2rem' }}>
          {loading
            ? <div className="spinner" />
            : autos.length === 0
              ? <p style={{ color: 'var(--gray4)', fontSize: '15px', padding: '2rem 0' }}>No se encontraron autos con esos filtros.</p>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1.5px', background: 'var(--gray2)' }}>
                  {autos.map(a => <CarCard key={a.id} auto={a} />)}
                </div>
          }
        </div>
      </div>
    </div>
  )
}
