import { useState } from "react";
import { useVentas } from "../../hooks/useVentas";
import { formatMoney, formatDate } from "../../utils/utils";
import Modal from "../shared/Modal";

export default function VentasPendientes() {
  const { ventas, cargando } = useVentas();
  const [detalle, setDetalle] = useState(null);

  const pendientes = ventas.filter(v => !v.synced);

  return (
    <div>
      <div className="card">
        <h3 style={{ color: "#06b6d4" }}>⏳ Ventas Pendientes ({pendientes.length})</h3>

        {cargando ? (
          <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "30px" }}>Cargando...</p>
        ) : pendientes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>✅</div>
            <p style={{ fontSize: "15px" }}>No hay ventas pendientes</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Método</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map(v => (
                  <tr key={v.docId || v.id}>
                    <td>
                      <code style={{ background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: "5px", fontSize: "12px", color: "#22d3ee" }}>
                        {v.id}
                      </code>
                    </td>
                    <td style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>{formatDate(v.timestamp)}</td>
                    <td style={{ color: "#f0f4ff" }}>{v.cliente?.nombre || "Mostrador"}</td>
                    <td style={{ fontWeight: "700", color: "#10b981" }}>{formatMoney(v.total)}</td>
                    <td><span className="badge badge-warning">{v.forma || "efectivo"}</span></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setDetalle(v)}>
                        👁️ Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detalle && (
        <Modal titulo={`🧾 Venta ${detalle.id}`} onClose={() => setDetalle(null)}>
          <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
              <strong style={{ color: "#f0f4ff" }}>Fecha:</strong> {formatDate(detalle.timestamp)}
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
              <strong style={{ color: "#f0f4ff" }}>Cliente:</strong> {detalle.cliente?.nombre || "Mostrador"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
              <strong style={{ color: "#f0f4ff" }}>Método:</strong>{" "}
              <span className="badge badge-info">{detalle.forma || "efectivo"}</span>
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr>
              </thead>
              <tbody>
                {detalle.items?.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: "#f0f4ff" }}>{item.nombre}</td>
                    <td style={{ color: "rgba(255,255,255,0.5)" }}>{item.cantidad}</td>
                    <td style={{ color: "rgba(255,255,255,0.5)" }}>{formatMoney(item.precioVenta)}</td>
                    <td style={{ color: "#10b981", fontWeight: "600" }}>{formatMoney(item.precioVenta * item.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "#f0f4ff" }}>
              TOTAL: <span style={{ color: "#10b981" }}>{formatMoney(detalle.total)}</span>
            </span>
            <button className="btn btn-light" onClick={() => setDetalle(null)}>Cerrar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
