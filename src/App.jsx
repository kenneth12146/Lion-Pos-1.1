import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ThemeProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import SeleccionarRol from "./pages/SeleccionarRol";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardCajero from "./pages/DashboardCajero";

// ── Ruta que requiere sesión + rol específico ──
function RutaProtegida({ children, rolRequerido }) {
  const { sesion, cargando } = useAuth();

  if (cargando) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#070b14", color: "#06b6d4", fontSize: "18px"
    }}>
      ⏳ Cargando...
    </div>
  );

  if (!sesion) return <Navigate to="/" replace />;

  if (rolRequerido && sesion.rol !== rolRequerido) {
    // Si tiene sesión pero sin rol asignado → seleccionar rol
    if (!sesion.rol) return <Navigate to="/seleccionar-rol" replace />;
    return <Navigate to={sesion.rol === "administrador" ? "/admin" : "/cajero"} replace />;
  }

  return children;
}

// ── Ruta pública ──
function RutaPublica({ children }) {
  const { sesion, cargando } = useAuth();

  if (cargando) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#070b14", color: "#06b6d4", fontSize: "18px"
    }}>
      ⏳ Cargando...
    </div>
  );

  if (sesion && sesion.rol) {
    return <Navigate to={sesion.rol === "administrador" ? "/admin" : "/cajero"} replace />;
  }

  if (sesion && !sesion.rol) {
    return <Navigate to="/seleccionar-rol" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>

            {/* Rutas públicas */}
            <Route path="/" element={
              <RutaPublica><Login /></RutaPublica>
            } />
            <Route path="/registro" element={
              <RutaPublica><Registro /></RutaPublica>
            } />

            {/* Seleccionar rol — requiere sesión pero sin rol */}
            <Route path="/seleccionar-rol" element={
              <RutaProtegida><SeleccionarRol /></RutaProtegida>
            } />

            {/* Dashboard Admin */}
            <Route path="/admin" element={
              <RutaProtegida rolRequerido="administrador">
                <DashboardAdmin />
              </RutaProtegida>
            } />

            {/* Dashboard Cajero */}
            <Route path="/cajero" element={
              <RutaProtegida rolRequerido="cajero">
                <DashboardCajero />
              </RutaProtegida>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
