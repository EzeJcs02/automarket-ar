// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ConfirmProvider, useConfirm } from '../ConfirmContext'

function Probador() {
  const confirmar = useConfirm()
  const [resultado, setResultado] = useState('')
  return (
    <>
      <button onClick={async () => setResultado(String(await confirmar({ titulo: 'Eliminar vehículo', texto: 'No se puede deshacer', confirmar: 'Eliminar' }))) }>abrir</button>
      <output>{resultado}</output>
    </>
  )
}

afterEach(cleanup)

function montar() {
  render(<ConfirmProvider><Probador /></ConfirmProvider>)
  return userEvent.setup()
}

describe('ConfirmProvider', () => {
  it('muestra el diálogo accesible y resuelve true al confirmar', async () => {
    const user = montar()
    await user.click(screen.getByText('abrir'))
    const dialogo = screen.getByRole('alertdialog', { name: 'Eliminar vehículo' })
    expect(dialogo).toHaveTextContent('No se puede deshacer')
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('true')).toBeInTheDocument()
  })

  it('resuelve false con Cancelar', async () => {
    const user = montar()
    await user.click(screen.getByText('abrir'))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('false')).toBeInTheDocument()
  })

  it('resuelve false con Escape y pone el foco dentro del diálogo', async () => {
    const user = montar()
    await user.click(screen.getByText('abrir'))
    expect(screen.getByRole('alertdialog')).toContainElement(document.activeElement)
    await user.keyboard('{Escape}')
    expect(screen.getByText('false')).toBeInTheDocument()
  })
})
