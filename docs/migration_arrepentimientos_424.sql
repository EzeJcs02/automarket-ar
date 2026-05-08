-- ============================================================
-- MIGRACIÓN: Tabla arrepentimientos — Res. 424/2020 compliance
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Hallazgo 3: agregar campos auditables para seguimiento de solicitudes
ALTER TABLE arrepentimientos
  ADD COLUMN IF NOT EXISTS fecha_operacion       DATE,
  ADD COLUMN IF NOT EXISTS estado                TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto', 'rechazado')),
  ADD COLUMN IF NOT EXISTS monto_pagado          NUMERIC,
  ADD COLUMN IF NOT EXISTS ip_solicitante        TEXT,
  ADD COLUMN IF NOT EXISTS fecha_limite_resolucion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resuelto_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notas_admin           TEXT;

-- Índice para filtrar por estado en el panel de admin
CREATE INDEX IF NOT EXISTS idx_arrepentimientos_estado
  ON arrepentimientos (estado);

-- Índice para alertas de vencimiento de plazo
CREATE INDEX IF NOT EXISTS idx_arrepentimientos_fecha_limite
  ON arrepentimientos (fecha_limite_resolucion)
  WHERE estado NOT IN ('resuelto', 'rechazado');

-- Vista opcional para auditoría: solicitudes próximas a vencer (en 2 días hábiles)
CREATE OR REPLACE VIEW arrepentimientos_por_vencer AS
SELECT
  id, nombre, email, nro_operacion,
  estado, created_at, fecha_limite_resolucion,
  fecha_limite_resolucion - NOW() AS tiempo_restante
FROM arrepentimientos
WHERE
  estado NOT IN ('resuelto', 'rechazado')
  AND fecha_limite_resolucion <= NOW() + INTERVAL '2 days'
ORDER BY fecha_limite_resolucion ASC;
