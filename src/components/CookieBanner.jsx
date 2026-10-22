import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from './ui/Button'

export default function CookieBanner({ onConsent }) {
  const [visible, setVisible] = useState(() => !localStorage.getItem('cookie_consent'))

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
    onConsent?.(true)
  }

  function reject() {
    localStorage.setItem('cookie_consent', 'rejected')
    setVisible(false)
    onConsent?.(false)
  }

  if (!visible) return null

  return (
    <div className="cookie" role="region" aria-label="Aviso de cookies">
      <p className="cookie__text">
        Usamos cookies para mejorar tu experiencia y analizar el tráfico del sitio.{' '}
        <Link to="/legales">Más información</Link>
      </p>
      <div className="cookie__actions">
        <Button variant="ghost" size="sm" onClick={reject}>Rechazar</Button>
        <Button size="sm" onClick={accept}>Aceptar</Button>
      </div>
    </div>
  )
}
