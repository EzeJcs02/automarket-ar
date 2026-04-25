import { useNavigate } from 'react-router-dom'
import { useComparador } from '../context/ComparadorContext'

export default function CarCard({ auto, isFavorito = false, onToggleFavorito }) {
  const navigate = useNavigate()
  const { agregar, quitar, estaEnLista, lista } = useComparador()
  const enComparador = estaEnLista(auto.id)
  const foto = auto.fotos?.[0]
  const plan = auto.concesionarias?.plan
  const esVerificada = plan === 'premium'

  function formatPrice(n) {
    if (!n) return 'Consultar'
    return '$' + Number(n).toLocaleString('es-AR')
  }

  return (
    <div className="car-card" onClick={() => navigate(`/auto/${auto.id}`)} style={{ position: 'relative' }}>
      {/* BADGES DE BOOST */}
      {auto.urgente && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, background: 'var(--accent)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', letterSpacing: '.1em' }}>
          URGENTE
        </div>
      )}
      {!auto.urgente && auto.destacado && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, background: '#c9a84c', color: '#000', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', letterSpacing: '.1em' }}>
          DESTACADO
        </div>
      )}

      {/* BOTÓN FAVORITO */}
      {onToggleFavorito && (
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorito(auto.id) }}
          style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, background: isFavorito ? 'var(--accent)' : 'rgba(0,0,0,.55)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', transition: 'all .2s', backdropFilter: 'blur(4px)' }}
          title={isFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
          {isFavorito ? '♥' : '♡'}
        </button>
      )}

      {/* BOTÓN COMPARADOR */}
      <button
        onClick={e => { e.stopPropagation(); enComparador ? quitar(auto.id) : agregar(auto) }}
        disabled={!enComparador && lista.length >= 3}
        title={enComparador ? 'Quitar del comparador' : lista.length >= 3 ? 'Comparador lleno (máx. 3)' : 'Agregar al comparador'}
        style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 10, background: enComparador ? 'var(--accent)' : 'rgba(0,0,0,.55)', border: 'none', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: !enComparador && lista.length >= 3 ? 'not-allowed' : 'pointer', fontSize: '10px', color: '#fff', fontWeight: 700, letterSpacing: '.05em', backdropFilter: 'blur(4px)', opacity: !enComparador && lista.length >= 3 ? 0.4 : 1, transition: 'all .2s' }}>
        ⇄ {enComparador ? 'EN COMP.' : 'COMPARAR'}
      </button>

      {foto
        ? <img className="car-img-real" src={foto} alt={`${auto.marca} ${auto.modelo} ${auto.anio}`} loading="lazy" decoding="async" style={{ outline: auto.urgente ? '2px solid var(--accent)' : auto.destacado ? '2px solid #c9a84c' : 'none' }} />
        : <div className="car-img-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".3"><path d="M5 17H3a2 2 0 01-2-2v-4l2.5-6h13L19 11v4a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg></div>
      }

      <span className={`car-badge ${auto.tipo === 'nuevo' ? 'badge-new' : 'badge-used'}`}>
        {auto.tipo === 'nuevo' ? 'Nuevo' : 'Usado'}
      </span>

      <div className="car-body">
        <div className="car-brand" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {auto.marca}
          {esVerificada && (
            <span title="Agencia Verificada" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, background: 'rgba(230,51,41,.1)', padding: '2px 7px', borderRadius: '100px', border: '1px solid rgba(230,51,41,.3)' }}>✓ Verificada</span>
          )}
        </div>
        <div className="car-name">{auto.modelo}</div>
        <div className="car-specs">
          <span>{auto.anio}</span>
          <span>{auto.kilometraje === 0 ? '0 km' : `${Number(auto.kilometraje).toLocaleString('es-AR')} km`}</span>
          {auto.combustible && <span>{auto.combustible}</span>}
        </div>
        <div className="car-price">{formatPrice(auto.precio_ars)}</div>
        {auto.concesionarias?.nombre && (
          <div className="car-dealer">{auto.concesionarias.nombre} · {auto.concesionarias.ciudad}</div>
        )}
      </div>
    </div>
  )
}
