 import { useState } from "react";
import { useVentas } from "../../hooks/useVentas";
import { useDevoluciones } from "../../hooks/useDevoluciones";
import { formatMoney, formatDate } from "../../utils/utils";
import Modal from "../shared/Modal";
import Factura from "../cajero/Factura";

export default function Ventas() {
  const { ventas, cargando } = useVentas();
  const { registrar: registrarDevolucion } = useDevoluciones();
  const [busqueda, setBusqueda] = useState("");
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [motivo, setMotivo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [facturaReimprimir, setFacturaReimprimir] = useState(null);

  const mostrarMensaje = (texto, tipo = "success") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
  };

  const ventasFiltradas = ventas.filter(v => {
    const coincideBusqueda =
      v.id?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.usuario?.toLowerCase().includes(busqueda.toLowerCase());

    const desde = fechaDesde ? new Date(fechaDesde).setHours(0, 0, 0, 0) : null;
    const hasta = fechaHasta ? new Date(fechaHasta).setHours(23, 59, 59, 999) : null;
    const coincideFecha =
      (!desde || v.timestamp >= desde) &&
      (!hasta || v.timestamp <= hasta);

    return coincideBusqueda && coincideFecha;
  });

  const handleExportarVentas = () => {
    if (ventasFiltradas.length === 0) return;
    const headers = ["ID", "Fecha", "Cliente", "Cedula", "Total", "Descuento", "Metodo", "Usuario"];
    const filas = ventasFiltradas.map(v => [
      v.id,
      new Date(v.timestamp).toLocaleString("es-CO"),
      v.cliente?.nombre || "Mostrador",
      v.cliente?.cedula || "",
      v.total,
      v.descuento || 0,
      v.forma || "efectivo",
      v.usuario
    ].map(val => `"${val}"`).join(","));
    const csv = [headers.join(","), ...filas].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDevolucion = async () => {
    if (!motivo.trim()) {
      mostrarMensaje("❌ Debes escribir el motivo de la devolución", "error");
      return;
    }
    if (!confirm(`¿Registrar devolución de la venta ${ventaDetalle.id}? Esto eliminará la venta y devolverá el stock.`)) return;
    try {
      await registrarDevolucion({
        ventaId: ventaDetalle.id,
        ventaDocId: ventaDetalle.docId,
        cliente: ventaDetalle.cliente,
        items: ventaDetalle.items,
        total: ventaDetalle.total,
        motivo: motivo
      });
      mostrarMensaje("✅ Devolución registrada, stock restaurado y venta eliminada");
      setVentaDetalle(null);
      setMotivo("");
    } catch (err) {
      mostrarMensaje("❌ Error: " + err.message, "error");
    }
  };

  // Stats rápidas
  const hoy = new Date().setHours(0, 0, 0, 0);
  const ventasHoy = ventas.filter(v => v.timestamp >= hoy);
  const totalHoy = ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0);
  const totalMes = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

  return (
    <div>
      {mensaje.texto && (
        <div className={`message ${mensaje.tipo} show`}>{mensaje.texto}</div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "25px" }}>
        <div className="stat-card">
          <div className="icon">📅</div>
          <h4>Ventas Hoy</h4>
          <div className="value">{ventasHoy.length}</div>
        </div>
        <div className="stat-card green">
          <div className="icon">💰</div>
          <h4>Total Hoy</h4>
          <div className="value">{formatMoney(totalHoy)}</div>
        </div>
        <div className="stat-card purple">
          <div className="icon">📊</div>
          <h4>Total Acumulado</h4>
          <div className="value">{formatMoney(totalMes)}</div>
        </div>
        <div className="stat-card orange">
          <div className="icon">🧾</div>
          <h4>Total Ventas</h4>
          <div className="value">{ventas.length}</div>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "15px", flexWrap: "wrap" }}>
        <input type="text"
          placeholder="🔍 Buscar por ID, cliente o usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
        <input type="date" value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
        <input type="date" value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
        {(fechaDesde || fechaHasta) && (
          <button onClick={() => { setFechaDesde(""); setFechaHasta(""); }}
            style={{ padding: "10px 15px", borderRadius: "8px", border: "1px solid #ddd", cursor: "pointer", background: "#f8f9fa" }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3>💰 Historial de Ventas ({ventasFiltradas.length})</h3>
          <button className="btn btn-primary" onClick={handleExportarVentas}
            disabled={ventasFiltradas.length === 0}>
            📤 Exportar CSV
          </button>
        </div>

        {cargando ? <p>Cargando ventas...</p> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Método</th>
                <th>Usuario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px" }}>
                    No hay ventas registradas
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map(v => (
                  <tr key={v.docId || v.id}>
                    <td><code>{v.id}</code></td>
                    <td>{formatDate(v.timestamp)}</td>
                    <td>{v.cliente?.nombre || "Mostrador"}</td>
                    <td><strong>{formatMoney(v.total)}</strong></td>
                    <td>
                      <span className="badge badge-info">{v.forma || "efectivo"}</span>
                    </td>
                    <td>{v.usuario || "Sistema"}</td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      <button className="btn btn-primary btn-sm"
                        onClick={() => { setVentaDetalle(v); setMotivo(""); }}>
                        👁️ Ver
                      </button>
                      <button className="btn btn-light btn-sm"
                        onClick={() => setFacturaReimprimir(v)}>
                        🖨️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle + devolución */}
      {ventaDetalle && (
        <Modal titulo={`🧾 Venta ${ventaDetalle.id}`}
          onClose={() => setVentaDetalle(null)}>

          <div style={{ marginBottom: "15px" }}>
            <p><strong>Fecha:</strong> {formatDate(ventaDetalle.timestamp)}</p>
            <p><strong>Cliente:</strong> {ventaDetalle.cliente?.nombre || "Mostrador"}</p>
            {ventaDetalle.cliente?.cedula && (
              <p><strong>Cédula:</strong> {ventaDetalle.cliente.cedula}</p>
            )}
            <p><strong>Usuario:</strong> {ventaDetalle.usuario}</p>
            <p><strong>Método:</strong> {ventaDetalle.forma || "efectivo"}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ventaDetalle.items?.map((item, i) => (
                <tr key={i}>
                  <td>{item.nombre}</td>
                  <td>{item.cantidad}</td>
                  <td>{formatMoney(item.precioVenta)}</td>
                  <td>{formatMoney(item.precioVenta * item.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {ventaDetalle.descuento > 0 && (
            <div style={{ textAlign: "right", marginTop: "8px", color: "#e74c3c" }}>
              Descuento: -{formatMoney(ventaDetalle.descuento)}
            </div>
          )}

          <div style={{ textAlign: "right", marginTop: "10px", fontSize: "1.3rem", fontWeight: "bold" }}>
            TOTAL: {formatMoney(ventaDetalle.total)}
          </div>

          {/* Reimprimir desde modal */}
          <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "15px" }}>
            <button className="btn btn-light"
              onClick={() => setFacturaReimprimir(ventaDetalle)}>
              🖨️ Reimprimir Factura
            </button>
          </div>

          {/* Motivo devolución */}
          <div className="form-group" style={{ marginTop: "20px" }}>
            <label>Motivo de devolución (si aplica)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Producto defectuoso, cliente no quedó satisfecho..."
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "80px" }} />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "15px" }}>
            <button className="btn btn-danger" onClick={handleDevolucion}>
              🔄 Registrar Devolución
            </button>
            <button className="btn btn-light" onClick={() => setVentaDetalle(null)}>
              Cerrar
            </button>
          </div>
        </Modal>
      )}

      {/* Reimprimir factura */}
      {facturaReimprimir && (
        <Factura venta={facturaReimprimir} onClose={() => setFacturaReimprimir(null)} />
      )}
    </div>
  );
}
