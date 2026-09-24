const ESTADOS = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  in_process: 'En proceso',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reintegrado',
  charged_back: 'Contracargo',
}

export function estadoPago(estado) {
  return ESTADOS[estado] || estado || '—'
}
