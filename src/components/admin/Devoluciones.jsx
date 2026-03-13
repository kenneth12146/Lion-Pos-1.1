import { useDevoluciones } from "../../hooks/useDevoluciones";
import { formatMoney, formatDate } from "../../utils/utils";
import { useState } from "react";
import Modal from "../shared/Modal";

export default function Devoluciones() {
  const { devoluciones, cargando } = useDevoluciones();
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState(null);

  const devolucionesFiltradas = devoluciones.filter(d =>
    d.id?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.motivo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const hoy = new Date().setHours(0, 0, 0, 0);
  const devolucionesHoy  = devoluciones.filter(d => d.timestamp >= hoy);
  const totalDevuelto    = devoluciones.reduce((sum, d) => sum + (d.total || 0), 0);

  return (
    <div>
      {/* ── Stats ── */}
      <div className="stats-grid" style={{ marginBottom: "25px" }}>
        <div className="stat-card red">
          <div className="icon">🔄</div>
          <h4>Total Devoluciones</h4>
          <div className="value">{devoluciones.length}</div>
        </div>
        <div className="stat-card orange">
          <div className="icon">📅</div>
          <h4>Devoluciones Hoy</h4>
          <div className="value">{devolucionesHoy.length}</div>
        </div>
        <div className="stat-card">
          <div className="icon">💸</div>
          <h4>Total Devuelto</h4>
          <div className="value">{formatMoney(totalDevuelto)}</div>
        </div>
      </div>

      {/* ── Búsqueda ── */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Buscar por ID, cliente, usuario o motivo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* ── Tabla ── */}
      <div className="card">
        <h3>🔄 Historial de Devoluciones ({devolucionesFiltradas.length})</h3>
        {cargando ? (
          <p style={{ color: "rgba(255,255,255,0.4)", padding: "20px 0" }}>
            Cargando devoluciones...
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                {["ID","Fecha","Venta Original","Cliente","Monto","Motivo","Usuario","Acciones"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devolucionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{
                    textAlign: "center", padding: "40px",
                    color: "rgba(255,255,255,0.25)", fontSize: "14px"
                  }}>
                    No hay devoluciones registradas
                  </td>
                </tr>
              ) : (
                devolucionesFiltradas.map(d => (
                  <tr key={d.id}>
                    <td>
                      <code style={{
                        background: "rgba(255,255,255,0.05)",
                        padding: "2px 7px", borderRadius: "5px",
                        fontSize: "12px", color: "#94a3b8"
                      }}>
                        {d.id}
                      </code>
                    </td>
                    <td style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
                      {formatDate(d.timestamp)}
                    </td>
                    <td>
                      <code style={{
                        background: "rgba(239,68,68,0.1)",
                        padding: "2px 7px", borderRadius: "5px",
                        fontSize: "12px", color: "#f87171"
                      }}>
                        {d.ventaId || "—"}
                      </code>
                    </td>
                    <td style={{ color: "#e2e8f0" }}>
                      {d.cliente?.nombre || "Mostrador"}
                    </td>
                    <td>
                      <strong style={{ color: "#f87171", fontWeight: "700" }}>
                        -{formatMoney(d.total)}
                      </strong>
                    </td>
                    <td>
                      <span style={{
                        maxWidth: "150px", display: "inline-block",
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap", color: "rgba(255,255,255,0.5)",
                        fontSize: "13px"
                      }}>
                        {d.motivo || "—"}
                      </span>
                    </td>
                    <td style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
                      {d.usuario || "Sistema"}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setDetalle(d)}
                      >
                        👁️ Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal detalle ── */}
      {detalle && (
        <Modal
          titulo={`🔄 Devolución ${detalle.id}`}
          onClose={() => setDetalle(null)}
        >
          {/* Info grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "18px",
            padding: "16px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
          }}>
            {/* ID Devolución */}
            <div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>
                ID Devolución:
              </div>
              <code style={{
                background: "rgba(255,255,255,0.05)",
                padding: "3px 8px", borderRadius: "6px",
                fontSize: "12px", color: "#94a3b8"
              }}>
                {detalle.id}
              </code>
            </div>

            {/* Venta Original */}
            <div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>
                Venta Original:
              </div>
              <code style={{
                background: "rgba(239,68,68,0.1)",
                padding: "3px 8px", borderRadius: "6px",
                fontSize: "12px", color: "#f87171"
              }}>
                {detalle.ventaId || "—"}
              </code>
            </div>

            {/* Fecha */}
            <div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>
                Fecha:
              </div>
              <div style={{ color: "#e2e8f0", fontSize: "13px" }}>
                {formatDate(detalle.timestamp)}
              </div>
            </div>

            {/* Usuario */}
            <div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>
                Usuario:
              </div>
              <div style={{ color: "#e2e8f0", fontSize: "13px" }}>
                {detalle.usuario}
              </div>
            </div>

            {/* Cliente */}
            <div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>
                Cliente:
              </div>
              <div style={{ color: "#e2e8f0", fontSize: "13px" }}>
                {detalle.cliente?.nombre || "Mostrador"}
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>
                Teléfono:
              </div>
              <div style={{ color: "#e2e8f0", fontSize: "13px" }}>
                {detalle.cliente?.telefono || "—"}
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div style={{
            padding: "13px 16px",
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderLeft: "3px solid #f59e0b",
            borderRadius: "10px",
            marginBottom: "20px",
            color: "#fbbf24",
            fontSize: "14px",
            fontWeight: "500",
          }}>
            📝 <strong style={{ color: "#fbbf24" }}>Motivo:</strong>{" "}
            <span style={{ color: "#fde68a" }}>
              {detalle.motivo || "No especificado"}
            </span>
          </div>

          {/* Productos devueltos */}
          <h4 style={{
            marginBottom: "12px", color: "#f0f4ff",
            fontSize: "14px", fontWeight: "600",
            display: "flex", alignItems: "center", gap: "8px"
          }}>
            📦 Productos devueltos:
          </h4>

          <table>
            <thead>
              <tr style={{
                background: "linear-gradient(90deg, rgba(59,130,246,0.15), rgba(6,182,212,0.08))",
                borderBottom: "1px solid rgba(59,130,246,0.25)"
              }}>
                {["Producto","Cantidad","Precio Unit.","Total"].map((h, i) => (
                  <th key={h} style={{
                    color: "#22d3ee",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    padding: "11px 14px",
                    textAlign: i === 0 ? "left" : "right",
                    background: "transparent",
                    fontWeight: "600",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detalle.items?.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "11px 14px", color: "#e2e8f0" }}>
                    {item.nombre}
                  </td>
                  <td style={{ padding: "11px 14px", color: "#94a3b8", textAlign: "right" }}>
                    {item.cantidad}
                  </td>
                  <td style={{ padding: "11px 14px", color: "#94a3b8", textAlign: "right" }}>
                    {formatMoney(item.precioVenta)}
                  </td>
                  <td style={{ padding: "11px 14px", color: "#f0f4ff", fontWeight: "600", textAlign: "right" }}>
                    {formatMoney(item.precioVenta * item.cantidad)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total devuelto */}
          <div style={{
            textAlign: "right",
            marginTop: "16px",
            padding: "14px 16px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "800",
            color: "#f87171",
            letterSpacing: "0.3px",
          }}>
            TOTAL DEVUELTO: <span style={{ fontSize: "18px" }}>-{formatMoney(detalle.total)}</span>
          </div>

          {/* Botón cerrar */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
            <button
              className="btn btn-light"
              onClick={() => setDetalle(null)}
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#f0f4ff",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "9px",
                padding: "9px 20px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background   = "rgba(239,68,68,0.12)";
                e.currentTarget.style.borderColor  = "#ef4444";
                e.currentTarget.style.color        = "#f87171";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background   = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor  = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color        = "#f0f4ff";
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
