-- ════════════════════════════════════════════════════════════════════════
-- CORRECCIÓN DE DATOS: PAGOS DE "RENOVAR" QUE NO RENOVARON — 2026-09-24
-- ════════════════════════════════════════════════════════════════════════
-- Hasta este fix, el webhook de "renovar" sólo actualizaba created_at, pero
-- el cron vence particulares por renovado_at → el aviso vencía igual a los
-- 30 días y, si ya estaba vencido, pagar no lo reactivaba.
--
-- PASO 1 — SÓLO LECTURA. Correr primero y revisar el resultado.
-- ════════════════════════════════════════════════════════════════════════

-- 1a) Particulares afectados: pagaron renovar y su renovado_at quedó viejo.
select a.id, a.marca, a.modelo, a.activo, a.renovado_at, p.ult_pago_renovar,
       p.ult_pago_renovar > now() - interval '30 days' as deberia_estar_activo
from autos a
join (select auto_id, max(created_at) as ult_pago_renovar
      from pagos where tipo = 'renovar' and estado = 'approved'
      group by auto_id) p on p.auto_id = a.id
where a.concesionaria_id is null
  and (a.renovado_at is null or a.renovado_at < p.ult_pago_renovar)
order by p.ult_pago_renovar desc;

-- 1b) Concesionarias que pagaron "renovar" (sus autos nunca vencen: no
--     recibieron nada). Candidatos a reintegro — decisión del dueño.
select p.mp_payment_id, p.created_at, p.monto, c.nombre as concesionaria, a.marca, a.modelo
from pagos p
join autos a on a.id = p.auto_id
left join concesionarias c on c.id = a.concesionaria_id
where p.tipo = 'renovar' and p.estado = 'approved' and a.concesionaria_id is not null
order by p.created_at desc;

-- ════════════════════════════════════════════════════════════════════════
-- PASO 2 — ESCRITURA. Sólo si 1a devolvió filas y los datos se ven bien.
-- Aplica la renovación que se pagó: renovado_at = fecha del último pago, y
-- reactiva los avisos cuyo período pago todavía no terminó.
-- ════════════════════════════════════════════════════════════════════════
-- UPDATE autos a
-- SET renovado_at = p.ult_pago_renovar,
--     activo = CASE WHEN p.ult_pago_renovar > now() - interval '30 days' THEN true ELSE a.activo END
-- FROM (select auto_id, max(created_at) as ult_pago_renovar
--       from pagos where tipo = 'renovar' and estado = 'approved'
--       group by auto_id) p
-- WHERE a.id = p.auto_id
--   AND a.concesionaria_id IS NULL
--   AND (a.renovado_at IS NULL OR a.renovado_at < p.ult_pago_renovar);
