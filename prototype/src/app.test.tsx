// Pruebas de las pantallas F-02 a F-09 sobre la app completa (datos de ejemplo en memoria).
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import App from './App'

function montar(ruta: string) {
  localStorage.setItem('mf-sesion', '1')
  window.history.pushState({}, '', ruta)
  return render(<App />)
}

async function sinViolaciones(el: Element) {
  // color-contrast no se calcula en jsdom: se cubre en tokens.test.ts y se revisa en navegador.
  const r = await axe.run(el, { rules: { 'color-contrast': { enabled: false } } })
  expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([])
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
})

describe('F-02 Mazos', () => {
  it('lista los mazos con contador y botón Estudiar; sin violaciones axe', async () => {
    const { container } = montar('/mazos')
    expect(screen.getAllByRole('heading', { name: 'Mazos' })[0]).toBeInTheDocument()
    expect(screen.getByText('5 palabras')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Estudiar Mazo 1/ })).toBeInTheDocument()
    await sinViolaciones(container)
  })

  it('Estudiar está deshabilitado con razón accesible si el mazo no tiene palabras', () => {
    montar('/mazos')
    const boton = screen.getByRole('button', { name: /Estudiar Mazo 3/ })
    expect(boton).toHaveAttribute('aria-disabled', 'true')
    expect(boton).toHaveAccessibleDescription('Este mazo no tiene palabras')
  })

  it('nombre repetido (sin distinguir mayúsculas ni acentos) no se guarda', async () => {
    montar('/mazos')
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo mazo' }))
    await userEvent.type(screen.getByLabelText('Nombre del mazo'), 'MAZO 1')
    await userEvent.click(screen.getByRole('button', { name: 'Crear mazo' }))
    expect(screen.getByText('Ya tienes un mazo con ese nombre. Elige otro.')).toBeInTheDocument()
  })

  it('crea un mazo y valida el límite de 60 caracteres', async () => {
    montar('/mazos')
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo mazo' }))
    const campo = screen.getByLabelText('Nombre del mazo')
    await userEvent.type(campo, 'x'.repeat(61))
    await userEvent.click(screen.getByRole('button', { name: 'Crear mazo' }))
    expect(screen.getByText(/no puede superar 60 caracteres/)).toBeInTheDocument()
    await userEvent.clear(campo)
    await userEvent.type(campo, 'Mazo nuevo')
    await userEvent.click(screen.getByRole('button', { name: 'Crear mazo' }))
    expect(screen.getByText('Mazo «Mazo nuevo» creado.')).toBeInTheDocument()
  })

  it('borrar mazo: confirmación con foco en Cancelar; las palabras quedan sin mazo', async () => {
    montar('/mazos')
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones de «Mazo 2»' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Borrar' }))
    const dialogo = screen.getByRole('alertdialog', { name: 'Borrar mazo' })
    expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    expect(dialogo).toHaveTextContent('Sus palabras se conservan y quedarán sin mazo')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Borrar mazo' }))
    expect(screen.queryByRole('button', { name: /Estudiar Mazo 2/ })).not.toBeInTheDocument()
    expect(screen.getByText('Mazo «Mazo 2» borrado.')).toBeInTheDocument()
  })

  it('Esc cierra el diálogo y devuelve el foco al disparador', async () => {
    montar('/mazos')
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones de «Mazo 1»' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Renombrar' }))
    expect(screen.getByRole('dialog', { name: 'Renombrar mazo' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Más acciones de «Mazo 1»' })).toHaveFocus()
  })

  it('estado vacío y estado de error', async () => {
    montar('/mazos')
    await userEvent.click(screen.getByText('Panel del prototipo'))
    await userEvent.selectOptions(screen.getByLabelText('Datos'), 'vacio')
    expect(screen.getByText('Aún no tienes mazos. Crea el primero.')).toBeInTheDocument()
    expect(screen.getByText('Todavía no hay palabras. Crea la primera.')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Datos'), 'error')
    expect(screen.getByText('No se pudieron cargar los mazos.')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Reintentar' })[0])
    expect(screen.getByText('5 palabras')).toBeInTheDocument()
  })
})

describe('F-03 Panel de palabras', () => {
  it('con mazo seleccionado muestra los tres grupos en orden fijo', async () => {
    const { container } = montar('/mazos')
    await userEvent.click(screen.getByRole('button', { name: /^Mazo 1/ }))
    const titulos = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titulos[0]).toMatch(/^En este mazo/)
    expect(titulos[1]).toMatch(/^En otros mazos/)
    expect(titulos[2]).toMatch(/^Sin mazo/)
    await sinViolaciones(container)
  })

  it('sin mazo seleccionado: lista única con las "Sin mazo" al final', () => {
    montar('/mazos')
    const filas = screen.getAllByRole('listitem').filter((li) => li.hasAttribute('data-palabra-id'))
    const ultimo = filas[filas.length - 1]
    expect(within(ultimo).getByText('Sin mazo')).toBeInTheDocument()
  })

  it('búsqueda ignora acentos y mayúsculas; sin resultados muestra mensaje', async () => {
    montar('/mazos')
    const buscar = screen.getByLabelText('Buscar palabras')
    await userEvent.type(buscar, 'PALABRA a-ES')
    expect(screen.getAllByText('Palabra A').length).toBeGreaterThan(0)
    await userEvent.clear(buscar)
    await userEvent.type(buscar, 'zzz')
    expect(screen.getByText('Sin resultados para «zzz».')).toBeInTheDocument()
  })

  it('Agregar a mazo: combobox con búsqueda, duplicado se bloquea (RF-36)', async () => {
    montar('/mazos')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar «Palabra G» a mazo' }))
    const combo = screen.getByRole('combobox', { name: 'Buscar mazo' })
    await userEvent.type(combo, 'mazo 1')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByText('«Palabra G» agregada a «Mazo 1».')).toBeInTheDocument()
    // otra vez: ya está
    await userEvent.click(screen.getByRole('button', { name: 'Agregar «Palabra G» a mazo' }))
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar mazo' }), 'mazo 1{Enter}')
    expect(screen.getByText('«Palabra G» ya está en este mazo.')).toBeInTheDocument()
  })

  it('combobox: sin coincidencias', async () => {
    montar('/mazos')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar «Palabra G» a mazo' }))
    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar mazo' }), 'qqq')
    expect(screen.getByText('Sin resultados para «qqq».')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Agregar «Palabra G» a mazo' })).toHaveFocus()
  })

  it('quitar de este mazo pide confirmación e indica que se pierde el progreso (RF-40)', async () => {
    montar('/mazos?mazo=m-1')
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones de «Palabra D»' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Quitar de este mazo' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('se elimina su progreso en este mazo')
    await userEvent.click(screen.getByRole('button', { name: 'Quitar del mazo' }))
    expect(screen.getByText('«Palabra D» quitada de «Mazo 1».')).toBeInTheDocument()
  })

  it('borrar palabra indica en cuántos mazos está (RF-19)', async () => {
    montar('/mazos')
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones de «Palabra C»' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Borrar' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Está en 2 mazos')
  })
})

