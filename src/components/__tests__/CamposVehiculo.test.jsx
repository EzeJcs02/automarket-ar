// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MarcaInput, NumeroInput } from '../CamposVehiculo'

afterEach(cleanup)

function Precio({ inicial = '' }) {
  const [v, setV] = useState(inicial)
  return <><NumeroInput aria-label="Precio" prefijo="$" value={v} onChange={setV} /><output>{v}</output></>
}

describe('NumeroInput', () => {
  it('muestra separador de miles y guarda el número limpio', async () => {
    const user = userEvent.setup()
    render(<Precio />)
    await user.type(screen.getByLabelText('Precio'), '25000000')
    expect(screen.getByLabelText('Precio')).toHaveValue('25.000.000')
    expect(document.querySelector('output')).toHaveTextContent(/^25000000$/)
  })

  it('ignora letras y formatea valores que vienen de la base', async () => {
    const user = userEvent.setup()
    render(<Precio inicial={15500} />)
    expect(screen.getByLabelText('Precio')).toHaveValue('15.500')
    await user.type(screen.getByLabelText('Precio'), 'abc')
    expect(document.querySelector('output')).toHaveTextContent(/^15500$/)
    expect(screen.getByLabelText('Precio')).toHaveAttribute('inputmode', 'numeric')
  })
})

describe('MarcaInput', () => {
  it('ofrece sugerencias con datalist y permite escribir cualquier marca', async () => {
    const user = userEvent.setup()
    render(<MarcaInput aria-label="Marca" defaultValue="" />)
    const input = screen.getByLabelText('Marca')
    const lista = document.getElementById(input.getAttribute('list'))
    expect(lista.querySelector('option[value="Toyota"]')).not.toBeNull()
    await user.type(input, 'Marca Rara')
    expect(input).toHaveValue('Marca Rara')
  })
})
