import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { axeViolations } from '../test/axe'
import { ActionMenu } from './ActionMenu'
import { Alert } from './Alert'
import { Button } from './Button'
import { Icon } from './Icon'
import { SkipLink } from './SkipLink'
import { EmptyState, ErrorState, LoadingState } from './StateViews'
import { Tabs } from './Tabs'
import { TextField } from './TextField'
import { ToastProvider, useToast } from './Toast'

describe('Button', () => {
  it('es type=button por defecto y cumple el objetivo táctil mínimo (44 px)', () => {
    render(<Button>Hola</Button>)
    const b = screen.getByRole('button', { name: 'Hola' })
    expect(b).toHaveAttribute('type', 'button')
    expect(b.className).toContain('objetivo-min')
  })

  it('cargando: aria-busy y sigue siendo accesible; deshabilitado no responde', async () => {
    const onClick = vi.fn()
    render(
      <>
        <Button loading>Enviar</Button>
        <Button disabled onClick={onClick}>
          Nada
        </Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Nada' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('axe: todas las variantes y estados', async () => {
    const { container } = render(
      <>
        <Button>a</Button>
        <Button variant="secondary">b</Button>
        <Button variant="danger">c</Button>
        <Button variant="text">d</Button>
        <Button disabled>e</Button>
        <Button loading>f</Button>
        <Icon name="check" />
      </>,
    )
    expect(await axeViolations(container)).toEqual([])
  })
})

describe('TextField', () => {
  it('etiqueta visible enlazada, ayuda y error con aria-describedby, aria-invalid', () => {
    render(<TextField label="Correo" help="Ayuda" error="Escribe un correo válido." />)
    const input = screen.getByLabelText('Correo')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Ayuda Escribe un correo válido.')
    expect(input.className).toContain('objetivo-min')
  })

  it('sin error no marca aria-invalid', () => {
    render(<TextField label="Correo" />)
    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-invalid')
  })

  it('axe: normal y con error', async () => {
    const { container } = render(
      <>
        <TextField label="Uno" help="Ayuda" />
        <TextField label="Dos" error="Falta" />
      </>,
    )
    expect(await axeViolations(container)).toEqual([])
  })
})

describe('Alert, estados y SkipLink', () => {
  it('error → role alert; el resto → role status', () => {
    render(
      <>
        <Alert kind="error">E</Alert>
        <Alert kind="info">I</Alert>
        <Alert kind="warning">W</Alert>
        <Alert kind="success">S</Alert>
      </>,
    )
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getAllByRole('status')).toHaveLength(3)
  })

  it('estados de carga, error (con Reintentar) y vacío', async () => {
    const onRetry = vi.fn()
    const { container } = render(
      <>
        <LoadingState rows={2} />
        <ErrorState text="Falló" onRetry={onRetry} />
        <EmptyState text="Nada aún">
          <Button>Crear</Button>
        </EmptyState>
        <SkipLink />
      </>,
    )
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Falló')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute(
      'href',
      '#contenido',
    )
    expect(await axeViolations(container)).toEqual([])
  })

  it('axe: alertas', async () => {
    const { container } = render(
      <>
        <Alert kind="error">E</Alert>
        <Alert kind="info">I</Alert>
      </>,
    )
    expect(await axeViolations(container)).toEqual([])
  })
})

