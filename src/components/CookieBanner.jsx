import { useState } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('cookie_consent'))

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  function reject() {
    localStorage.setItem('cookie_consent', 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
      background: '#111', borderTop: '1px solid var(--gray2)',
      padding: '1rem 2rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap'
    }}>
      <p style={{ fontSize: '13px', color: 'var(--gray4)', margin: 0, flex: 1, minWidth: '220px' }}>
        Usamos cookies para mejorar tu experiencia de navegación y analizar el tráfico.{' '}
        <a href="/legales" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Más información</a>
      </p>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={reject} style={{ background: 'transparent', border: '1px solid var(--gray3)', color: 'var(--gray4)', padding: '8px 18px', borderRadius: 'var(--radius)', fontSize: '12px', cursor: 'pointer' }}>
          Rechazar
        </button>
        <button onClick={accept} className="btn-primary" style={{ padding: '8px 20px', fontSize: '12px' }}>
          Aceptar
        </button>
      </div>
    </div>
  )
}
