import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { SkipLink } from './components/SkipLink'
import { ToastProvider } from './components/Toast'
import { AccesoPage, type EstadoAcceso } from './features/acceso/AccesoPage'
import { AjustesPage } from './features/ajustes/AjustesPage'
import { EstudioPage } from './features/estudio/EstudioPage'
import { MazosPage } from './features/mazos/MazosPage'
import { ProgresoPage } from './features/progreso/ProgresoPage'
import { ESTADOS_ACCESO, PanelPrototipo } from './proto/PanelPrototipo'
import { AuthProvider, useAuth } from './state/AuthContext'
import { DataProvider } from './state/DataContext'
import { PrefsProvider } from './state/PrefsContext'
import { SyncProvider } from './state/SyncContext'

function RutaAcceso() {
  const { haySesion } = useAuth()
  const [params] = useSearchParams()
  const pedido = params.get('estado')
  const estado = (ESTADOS_ACCESO.some((e) => e.valor === pedido) ? pedido : 'inicial') as EstadoAcceso
  // RF-41: con sesión existente (también sin conexión) se omite esta pantalla.
  if (haySesion) return <Navigate to="/mazos" replace />
  // key: reinicia la pantalla al forzar un estado desde el panel
  return <AccesoPage key={estado} estadoInicial={estado} />
}

function RutasConSesion() {
  const { haySesion } = useAuth()
  return haySesion ? <AppShell /> : <Navigate to="/acceso" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <PrefsProvider>
        <AuthProvider>
          <SyncProvider>
            <DataProvider>
              <ToastProvider>
                <SkipLink />
                <Routes>
                  <Route path="/acceso" element={<RutaAcceso />} />
                  <Route element={<RutasConSesion />}>
                    <Route path="/mazos" element={<MazosPage />} />
                    <Route path="/estudio/:mazoId" element={<EstudioPage />} />
                    <Route path="/progreso" element={<ProgresoPage />} />
                    <Route path="/ajustes" element={<AjustesPage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/mazos" replace />} />
                </Routes>
                <PanelPrototipo />
              </ToastProvider>
            </DataProvider>
          </SyncProvider>
        </AuthProvider>
      </PrefsProvider>
    </BrowserRouter>
  )
}
