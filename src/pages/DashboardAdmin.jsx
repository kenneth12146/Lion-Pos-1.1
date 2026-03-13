import { useState } from "react";
import Sidebar from "../components/shared/Sidebar";
import Topbar from "../components/shared/Topbar";
import Estadisticas from "../components/admin/Estadisticas";
import Inventario from "../components/admin/Inventario";
import Ventas from "../components/admin/Ventas";
import Clientes from "../components/admin/Clientes";
import Devoluciones from "../components/admin/Devoluciones";
import Usuarios from "../components/admin/Usuarios";
import Ajustes from "../components/admin/Ajustes";
import "../styles/dashboard_admin.css";

const secciones = {
  estadisticas: { label: "Estadísticas",  componente: <Estadisticas /> },
  inventario:   { label: "Inventario",    componente: <Inventario /> },
  ventas:       { label: "Ventas",        componente: <Ventas /> },
  devoluciones: { label: "Devoluciones",  componente: <Devoluciones /> },
  clientes:     { label: "Clientes",      componente: <Clientes /> },
  usuarios:     { label: "Usuarios",      componente: <Usuarios /> },
  ajustes:      { label: "Ajustes",       componente: <Ajustes /> },
};

export default function DashboardAdmin() {
  const [seccion, setSeccion] = useState("estadisticas");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSetSeccion = (s) => {
    setSeccion(s);
    setSidebarOpen(false); // Cierra sidebar al navegar en móvil
  };

  return (
    <div style={{ display: "flex" }}>

      {/* Overlay oscuro al abrir sidebar en móvil */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999
          }}
          className="sidebar-overlay open"
        />
      )}

      <Sidebar
        tipo="admin"
        seccionActiva={seccion}
        setSeccion={handleSetSeccion}
        className={sidebarOpen ? "open" : ""}
      />

      <div className="main-content">
        <Topbar
          seccion={secciones[seccion]?.label}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div style={{ padding: "25px" }}>
          {secciones[seccion]?.componente}
        </div>
      </div>

    </div>
  );
}