describe('F-04 Crear y editar palabra', () => {
  async function abrir() {
    montar('/mazos')
    await userEvent.click(screen.getByRole('button', { name: 'Nueva palabra' }))
    return screen.getByRole('dialog', { name: 'Nueva palabra' })
  }

  it('foco inicial en Inglés; sin violaciones axe', async () => {
    const dialogo = await abrir()
    expect(within(dialogo).getByLabelText('Inglés (obligatorio)')).toHaveFocus()
    await sinViolaciones(dialogo)
  })

  it('campos obligatorios: errores nombran el campo y el foco va al primero', async () => {
    const dialogo = await abrir()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar palabra' }))
    expect(within(dialogo).getAllByText(/Falta el campo «Inglés»/).length).toBeGreaterThan(0)
    expect(within(dialogo).getAllByText(/Falta el campo «Español»/).length).toBeGreaterThan(0)
    await waitFor(() => expect(within(dialogo).getByLabelText('Inglés (obligatorio)')).toHaveFocus())
  })

  it('inglés repetido: aviso no bloqueante (RF-36)', async () => {
    const dialogo = await abrir()
    await userEvent.type(within(dialogo).getByLabelText('Inglés (obligatorio)'), 'palabra a')
    expect(within(dialogo).getByText('Ya existe una palabra con ese inglés. Puedes continuar.')).toBeInTheDocument()
  })

  it('guarda, cierra, avisa y lleva el foco a la fila creada', async () => {
    const dialogo = await abrir()
    await userEvent.type(within(dialogo).getByLabelText('Inglés (obligatorio)'), 'Palabra Z')
    await userEvent.type(within(dialogo).getByLabelText('Español (obligatorio)'), 'Palabra Z-es')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar palabra' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Palabra guardada')).toBeInTheDocument()
    await waitFor(() => {
      expect(document.activeElement?.getAttribute('data-palabra-id')).toBeTruthy()
    })
  })

  it('enlace de imagen que no es http(s) es inválido (RF-15)', async () => {
    const dialogo = await abrir()
    await userEvent.type(within(dialogo).getByLabelText('Inglés (obligatorio)'), 'W')
    await userEvent.type(within(dialogo).getByLabelText('Español (obligatorio)'), 'P')
    await userEvent.type(within(dialogo).getByLabelText('Enlace de imagen'), 'ftp://x')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar palabra' }))
    expect(within(dialogo).getAllByText('El enlace no es http(s) o no carga como imagen.').length).toBeGreaterThan(0)
  })

  it('error al guardar no pierde lo escrito y ofrece Reintentar', async () => {
    montar('/mazos')
    await userEvent.click(screen.getByText('Panel del prototipo'))
    await userEvent.click(screen.getByLabelText('Simular fallo al guardar palabra'))
    await userEvent.click(screen.getByRole('button', { name: 'Nueva palabra' }))
    const dialogo = screen.getByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Inglés (obligatorio)'), 'Palabra Y')
    await userEvent.type(within(dialogo).getByLabelText('Español (obligatorio)'), 'Palabra Y-es')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar palabra' }))
    expect(await within(dialogo).findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(within(dialogo).getByLabelText('Inglés (obligatorio)')).toHaveValue('Palabra Y')
  })
})

