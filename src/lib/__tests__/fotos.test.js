import { describe, it, expect, vi, beforeEach } from 'vitest'

const subidas = []
let fallarEn = null
vi.mock('../supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: async (path, file) => {
          subidas.push(file.name)
          await new Promise(r => setTimeout(r, file.name === 'lenta.jpg' ? 30 : 1))
          return { error: file.name === fallarEn ? { message: 'x' } : null }
        },
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn/${path}` } }),
      }),
    },
  },
}))

import { subirFotos, fotosDesdeUrls } from '../fotos'

const nueva = (nombre) => ({ id: nombre, file: new File(['x'], nombre, { type: 'image/jpeg' }), nombre })

beforeEach(() => { subidas.length = 0; fallarEn = null })

describe('subirFotos', () => {
  it('respeta el orden elegido aunque las subidas terminen desordenadas', async () => {
    const items = [nueva('lenta.jpg'), ...fotosDesdeUrls(['https://cdn/vieja.jpg']), nueva('b.jpg'), nueva('c.jpg')]
    const urls = await subirFotos(items, 'conc1')
    expect(urls).toHaveLength(4)
    expect(urls[1]).toBe('https://cdn/vieja.jpg')
    expect(urls[0]).toMatch(/^https:\/\/cdn\/conc1\/.+\.jpg$/)
    expect(new Set(urls).size).toBe(4)
  })

  it('no vuelve a subir las fotos que ya estaban', async () => {
    await subirFotos([...fotosDesdeUrls(['https://cdn/a.jpg']), nueva('b.jpg')], 'c')
    expect(subidas).toEqual(['b.jpg'])
  })

  it('informa el avance y falla con el nombre de la foto que no se pudo subir', async () => {
    const avance = []
    fallarEn = 'c.jpg'
    await expect(subirFotos([nueva('a.jpg'), nueva('c.jpg')], 'x', (h, t) => avance.push(`${h}/${t}`)))
      .rejects.toThrow('No se pudo subir "c.jpg"')
    expect(avance[0]).toBe('0/2')
  })
})
