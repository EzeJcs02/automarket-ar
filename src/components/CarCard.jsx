import { useNavigate } from 'react-router-dom'

export default function CarCard({ auto, isFavorito = false, onToggleFavorito }) {
  const navigate = useNavigate()
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
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, background: 'var(--accent)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', letterSpacing: '.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          🔥 URGENTE
        </div>
      )}
      {!auto.urgente && auto.destacado && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, background: '#c9a84c', color: '#000', fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '100px', letterSpacing: '.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⭐ DESTACADO
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

      {foto
        ? <img className="car-img-real" src={foto} alt={auto.modelo} style={{ outline: auto.urgente ? '2px solid var(--accent)' : auto.destacado ? '2px solid #c9a84c' : 'none' }} />
        : <div className="car-img-placeholder">🚗</div>
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
