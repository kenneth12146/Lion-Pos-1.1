import { useState } from "react";
import { useVentas } from "../../hooks/useVentas";
import { formatMoney, formatDate } from "../../utils/utils";
import Modal from "../shared/Modal";
import { useAuth } from "../../context/AuthContext";

export default function HistorialCajero() {
  const { ventas, cargando } = useVentas();
  const { sesion } = useAuth();
  const [detalle, setDetalle] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // Solo ventas del cajero actual
  const misVentas = ventas.filter(v =>
    v.usuario === sesion?.nombre &&
    (v.id?.toLowerCase().includes(busqueda.toLowerCase()) ||
     v.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const totalMisVentas = misVentas.reduce((sum, v) => sum + (v.total || 0), 0);

  const hoy = new Date().setHours(0, 0, 0, 0);
  const ventasHoy = misVentas.filter(v => v.timestamp >= hoy);
  const totalHoy = ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0);

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="icon">📅</div>
          <h4>Mis Ventas Hoy</h4>
          <div className="value">{ventasHoy.length}</div>
        </div>
        <div className="stat-card green">
          <div className="icon">💰</div>
          <h4>Total Hoy</h4>
          <div className="value">{formatMoney(totalHoy)}</div>
        </div>
        <div className="stat-card purple">
          <div className="icon">🧾</div>
          <h4>Total Ventas</h4>
          <div className="value">{misVentas.length}</div>
        </div>
        <div className="stat-card orange">
          <div className="icon">📊</div>
          <h4>Total Acumulado</h4>
          <div className="value">{formatMoney(totalMisVentas)}</div>
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{ marginBottom: "15px" }}>
        <input type="text"
          placeholder="🔍 Buscar por ID o cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
      </div>

      <div className="card">
        <h3>📋 Mi Historial ({misVentas.length} ventas)</h3>
        {cargando ? <p>Cargando...</p> : (
          misVentas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#7f8c8d" }}>
              <div style={{ fontSize: "48px" }}>📭</div>
              <p>No tienes ventas registradas</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Método</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {misVentas.map(v => (
                  <tr key={v.docId || v.id}>
                    <td><code>{v.id}</code></td>
                    <td>{formatDate(v.timestamp)}</td>
                    <td>{v.cliente?.nombre || "Mostrador"}</td>
                    <td><span className="badge badge-info">{v.items?.length || 0} items</span></td>
                    <td><strong>{formatMoney(v.total)}</strong></td>
                    <td>
                      <span className="badge badge-success">{v.forma || "efectivo"}</span>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm"
                        onClick={() => setDetalle(v)}>
                        👁️ Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {detalle && (
        <Modal titulo={`🧾 Detalle ${detalle.id}`} onClose={() => setDetalle(null)}>
          <div style={{ marginBottom: "15px" }}>
            <p><strong>Fecha:</strong> {formatDate(detalle.timestamp)}</p>
            <p><strong>Cliente:</strong> {detalle.cliente?.nombre || "Mostrador"}</p>
            <p><strong>Teléfono:</strong> {detalle.cliente?.telefono || "—"}</p>
            <p><strong>Método de pago:</strong> {detalle.forma || "efectivo"}</p>
          </div>
          <table>
            <thead>
              <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr>
            </thead>
            <tbody>
              {detalle.items?.map((item, i) => (
                <tr key={i}>
                  <td>{item.nombre}</td>
                  <td>{item.cantidad}</td>
                  <td>{formatMoney(item.precioVenta)}</td>
                  <td>{formatMoney(item.precioVenta * item.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: "right", marginTop: "15px", fontSize: "1.3rem", fontWeight: "bold" }}>
            TOTAL: {formatMoney(detalle.total)}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}>
            <button className="btn btn-light" onClick={() => setDetalle(null)}>Cerrar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
