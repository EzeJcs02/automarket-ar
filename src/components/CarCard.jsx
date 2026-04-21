import { useNavigate } from 'react-router-dom'

export default function CarCard({ auto }) {
  const navigate = useNavigate()
  const foto = auto.fotos?.[0]

  function formatPrice(n) {
    if (!n) return 'Consultar'
    return '$' + Number(n).toLocaleString('es-AR')
  }

  return (
    <div className="car-card" onClick={() => navigate(`/auto/${auto.id}`)}>
      {foto
        ? <img className="car-img-real" src={foto} alt={auto.modelo} />
        : <div className="car-img-placeholder">🚗</div>
      }
      <span className={`car-badge ${auto.tipo === 'nuevo' ? 'badge-new' : 'badge-used'}`}>
        {auto.tipo === 'nuevo' ? 'Nuevo' : 'Usado'}
      </span>
      <div className="car-body">
        <div className="car-brand">{auto.marca}</div>
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
