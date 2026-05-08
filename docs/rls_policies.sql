-- Aislar actualizaciones de autos por concesionaria
CREATE POLICY "Concesionarias editan sus propios autos" ON autos
  FOR UPDATE
  USING (
    concesionaria_id IN (
      SELECT id FROM concesionarias WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Aislamiento de consultas/leads
CREATE POLICY "Concesionarias ven sus propias consultas" ON consultas
  FOR SELECT
  USING (
    concesionaria_id IN (
      SELECT id FROM concesionarias WHERE user_id = auth.uid()
    )
  );
