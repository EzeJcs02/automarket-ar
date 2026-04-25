export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  const sbHeaders = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  const RESEND_KEY = process.env.RESEND_API_KEY

  if (!RESEND_KEY) return res.status(200).json({ ok: false, reason: 'no-resend-key' })

  // Autos publicados en las últimas 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const autosRes = await fetch(
    `${supabaseUrl}/rest/v1/autos?activo=eq.true&created_at=gte.${since}&select=id,marca,modelo,anio,kilometraje,precio_ars,combustible,tipo,categoria,concesionaria_id,concesionarias(nombre,ciudad)`,
    { headers: sbHeaders }
  )
  const nuevosAutos = await autosRes.json()
  if (!Array.isArray(nuevosAutos) || nuevosAutos.length === 0) return res.status(200).json({ ok: true, enviados: 0 })

  // Traer todas las alertas activas
  const alertasRes = await fetch(`${supabaseUrl}/rest/v1/alertas_busqueda?select=*`, { headers: sbHeaders })
  const alertas = await alertasRes.json()
  if (!Array.isArray(alertas) || alertas.length === 0) return res.status(200).json({ ok: true, enviados: 0 })

  let enviados = 0

  for (const alerta of alertas) {
    const f = alerta.filtros || {}
    const coincidentes = nuevosAutos.filter(a => {
      if (f.tipo && a.tipo !== f.tipo) return false
      if (f.marca && a.marca?.toLowerCase() !== f.marca.toLowerCase()) return false
      if (f.categoria && a.categoria !== f.categoria) return false
      if (f.combustible && a.combustible !== f.combustible) return false
      if (f.precioMax && Number(a.precio_ars) > Number(f.precioMax)) return false
      if (f.precioMin && Number(a.precio_ars) < Number(f.precioMin)) return false
      if (f.anioDesde && Number(a.anio) < Number(f.anioDesde)) return false
      if (f.anioHasta && Number(a.anio) > Number(f.anioHasta)) return false
      if (f.busqueda) {
        const q = f.busqueda.toLowerCase()
        if (!a.marca?.toLowerCase().includes(q) && !a.modelo?.toLowerCase().includes(q)) return false
      }
      return true
    })

    if (coincidentes.length === 0) continue

    const listHtml = coincidentes.map(a => `
      <div style="border:1px solid #222;border-radius:8px;padding:16px;margin-bottom:12px">
        <div style="font-size:16px;font-weight:700;color:#f5f3ee">${a.marca} ${a.modelo} ${a.anio}</div>
        <div style="font-size:13px;color:#888;margin-top:4px">${a.tipo === 'nuevo' ? 'Nuevo' : 'Usado'} · ${Number(a.kilometraje).toLocaleString('es-AR')} km · ${a.combustible || ''}</div>
        ${Number(a.precio_ars) > 0 ? `<div style="font-size:18px;font-weight:700;color:#e63329;margin-top:8px">$${Number(a.precio_ars).toLocaleString('es-AR')}</div>` : ''}
        ${a.concesionarias ? `<div style="font-size:12px;color:#666;margin-top:4px">${a.concesionarias.nombre} · ${a.concesionarias.ciudad || ''}</div>` : ''}
        <a href="https://fioramarket.store/auto/${a.id}" style="display:inline-block;margin-top:12px;background:#e63329;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold">Ver vehículo →</a>
      </div>`).join('')

    const resumen = Object.entries(f)
      .filter(([, v]) => v)
      .map(([k, v]) => ({ tipo: 'Condición', marca: 'Marca', categoria: 'Categoría', combustible: 'Combustible', precioMin: 'Precio mín', precioMax: 'Precio máx', anioDesde: 'Año desde', anioHasta: 'Año hasta', busqueda: 'Búsqueda' }[k] ? `${({ tipo: 'Condición', marca: 'Marca', categoria: 'Categoría', combustible: 'Combustible', precioMin: 'Precio mín', precioMax: 'Precio máx', anioDesde: 'Año desde', anioHasta: 'Año hasta', busqueda: 'Búsqueda' }[k])}: ${v}` : null))
      .filter(Boolean).join(' · ')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'FIORA MARKET <noreply@fioramarket.store>',
        to: alerta.email,
        subject: `${coincidentes.length} vehículo${coincidentes.length > 1 ? 's' : ''} nuevo${coincidentes.length > 1 ? 's' : ''} que te puede${coincidentes.length > 1 ? 'n' : ''} interesar`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0a0a;color:#f5f3ee;border-radius:12px;overflow:hidden">
            <div style="background:#e63329;padding:20px 28px">
              <div style="font-size:20px;font-weight:900;letter-spacing:.05em">FIORA MARKET</div>
              <div style="font-size:12px;opacity:.8;margin-top:2px">Alerta de búsqueda</div>
            </div>
            <div style="padding:28px">
              <div style="font-size:20px;font-weight:700;margin-bottom:6px">${coincidentes.length} vehículo${coincidentes.length > 1 ? 's' : ''} nuevo${coincidentes.length > 1 ? 's' : ''} que coincide${coincidentes.length > 1 ? 'n' : ''} con tu alerta</div>
              ${resumen ? `<div style="font-size:12px;color:#666;margin-bottom:20px">Filtros: ${resumen}</div>` : ''}
              ${listHtml}
              <div style="margin-top:20px;padding-top:20px;border-top:1px solid #1a1a1a;display:flex;gap:10px;flex-wrap:wrap">
                <a href="https://fioramarket.store/catalogo" style="font-size:13px;color:#e63329;text-decoration:none">Ver catálogo completo →</a>
                <a href="https://fioramarket.store/mi-cuenta" style="font-size:13px;color:#555;text-decoration:none">Administrar alertas</a>
              </div>
            </div>
          </div>`,
      }),
    })
    enviados++
  }

  res.status(200).json({ ok: true, enviados, autos_nuevos: nuevosAutos.length })
}
