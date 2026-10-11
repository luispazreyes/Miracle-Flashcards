import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { AccesoPage, type EstadoAcceso } from './AccesoPage'

const estados: EstadoAcceso[] = ['inicial', 'enviando', 'enviado', 'enlace-invalido', 'sin-conexion', 'error-envio']

describe('F-01 Acceso', () => {
  it.each(estados)('sin violaciones axe en estado %s', async (estado) => {
    const { container } = render(<AccesoPage estadoInicial={estado} />)
    // color-contrast no se calcula en jsdom; se verifica con los ratios de tokens y en navegador.
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(r.violations).toEqual([])
  })

  it('enfoca el campo al cargar', () => {
    render(<AccesoPage />)
    expect(screen.getByLabelText('Correo electrónico')).toHaveFocus()
  })

  it('campo vacío: error con el nombre del campo y foco en él', async () => {
    render(<AccesoPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace de acceso' }))
    const campo = screen.getByLabelText('Correo electrónico')
    expect(campo).toBeInvalid()
    expect(campo).toHaveAccessibleDescription(/Falta el campo «Correo electrónico»/)
    expect(campo).toHaveFocus()
  })

  it('correo inválido: muestra "Escribe un correo válido."', async () => {
    render(<AccesoPage />)
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'no-es-correo')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace de acceso' }))
    expect(screen.getByText('Escribe un correo válido.')).toBeInTheDocument()
  })

  it('enviado: botón deshabilitado durante la cuenta regresiva (RF-37)', () => {
    render(<AccesoPage estadoInicial="enviado" />)
    expect(screen.getByRole('button', { name: /Reenviar enlace en 60 s/ })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveFocus()
  })
})
