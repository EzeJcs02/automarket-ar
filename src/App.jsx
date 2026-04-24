import Arrepentimiento from './pages/Arrepentimiento'
import Legales from './pages/Legales'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Catalogo from './pages/Catalogo'
import AutoDetalle from './pages/AutoDetalle'
import { Concesionarias, ConcesionariaDetalle } from './pages/Concesionarias'
import { Login, Registro } from './pages/Auth'
import Panel from './pages/Panel'
import Admin from './pages/Admin'
import Planes from './pages/Planes'
import Favoritos from './pages/Favoritos'
import MiCuenta from './pages/MiCuenta'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/auto/:id" element={<AutoDetalle />} />
                <Route path="/concesionarias" element={<Concesionarias />} />
                <Route path="/concesionaria/:id" element={<ConcesionariaDetalle />} />
                <Route path="/panel" element={<Panel />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/planes" element={<Planes />} />
                <Route path="/favoritos" element={<Favoritos />} />
                <Route path="/mi-cuenta" element={<MiCuenta />} />
                <Route path="/legales" element={<Legales />} />
                <Route path="/arrepentimiento" element={<Arrepentimiento />} />
              </Routes>
            </>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}