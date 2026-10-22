// Formatos de números para precios y kilometraje (es-AR).
export function formatPrecio(n) {
  if (!Number(n)) return 'Consultar'
  return '$' + Number(n).toLocaleString('es-AR')
}

export function formatKm(km) {
  return Number(km) === 0 ? '0 km' : `${Number(km || 0).toLocaleString('es-AR')} km`
}
