/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Registro de cada query final contra la tabla `autos` (se llena cuando el
// código bajo test llama a .range(), que es como Catalogo.jsx cierra la query).
const autosCalls = []

vi.mock('../../lib/supabase', () => {
  function makeChain(table) {
    const filtros = []
    const chain = {
      select: () => chain,
      eq: (col, val) => { filtros.push(['eq', col, val]); return chain },
      gte: (col, val) => { filtros.push(['gte', col, val]); return chain },
      lte: (col, val) => { filtros.push(['lte', col, val]); return chain },
      or: (expr) => { filtros.push(['or', expr]); return chain },
      ilike: (col, val) => { filtros.push(['ilike', col, val]); return chain },
      order: () => chain,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      range: (from, to) => {
        if (table === 'autos') autosCalls.push({ filtros, from, to })
        return Promise.resolve({ data: [], count: 0, error: null })
      },
      // patrón `.then(cb)` usado para las queries que no usan .range()
      then: (resolve) => resolve({ data: [], error: null }),
    }
    return chain
  }
  return { supabase: { from: (table) => makeChain(table) } }
})

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, concesionaria: null, isAdmin: false, loading: false }),
}))

import Catalogo from '../Catalogo.jsx'

function renderCatalogo() {
  return render(
    <MemoryRouter initialEntries={['/catalogo']}>
      <Catalogo />
    </MemoryRouter>
  )
}

describe('Catalogo — botón Limpiar', () => {
  beforeEach(() => {
    autosCalls.length = 0
  })

  it('vuelve a pedir la lista de autos sin ningún filtro aplicado', async () => {
    const user = userEvent.setup()
    renderCatalogo()

    // Esperar a que termine la carga inicial (efecto de montaje).
    await waitFor(() => expect(autosCalls.length).toBeGreaterThan(0))

    // Aplicar un filtro de condición y confirmarlo.
    await user.click(screen.getByRole('button', { name: 'Nuevo' }))
    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }))

    await waitFor(() => {
      const ultima = autosCalls[autosCalls.length - 1]
      expect(ultima.filtros).toContainEqual(['eq', 'tipo', 'nuevo'])
    })

    // Limpiar: la siguiente query a `autos` no debe tener el filtro de tipo
    // (este es exactamente el bug: fetchAutos usaba la clausura vieja de
    // `filtros` en vez de los valores recién limpiados).
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))

    await waitFor(() => {
      const ultima = autosCalls[autosCalls.length - 1]
      expect(ultima.filtros).not.toContainEqual(['eq', 'tipo', 'nuevo'])
    })
  })
})
