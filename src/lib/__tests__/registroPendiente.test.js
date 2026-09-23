import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({ existente: null, insertError: null, updateError: null }))
const calls = vi.hoisted(() => ({ inserts: [], updates: [] }))

vi.mock('../supabase', () => ({
  supabase: {
    from: (tabla) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.existente }) }) }),
      insert: async (fila) => { calls.inserts.push({ tabla, fila }); return { error: state.insertError } },
    }),
    auth: {
      updateUser: async (payload) => { calls.updates.push(payload); return { error: state.updateError } },
    },
  },
}))

const fetchMock = vi.fn(async () => new Response('{}'))
globalThis.fetch = fetchMock

const { completarRegistro } = await import('../registroPendiente.js')

let n = 0
function usuario(pendiente) {
  n += 1
  return { id: `user-${n}`, email: `u${n}@test.com`, user_metadata: pendiente ? { registro_pendiente: pendiente } : {} }
}
const acciones = () => fetchMock.mock.calls.map(c => JSON.parse(c[1].body).action)

beforeEach(() => {
  state.existente = null
  state.insertError = null
  state.updateError = null
  calls.inserts.length = 0
  calls.updates.length = 0
  fetchMock.mockClear()
})

describe('completarRegistro', () => {
  it('no hace nada sin registro pendiente', async () => {
    expect(await completarRegistro(usuario(null))).toBe(false)
    expect(calls.inserts).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ignora un tipo desconocido en la metadata', async () => {
    expect(await completarRegistro(usuario({ tipo: 'admin', nombre: 'x' }))).toBe(false)
    expect(calls.inserts).toHaveLength(0)
  })

  it('concesionaria: crea la fila sin aprobar, limpia la marca y avisa al admin y al usuario', async () => {
    const u = usuario({ tipo: 'concesionaria', nombre: 'Auto SA', responsable: 'Ana', telefono: '1', ciudad: 'Salta' })
    expect(await completarRegistro(u)).toBe(true)
    expect(calls.inserts).toHaveLength(1)
    expect(calls.inserts[0].tabla).toBe('concesionarias')
    expect(calls.inserts[0].fila).toMatchObject({ user_id: u.id, email: u.email, nombre: 'Auto SA', aprobada: false })
    expect(calls.updates).toEqual([{ data: { registro_pendiente: null } }])
    expect(acciones().sort()).toEqual(['admin', 'welcome'])
  })

  it('el email del perfil sale de la sesión, no de la metadata', async () => {
    const u = usuario({ tipo: 'concesionaria', nombre: 'X', email: 'otro@evil.com' })
    await completarRegistro(u)
    expect(calls.inserts[0].fila.email).toBe(u.email)
  })

  it('profesional: crea la fila inactiva y solo avisa al admin', async () => {
    const u = usuario({ tipo: 'profesional', nombre: 'Pedro', categoria: 'mecanico' })
    expect(await completarRegistro(u)).toBe(true)
    expect(calls.inserts[0].tabla).toBe('profesionales')
    expect(calls.inserts[0].fila).toMatchObject({ aprobado: false, activo: false, categoria: 'mecanico' })
    expect(acciones()).toEqual(['admin'])
  })

  it('particular: no inserta nada, solo bienvenida', async () => {
    expect(await completarRegistro(usuario({ tipo: 'particular', nombre: 'Luz' }))).toBe(true)
    expect(calls.inserts).toHaveLength(0)
    expect(acciones()).toEqual(['welcome'])
  })

  it('es idempotente: dos llamadas concurrentes crean una sola fila y un solo aviso', async () => {
    const u = usuario({ tipo: 'concesionaria', nombre: 'Auto SA' })
    const [a, b] = await Promise.all([completarRegistro(u), completarRegistro(u)])
    expect(a).toBe(true)
    expect(b).toBe(true)
    expect(await completarRegistro(u)).toBe(false) // ya completado
    expect(calls.inserts).toHaveLength(1)
    expect(acciones().sort()).toEqual(['admin', 'welcome'])
  })

  it('si ya existe la fila, no la duplica pero sí limpia la marca', async () => {
    state.existente = { id: 'ya-existe' }
    expect(await completarRegistro(usuario({ tipo: 'concesionaria', nombre: 'X' }))).toBe(true)
    expect(calls.inserts).toHaveLength(0)
    expect(calls.updates).toHaveLength(1)
  })

  it('si el insert falla, no limpia la marca ni avisa (se reintenta en el próximo login)', async () => {
    state.insertError = { message: 'boom' }
    const u = usuario({ tipo: 'concesionaria', nombre: 'X' })
    expect(await completarRegistro(u)).toBe(false)
    expect(calls.updates).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
    state.insertError = null
    expect(await completarRegistro(u)).toBe(true) // reintento OK
  })

  it('si no se puede limpiar la marca, no avisa (evita mails duplicados)', async () => {
    state.updateError = { message: 'boom' }
    expect(await completarRegistro(usuario({ tipo: 'particular', nombre: 'X' }))).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
