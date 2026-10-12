import { BrowserRouter, Route, Routes } from 'react-router'
import { ProjectsPage } from './pages/ProjectsPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
