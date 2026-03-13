 import { useState } from "react";
import Sidebar from "../components/shared/Sidebar";
import Topbar from "../components/shared/Topbar";
import Catalogo from "../components/cajero/Catalogo";
import Carrito from "../components/cajero/Carrito";
import VentasPendientes from "../components/cajero/VentasPendientes";
import HistorialCajero from "../components/cajero/HistorialCajero";
import MiCaja from "../components/cajero/MiCaja";
import "../styles/dashboard_cajero.css";

const labels = {
  vender:     "Punto de Venta",
  pendientes: "Ventas Pendientes",
  historial:  "Mi Historial",
  caja:       "Mi Caja"
};

export default function DashboardCajero() {
  const [seccion,      setSeccion]      = useState("vender");
  const [itemsCarrito, setItemsCarrito] = useState([]);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  // ── Estado de caja elevado para compartir con sección vender ──
  const [cajaAbierta,   setCajaAbierta]   = useState(false);
  const [saldoInicial,  setSaldoInicial]  = useState(0);
  const [horaApertura,  setHoraApertura]  = useState(null);

  const agregarAlCarrito = (producto) => {
    setItemsCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) {
        return prev.map(i => i.id === producto.id
          ? { ...i, cantidad: i.cantidad + 1 }
          : i);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const handleSetSeccion = (s) => {
    setSeccion(s);
    setSidebarOpen(false);
  };

  return (
    <div style={{ display: "flex" }}>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="sidebar-overlay open"
        />
      )}

      <Sidebar
        tipo="cajero"
        seccionActiva={seccion}
        setSeccion={handleSetSeccion}
        className={sidebarOpen ? "open" : ""}
      />

      <div className="main-content">
        <Topbar
          seccion={labels[seccion]}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div style={{ padding: "20px" }}>

          {/* ── Vender — bloqueado si caja cerrada ── */}
          {seccion === "vender" && (
            cajaAbierta ? (
              <div className="grid-2">
                <Catalogo onAgregarAlCarrito={agregarAlCarrito} />
                <Carrito items={itemsCarrito} setItems={setItemsCarrito} />
              </div>
            ) : (
              <div style={{
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                minHeight:      "60vh",
                gap:            "20px",
                textAlign:      "center",
              }}>
                <div style={{ fontSize: "5rem" }}>🔒</div>
                <h2 style={{ color: "#f87171", margin: 0 }}>Caja Cerrada</h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px", margin: 0 }}>
                  Debes abrir la caja antes de realizar ventas
                </p>
                <button
                  className="btn btn-primary"
                  style={{ padding: "12px 32px", fontSize: "15px" }}
                  onClick={() => handleSetSeccion("caja")}
                >
                  💵 Ir a Abrir Caja
                </button>
              </div>
            )
          )}

          {seccion === "pendientes" && <VentasPendientes />}
          {seccion === "historial"  && <HistorialCajero />}

          {seccion === "caja" && (
            <MiCaja
              cajaAbierta={cajaAbierta}
              setCajaAbierta={setCajaAbierta}
              saldoInicial={saldoInicial}
              setSaldoInicial={setSaldoInicial}
              horaApertura={horaApertura}
              setHoraApertura={setHoraApertura}
            />
          )}

        </div>
      </div>

    </div>
  );
}
