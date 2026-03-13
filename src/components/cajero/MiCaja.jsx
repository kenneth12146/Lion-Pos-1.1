import { useVentas } from "../../hooks/useVentas";
import { useAuth } from "../../context/AuthContext";
import { formatMoney } from "../../utils/utils";

export default function MiCaja({
  cajaAbierta,
  setCajaAbierta,
  saldoInicial,
  setSaldoInicial,
  horaApertura,
  setHoraApertura,
}) {
  const { ventas }  = useVentas();
  const { sesion }  = useAuth();

  const hoy       = new Date().setHours(0, 0, 0, 0);
  const ventasHoy = ventas.filter(v => v.timestamp >= hoy && v.usuario === sesion?.nombre);

  const totalEfectivo      = ventasHoy.filter(v => v.forma === "efectivo" || !v.forma).reduce((s, v) => s + (v.total || 0), 0);
  const totalTarjeta       = ventasHoy.filter(v => v.forma === "tarjeta").reduce((s, v) => s + (v.total || 0), 0);
  const totalTransferencia = ventasHoy.filter(v => v.forma === "transferencia").reduce((s, v) => s + (v.total || 0), 0);
  const totalNequi         = ventasHoy.filter(v => v.forma === "nequi").reduce((s, v) => s + (v.total || 0), 0);
  const totalGeneral       = ventasHoy.reduce((s, v) => s + (v.total || 0), 0);
  const totalCaja          = saldoInicial + totalEfectivo;

  const border = "rgba(255,255,255,0.07)";

  return (
    <div>

      {/* ── Estado de caja ── */}
      <div className="card" style={{ borderTop: `3px solid ${cajaAbierta ? "#10b981" : "#ef4444"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 style={{ color: "#06b6d4", marginBottom: "6px" }}>💵 Estado de Caja</h3>
            <p style={{ color: cajaAbierta ? "#34d399" : "#f87171", fontWeight: "600", fontSize: "14px" }}>
              {cajaAbierta ? `✅ Abierta desde las ${horaApertura}` : "🔒 Caja Cerrada — Las ventas están bloqueadas"}
            </p>
          </div>

          {!cajaAbierta ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Saldo inicial
                </label>
                <input
                  type="number"
                  value={saldoInicial}
                  min="0"
                  onChange={(e) => setSaldoInicial(parseFloat(e.target.value) || 0)}
                  style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#f0f4ff", width: "160px", fontSize: "14px" }}
                />
              </div>
              <button
                className="btn btn-success"
                onClick={() => {
                  setCajaAbierta(true);
                  setHoraApertura(new Date().toLocaleTimeString("es-CO"));
                }}
              >
                🔓 Abrir Caja
              </button>
            </div>
          ) : (
            <button
              className="btn btn-danger"
              onClick={() => {
                if (confirm("¿Cerrar caja? Ya no se podrán realizar ventas.")) {
                  setCajaAbierta(false);
                  setSaldoInicial(0);
                  setHoraApertura(null);
                }
              }}
            >
              🔒 Cerrar Caja
            </button>
          )}
        </div>
      </div>

      {cajaAbierta && (
        <>
          {/* Stat cards */}
          <div className="stats-grid">
            {[
              { icon: "💵", label: "Efectivo",      value: totalEfectivo,      sub: `Caja: ${formatMoney(totalCaja)}`, color: ""       },
              { icon: "💳", label: "Tarjeta",       value: totalTarjeta,       sub: null,                               color: "green"  },
              { icon: "🏦", label: "Transferencia", value: totalTransferencia, sub: null,                               color: "purple" },
              { icon: "📱", label: "Nequi",         value: totalNequi,         sub: null,                               color: "orange" },
            ].map(s => (
              <div key={s.label} className={`stat-card ${s.color}`}>
                <span className="icon">{s.icon}</span>
                <h4>{s.label}</h4>
                <div className="value">{formatMoney(s.value)}</div>
                {s.sub && <div className="trend">{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Resumen del día */}
          <div className="card" style={{ borderTop: "3px solid #3b82f6" }}>
            <h3 style={{ color: "#06b6d4" }}>📊 Resumen del Día — {sesion?.nombre}</h3>
            <table>
              <tbody>
                {[
                  { label: "Saldo inicial",                                    valor: saldoInicial        },
                  { label: `Total ventas (${ventasHoy.length} transacciones)`, valor: totalGeneral        },
                  { label: "  ↳ Efectivo",                                     valor: totalEfectivo       },
                  { label: "  ↳ Tarjeta",                                      valor: totalTarjeta        },
                  { label: "  ↳ Transferencia",                                valor: totalTransferencia  },
                  { label: "  ↳ Nequi",                                        valor: totalNequi          },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>{row.label}</td>
                    <td style={{ textAlign: "right", color: "#f0f4ff", fontWeight: "600" }}>{formatMoney(row.valor)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${border}` }}>
                  <td style={{ fontWeight: "700", fontSize: "15px", color: "#f0f4ff", paddingTop: "12px" }}>
                    💰 Total en Caja (efectivo + inicial)
                  </td>
                  <td style={{ textAlign: "right", fontWeight: "700", fontSize: "1.2rem", color: "#10b981", paddingTop: "12px" }}>
                    {formatMoney(totalCaja)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
