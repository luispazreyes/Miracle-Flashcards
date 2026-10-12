import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { configure } from '@testing-library/react'

// Las pruebas de pantalla completa (router + Dexie + componentes) corren en paralelo: margen para CI lento.
configure({ asyncUtilTimeout: 4000 })
