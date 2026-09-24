// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

vi.mock('../../lib/fotos', () => ({ comprimirImagen: async (f) => f }))
globalThis.URL.createObjectURL = (f) => `blob:${f.name}`
globalThis.URL.revokeObjectURL = () => {}

import FotosUploader from '../FotosUploader'

function Contenedor({ inicial = [] }) {
  const [fotos, setFotos] = useState(inicial)
  return <FotosUploader fotos={fotos} setFotos={setFotos} minimo={5} />
}

const orden = () => screen.getAllByRole('listitem').map(li => within(li).getByRole('img').getAttribute('src'))

afterEach(cleanup)

describe('FotosUploader', () => {
  it('agrega varias fotos de una sola vez y marca la primera como portada', async () => {
    const user = userEvent.setup()
    const { container } = render(<Contenedor />)
    const input = container.querySelector('input[type=file]')
    await user.upload(input, ['a', 'b', 'c'].map(n => new File(['x'], `${n}.jpg`, { type: 'image/jpeg' })))
    expect(orden()).toEqual(['blob:a.jpg', 'blob:b.jpg', 'blob:c.jpg'])
    expect(screen.getByText('PORTADA')).toBeInTheDocument()
    expect(screen.getByText(/Faltan 2 para el mínimo/)).toBeInTheDocument()
  })

  it('reordena con flechas, elige portada y quita', async () => {
    const user = userEvent.setup()
    render(<Contenedor inicial={['a', 'b', 'c'].map(n => ({ id: n, url: `https://cdn/${n}.jpg` }))} />)
    await user.click(screen.getByRole('button', { name: 'Mover foto 1 a la derecha' }))
    expect(orden()).toEqual(['https://cdn/b.jpg', 'https://cdn/a.jpg', 'https://cdn/c.jpg'])
    const tercera = screen.getAllByRole('listitem')[2]
    await user.click(within(tercera).getByRole('button', { name: 'Portada' }))
    expect(orden()[0]).toBe('https://cdn/c.jpg')
    await user.click(screen.getByRole('button', { name: 'Quitar foto 1' }))
    expect(orden()).toEqual(['https://cdn/b.jpg', 'https://cdn/a.jpg'])
  })
})
