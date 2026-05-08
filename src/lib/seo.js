const BASE_URL = 'https://fioramarket.store'
const DEFAULT_IMG = `${BASE_URL}/og-image.jpg`

export function setMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    property.startsWith('og:') || property.startsWith('twitter:')
      ? el.setAttribute('property', property)
      : el.setAttribute('name', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function setCanonical(path) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el) }
  el.setAttribute('href', `${BASE_URL}${path}`)
}

export function setPageMeta({ title, description, image, path }) {
  const t = title ? `${title} — FIORA MARKET` : 'FIORA MARKET — Vehículos nuevos y usados en Argentina'
  const d = description || 'La plataforma de vehículos más avanzada de Argentina. Autos, motos y náutica de concesionarias verificadas.'
  const img = image || DEFAULT_IMG
  document.title = t
  setMeta('og:title', t)
  setMeta('og:description', d)
  setMeta('og:image', img)
  setMeta('og:url', `${BASE_URL}${path || '/'}`)
  setMeta('twitter:title', t)
  setMeta('twitter:description', d)
  setMeta('twitter:image', img)
  setCanonical(path || '/')
}

export function resetMeta() {
  setPageMeta({})
  document.getElementById('jsonld-auto')?.remove()
}
