import { useEffect } from 'react'
import './Reveal.css'

// Umbral de activación: 0.15 = se anima cuando asoma el 15% del elemento
const THRESHOLD = 0.15
// Margen del viewport: valores negativos hacen que dispare un poco más tarde
const ROOT_MARGIN = '0px 0px -5% 0px'
// Máximo de elementos con retraso creciente en un grupo escalonado
const MAX_STAGGER_ITEMS = 8

// eslint-disable-next-line react-refresh/only-export-components
export function useScrollReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]:not(.is-visible), [data-reveal-stagger]:not(.is-visible)')

    els.forEach(el => {
      if (el.hasAttribute('data-reveal-stagger')) {
        Array.from(el.children).forEach((child, i) => child.style.setProperty('--i', Math.min(i, MAX_STAGGER_ITEMS)))
      }
    })

    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-visible'))
      return
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        // Dejar de observar = la animación ocurre solo la primera vez.
        // Para repetirla cada vez, quitá esta línea y remové 'is-visible' cuando isIntersecting sea false.
        io.unobserve(entry.target)
      })
    }, { threshold: THRESHOLD, rootMargin: ROOT_MARGIN })

    els.forEach(el => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// eslint-disable-next-line no-unused-vars
export function RevealTitle({ as: Tag = 'h2', children, ...rest }) {
  return (
    <Tag data-reveal="title" {...rest}>
      <span className="reveal-mask"><span className="reveal-mask__inner">{children}</span></span>
    </Tag>
  )
}
