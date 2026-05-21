// Fuente única de verdad para precios de servicios pagos.
// Importado por mp-create-preference (cobro) y mp-webhook (validación).
// CUALQUIER cambio acá impacta ambos lados — no duplicar.

export const PRECIOS = {
  destacado:                  { monto: 15000, titulo: 'Boost Destacado – FIORA MARKET' },
  urgente:                    { monto: 20000, titulo: 'Boost Urgente – FIORA MARKET' },
  fijado_home:                { monto: 25000, titulo: 'Vehículo Fijado en Home – FIORA MARKET' },
  banner_home:                { monto: 50000, titulo: 'Banner Publicitario en Home – FIORA MARKET' },
  subir_tope:                 { monto: 10000, titulo: 'Subir al tope – FIORA MARKET' },
  destacado_individual:       { monto: 15000, titulo: 'Destacado Individual – FIORA MARKET' },
  urgente_individual:         { monto: 20000, titulo: 'Urgente Individual – FIORA MARKET' },
  renovar:                    { monto: 10000, titulo: 'Renovar publicación – FIORA MARKET' },
  pack_destacados_10:         { monto: 95000, titulo: 'Pack 10 Destacados – FIORA MARKET' },
  publicidad_lateral:         { monto: 15000, titulo: 'Espacio Publicitario Lateral – FIORA MARKET' },
  plan_profesional_base:      { monto: 10000, titulo: 'Plan Profesional Base – FIORA MARKET' },
  plan_profesional_destacado: { monto: 20000, titulo: 'Plan Profesional Destacado – FIORA MARKET' },
}