describe('F-05 / F-06 Estudio', () => {
  async function responderTodo() {
    for (let i = 0; i < 30; i++) {
      if (screen.queryByRole('heading', { name: /Sesión terminada/ })) return
      await userEvent.click(screen.getByRole('button', { name: /^Tarjeta:/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Acerté' }))
    }
  }

  it('frente → voltear → el foco pasa a "Acerté"; sin violaciones axe', async () => {
    const { container } = montar('/estudio/m-1')
    const tarjeta = screen.getByRole('button', { name: /^Tarjeta: .*Pulsa para ver la traducción$/ })
    expect(tarjeta).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(tarjeta)
    expect(screen.getByRole('button', { name: /^Traducción:/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Acerté' })).toHaveFocus()
    await sinViolaciones(container)
  })

  it('Espacio voltea la tarjeta (es un botón)', async () => {
    montar('/estudio/m-1')
    screen.getByRole('button', { name: /^Tarjeta:/ }).focus()
    await userEvent.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Acerté' })).toBeInTheDocument()
  })

  it('un fallo reinicia el contador y la palabra sigue pendiente', async () => {
    montar('/estudio/m-1')
    expect(screen.getByText('Pendientes: 3')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Tarjeta:/ }))
    await userEvent.click(screen.getByRole('button', { name: 'No acerté' }))
    expect(screen.getByText('No acertaste. El contador vuelve a 0.')).toBeInTheDocument()
    expect(screen.getByText('Pendientes: 3')).toBeInTheDocument()
  })

  it('3 aciertos seguidos aprenden la palabra; al agotarlas aparece F-06 con resumen', async () => {
    montar('/estudio/m-1')
    await responderTodo()
    const titulo = screen.getByRole('heading', { name: '¡Sesión terminada!' })
    expect(titulo).toHaveFocus()
    expect(screen.getByText('Aciertos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reactivar palabras' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a mazos' })).toBeInTheDocument()
  })

  it('mazo sin pendientes no inicia sesión (RF-38)', () => {
    montar('/estudio/m-4')
    expect(screen.getByRole('heading', { name: 'Este mazo no tiene palabras pendientes' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Tarjeta:/ })).not.toBeInTheDocument()
  })

  it('mazo sin palabras: mensaje específico y solo volver', () => {
    montar('/estudio/m-3')
    expect(screen.getByRole('heading', { name: 'Este mazo no tiene palabras' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Reactivar palabras' })).not.toBeInTheDocument()
  })
})

describe('F-07 Progreso', () => {
  it('muestra contadores, barra de avance y reactiva una palabra aprendida', async () => {
    const { container } = montar('/progreso?mazo=m-1')
    expect(screen.getByRole('progressbar', { name: 'Avance del mazo' })).toHaveAttribute('aria-valuenow', '40')
    expect(screen.getByText('Pendientes (3)')).toBeInTheDocument()
    await sinViolaciones(container)
    await userEvent.click(screen.getByRole('tab', { name: 'Aprendidas (2)' }))
    await userEvent.click(screen.getByRole('button', { name: 'Reactivar «Palabra A»' }))
    expect(screen.getByText('«Palabra A» vuelve a pendientes de «Mazo 1».')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Aprendidas (1)' })).toBeInTheDocument()
  })

  it('una palabra en dos mazos tiene estado propio en cada uno (RF-30)', async () => {
    montar('/progreso?mazo=m-1')
    expect(screen.getByText('Aciertos seguidos: 1 de 3')).toBeInTheDocument() // Palabra C en Mazo 1
    await userEvent.selectOptions(screen.getByLabelText('Mazo'), 'm-2')
    expect(screen.getAllByText('Aciertos seguidos: 0 de 3').length).toBe(2) // C y F en Mazo 2
  })

  it('pestañas con flechas', async () => {
    montar('/progreso?mazo=m-1')
    screen.getByRole('tab', { name: /^Pendientes/ }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /^Aprendidas/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('mazo sin pendientes muestra el mensaje de lista vacía', async () => {
    montar('/progreso?mazo=m-4')
    expect(screen.getByText('No quedan palabras pendientes.')).toBeInTheDocument()
  })

  it('sin mazos: "Crea un mazo para ver tu progreso."', async () => {
    montar('/progreso')
    await userEvent.click(screen.getByText('Panel del prototipo'))
    await userEvent.selectOptions(screen.getByLabelText('Datos'), 'vacio')
    expect(screen.getByText('Crea un mazo para ver tu progreso.')).toBeInTheDocument()
  })
})

describe('F-08 Ajustes', () => {
  it('cambia tema, paleta y lado de la imagen al instante y los guarda; axe limpio', async () => {
    const { container } = montar('/ajustes')
    await userEvent.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(document.documentElement.dataset.tema).toBe('oscuro')
    expect(localStorage.getItem('mf-tema')).toBe('oscuro')
    await userEvent.click(within(screen.getByRole('group', { name: 'Paleta de fondo' })).getByRole('radio', { name: 'Menta' }))
    expect(document.documentElement.style.getPropertyValue('--color-fondo')).toBe('#e6f4ea')
    await userEvent.click(within(screen.getByRole('group', { name: 'Paleta de tarjeta' })).getByRole('radio', { name: 'Grafito' }))
    expect(document.documentElement.style.getPropertyValue('--color-tarjeta')).toBe('#111827')
    await userEvent.click(screen.getByRole('radio', { name: 'Ambos' }))
    expect(localStorage.getItem('mf-lado-imagen')).toBe('ambos')
    expect(await screen.findByText('Guardado')).toBeInTheDocument()
    await sinViolaciones(container)
  })

  it('cambiar el tema no mueve el foco fuera del control', async () => {
    montar('/ajustes')
    const radio = screen.getByRole('radio', { name: 'Azul' })
    await userEvent.click(radio)
    expect(radio).toHaveFocus()
  })

  it('cerrar sesión sin pendientes cierra directamente', async () => {
    montar('/ajustes')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(localStorage.getItem('mf-sesion')).toBeNull()
  })

  it('cerrar sesión con cambios sin sincronizar pide confirmación (RF-41)', async () => {
    montar('/ajustes')
    await userEvent.click(screen.getByText('Panel del prototipo'))
    await userEvent.selectOptions(screen.getByLabelText('Sincronización'), 'sin-sincronizar')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    const dialogo = screen.getByRole('alertdialog')
    expect(dialogo).toHaveTextContent('Tienes cambios sin sincronizar. Si cierras sesión, se perderán.')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(localStorage.getItem('mf-sesion')).toBe('1')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión igualmente' }))
    expect(localStorage.getItem('mf-sesion')).toBeNull()
  })
})

describe('F-09 Offline y sincronización', () => {
  it('fallo de sincronización: reintentos automáticos hasta "Sin sincronizar" + Reintentar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      montar('/mazos')
      await act(async () => {
        screen.getByText('Panel del prototipo').click()
      })
      await act(async () => {
        screen.getByRole('button', { name: /Simular fallo de sincronización/ }).click()
      })
      expect(screen.getAllByText(/Sincronizando…/).length).toBeGreaterThan(0)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20000)
      })
      const barra = within(screen.getByRole('banner'))
      expect(barra.getByText('Sin sincronizar')).toBeInTheDocument()
      expect(barra.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('sin conexión: la tarjeta omite la imagen sin error (RF-14)', async () => {
    montar('/estudio/m-1')
    await userEvent.click(screen.getByText('Panel del prototipo'))
    await userEvent.selectOptions(screen.getByLabelText('Sincronización'), 'sin-conexion')
    expect(screen.getByText('Sin conexión. Tus cambios se guardan en este dispositivo.')).toBeInTheDocument()
    expect(screen.queryAllByRole('img').length).toBe(0)
  })
})
