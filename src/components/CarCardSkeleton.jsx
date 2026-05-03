export default function CarCardSkeleton() {
  return (
    <div className="skeleton-card" style={{ position: 'relative' }}>
      <div className="skeleton skeleton-img" />
      <div style={{ padding: '1.25rem' }}>
        <div className="skeleton skeleton-text-sm" style={{ marginBottom: '12px' }} />
        <div className="skeleton skeleton-text-lg" style={{ marginBottom: '8px' }} />
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '12px' }}>
          <div className="skeleton skeleton-text-sm" style={{ width: '40px' }} />
          <div className="skeleton skeleton-text-sm" style={{ width: '50px' }} />
        </div>
        <div className="skeleton skeleton-text" style={{ width: '50%', height: '24px' }} />
      </div>
    </div>
  )
}