describe('Tabs', () => {
  function Host() {
    const [active, setActive] = useState('a')
    return (
      <Tabs
        label="Ejemplo"
        prefix="t"
        active={active}
        onChange={setActive}
        tabs={[
          { id: 'a', label: 'Uno' },
          { id: 'b', label: 'Dos' },
          { id: 'c', label: 'Tres' },
        ]}
      />
    )
  }

  it('patrón tablist: solo la pestaña activa está en el orden de tabulación; flechas, Inicio y Fin', async () => {
    const u = userEvent.setup()
    render(<Host />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1'])
    tabs[0].focus()
    await u.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Dos', selected: true })).toBeInTheDocument()
    await u.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Tres', selected: true })).toBeInTheDocument()
    await u.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Uno', selected: true })).toBeInTheDocument()
    await u.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Tres', selected: true })).toBeInTheDocument()
    await u.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Uno', selected: true })).toBeInTheDocument()
  })

  it('cada pestaña cumple el objetivo táctil mínimo', () => {
    render(<Host />)
    for (const t of screen.getAllByRole('tab')) expect(t.className).toContain('objetivo-min')
  })
})

describe('ActionMenu', () => {
  const items = (onSelect = vi.fn()) => [
    { text: 'Renombrar', onSelect },
    { text: 'Borrar', onSelect, danger: true },
  ]

  it('abre con foco en el primer ítem y navega con flechas, Inicio y Fin', async () => {
    const u = userEvent.setup()
    render(<ActionMenu label="Más acciones de «Mazo 1»" items={items()} />)
    const trigger = screen.getByRole('button', { name: 'Más acciones de «Mazo 1»' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await u.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const [first, second] = screen.getAllByRole('menuitem')
    expect(first).toHaveFocus()
    await u.keyboard('{ArrowDown}')
    expect(second).toHaveFocus()
    await u.keyboard('{ArrowDown}')
    expect(first).toHaveFocus()
    await u.keyboard('{End}')
    expect(second).toHaveFocus()
    await u.keyboard('{Home}')
    expect(first).toHaveFocus()
  })

  it('Esc cierra y devuelve el foco al disparador; seleccionar ejecuta la acción y también', async () => {
    const u = userEvent.setup()
    const onSelect = vi.fn()
    render(<ActionMenu label="Más acciones" items={items(onSelect)} />)
    const trigger = screen.getByRole('button', { name: 'Más acciones' })
    await u.click(trigger)
    await u.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await u.click(trigger)
    await u.click(screen.getByRole('menuitem', { name: 'Borrar' }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('cada ítem y el disparador cumplen el objetivo táctil mínimo; axe sin violaciones', async () => {
    const u = userEvent.setup()
    const { container } = render(<ActionMenu label="Más acciones" items={items()} />)
    const trigger = screen.getByRole('button', { name: 'Más acciones' })
    expect(trigger.className).toContain('objetivo-min')
    await u.click(trigger)
    for (const it of screen.getAllByRole('menuitem')) expect(it.className).toContain('objetivo-min')
    expect(await axeViolations(container)).toEqual([])
    expect(await axeViolations(screen.getByRole('menu'))).toEqual([])
  })
})

describe('Toast', () => {
  function Trigger() {
    const { notify } = useToast()
    return (
      <>
        <Button onClick={() => notify('Palabra guardada')}>ok</Button>
        <Button onClick={() => notify('Falló algo', 'error')}>mal</Button>
      </>
    )
  }

  it('informativos en una región status; errores en una región alert y no se cierran solos', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const u = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    await u.click(screen.getByRole('button', { name: 'ok' }))
    await u.click(screen.getByRole('button', { name: 'mal' }))
    const status = screen.getAllByRole('status')[0]
    const alert = screen.getByRole('alert')
    expect(within(status).getByText('Palabra guardada')).toBeInTheDocument()
    expect(within(alert).getByText('Falló algo')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(screen.queryByText('Palabra guardada')).not.toBeInTheDocument()
    expect(screen.getByText('Falló algo')).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(screen.queryByText('Falló algo')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('axe: sin violaciones con avisos visibles', async () => {
    const u = userEvent.setup()
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    await u.click(screen.getByRole('button', { name: 'ok' }))
    await u.click(screen.getByRole('button', { name: 'mal' }))
    expect(await axeViolations(document.body)).toEqual([])
  })

  it('useToast fuera del proveedor falla con un mensaje claro', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Trigger />)).toThrow('useToast requiere <ToastProvider>')
    spy.mockRestore()
  })
})
