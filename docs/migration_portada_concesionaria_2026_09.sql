-- ============================================================
-- MIGRACIÓN: Portada personalizable de concesionaria
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Campos de personalización del hero público (/concesionaria/:id).
-- El fondo compartido vive en /portada-showroom.jpg; portada_url (ya existente)
-- lo pisa cuando la concesionaria sube el suyo.
ALTER TABLE concesionarias
  ADD COLUMN IF NOT EXISTS color_marca              TEXT
    CHECK (color_marca IS NULL OR color_marca ~* '^#[0-9a-f]{6}$'),
  ADD COLUMN IF NOT EXISTS portada_vehiculo_url     TEXT,
  ADD COLUMN IF NOT EXISTS portada_vehiculo_escala  REAL NOT NULL DEFAULT 1
    CHECK (portada_vehiculo_escala BETWEEN 0.4 AND 1.6),
  ADD COLUMN IF NOT EXISTS portada_vehiculo_x       REAL NOT NULL DEFAULT 58
    CHECK (portada_vehiculo_x BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS portada_vehiculo_y       REAL NOT NULL DEFAULT 66
    CHECK (portada_vehiculo_y BETWEEN 0 AND 100);
