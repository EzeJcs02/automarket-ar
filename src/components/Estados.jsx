import { Link } from 'react-router-dom'

export function Skeleton({ w = '100%', h = 14, r, style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

// Estructura genérica de panel: título, tarjetas de números y filas de tabla.
export function PanelSkeleton({ stats = 4, filas = 6 }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <Skeleton w="40%" h={34} style={{ marginBottom: 10 }} />
      <Skeleton w="25%" h={14} style={{ marginBottom: '2rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {Array.from({ length: stats }, (_, i) => <Skeleton key={i} h={86} r="12px" />)}
      </div>
      {Array.from({ length: filas }, (_, i) => <Skeleton key={i} h={48} style={{ marginBottom: 6 }} />)}
    </div>
  )
}

// Ficha de detalle: foto grande + columna de datos.
export function DetalleSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="autodetalle-layout" style={{ padding: '2rem 0' }}>
      <span className="sr-only">Cargando…</span>
      <Skeleton h="clamp(200px, 45vw, 450px)" r="12px" />
      <div>
        <Skeleton w="30%" h={12} style={{ marginBottom: 12 }} />
        <Skeleton w="80%" h={36} style={{ marginBottom: 16 }} />
        <Skeleton w="50%" h={28} style={{ marginBottom: 24 }} />
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} h={16} style={{ marginBottom: 10 }} />)}
      </div>
    </div>
  )
}

export function ErrorState({ texto = 'No pudimos cargar la información. Revisá tu conexión.', onRetry }) {
  return (
    <div className="estado-box" role="alert">
      <div className="estado-box__titulo">Algo salió mal</div>
      <p className="estado-box__texto">{texto}</p>
      {onRetry && <button className="btn-secondary" onClick={onRetry}>Reintentar</button>}
    </div>
  )
}

export function EmptyState({ titulo, texto, accion, to, onClick }) {
  return (
    <div className="estado-box">
      <div className="estado-box__titulo">{titulo}</div>
      {texto && <p className="estado-box__texto">{texto}</p>}
      {accion && to && <Link to={to} className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>{accion}</Link>}
      {accion && onClick && <button className="btn-primary" onClick={onClick}>{accion}</button>}
    </div>
  )
}
