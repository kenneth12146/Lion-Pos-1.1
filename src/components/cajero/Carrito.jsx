import { useState } from "react";
import { useVentas } from "../../hooks/useVentas";
import { useClientes } from "../../hooks/useClientes";
import { useAuth } from "../../context/AuthContext";
import { formatMoney } from "../../utils/utils";
import Modal from "../shared/Modal";
import Factura from "./Factura";

export default function Carrito({ items, setItems }) {
  const { registrar } = useVentas();
  const { sesion } = useAuth();
  const { clientes, agregar: agregarCliente, actualizarEstadisticas } = useClientes();
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [procesando, setProcesando] = useState(false);
  const [facturaVenta, setFacturaVenta] = useState(null);
  const [descuento, setDescuento] = useState(0);

  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", cedula: "", telefono: "", email: "" });

  const mostrarMensaje = (texto, tipo = "success") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3500);
  };

  const handleBuscarCliente = (valor) => {
    setBusquedaCliente(valor);
    if (!valor.trim()) { setClienteSeleccionado(null); return; }
    const encontrado = clientes.find(c =>
      c.cedula?.includes(valor) ||
      c.nombre?.toLowerCase().includes(valor.toLowerCase()) ||
      c.telefono?.includes(valor)
    );
    setClienteSeleccionado(encontrado || null);
  };

  const handleRegistrarNuevoCliente = async (e) => {
    e.preventDefault();
    try {
      await agregarCliente(nuevoCliente);
      const clienteCreado = clientes.find(c => c.cedula === nuevoCliente.cedula) || {
        nombre: nuevoCliente.nombre, cedula: nuevoCliente.cedula, telefono: nuevoCliente.telefono
      };
      setClienteSeleccionado(clienteCreado);
      setBusquedaCliente(nuevoCliente.cedula);
      setModalClienteAbierto(false);
      setNuevoCliente({ nombre: "", cedula: "", telefono: "", email: "" });
      mostrarMensaje("✅ Cliente registrado correctamente");
    } catch (err) {
      mostrarMensaje("❌ " + err.message, "error");
    }
  };

  const subtotal       = items.reduce((sum, i) => sum + i.precioVenta * i.cantidad, 0);
  const montoDescuento = subtotal * (descuento / 100);
  const total          = subtotal - montoDescuento;

  const cambiarCantidad = (id, delta) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i));

  const eliminarItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  // ── COBRAR — sanitizado para Firestore ──
  const handleCobrar = async () => {
    if (items.length === 0) { mostrarMensaje("❌ El carrito está vacío", "error"); return; }
    setProcesando(true);
    try {
      const datosVenta = {
        // Sanitizar items — eliminar cualquier campo undefined
        items: items.map(i => ({
          id:          i.id          || null,
          nombre:      i.nombre      || "",
          precioVenta: i.precioVenta || 0,
          cantidad:    i.cantidad    || 1,
          subtotal:    (i.precioVenta || 0) * (i.cantidad || 1),
        })),
        total,
        subtotal,
        descuento:           montoDescuento,
        porcentajeDescuento: descuento,
        forma:               metodoPago,

        // Sanitizar cliente — nunca dejar undefined
        cliente: clienteSeleccionado
          ? {
              id:       clienteSeleccionado.id       || null,
              nombre:   clienteSeleccionado.nombre   || "",
              cedula:   clienteSeleccionado.cedula   || "",
              telefono: clienteSeleccionado.telefono || "",
            }
          : { id: null, nombre: "Mostrador", telefono: "" },
      };

      const ventaId   = await registrar(datosVenta);
      const ventaData = { id: ventaId, ...datosVenta, usuario: sesion?.nombre || "", timestamp: Date.now() };

      if (clienteSeleccionado?.id) await actualizarEstadisticas(clienteSeleccionado.id, total);

      if (clienteSeleccionado?.telefono) {
        const resumen = items.map(i =>
          `• ${i.nombre} x${i.cantidad}: ${formatMoney(i.precioVenta * i.cantidad)}`
        ).join("\n");
        const msg = encodeURIComponent(
          `🦁 *Lion POS - Recibo de compra*\n\n${resumen}` +
          `${descuento > 0 ? `\nDescuento: -${formatMoney(montoDescuento)}` : ""}` +
          `\n\n*TOTAL: ${formatMoney(total)}*\n\nGracias por su compra! 🙌`
        );
        window.open(`https://wa.me/57${clienteSeleccionado.telefono.replace(/\D/g, "")}?text=${msg}`, "_blank");
      }

      setFacturaVenta(ventaData);
      mostrarMensaje("✅ Venta registrada correctamente");
      setItems([]);
      setClienteSeleccionado(null);
      setBusquedaCliente("");
      setDescuento(0);
    } catch (err) {
      mostrarMensaje("❌ " + err.message, "error");
    } finally {
      setProcesando(false);
    }
  };

  // ── Tokens de color reutilizables ──
  const surface   = "rgba(255,255,255,0.04)";
  const border    = "rgba(255,255,255,0.08)";
  const textMuted = "rgba(255,255,255,0.4)";

  return (
    <div className="card">
      <h3 style={{ color: "#06b6d4" }}>🛒 Carrito de Venta</h3>

      {/* Toast */}
      {mensaje.texto && (
        <div style={{
          padding: "12px 16px", borderRadius: "9px", marginBottom: "14px", fontSize: "14px",
          background: mensaje.tipo === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
          border: `1px solid ${mensaje.tipo === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
          color: mensaje.tipo === "error" ? "#f87171" : "#34d399",
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* ── Cliente ── */}
      <div style={{ padding: "14px", background: surface, borderRadius: "10px", border: `1px solid ${border}`, marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontWeight: "600", fontSize: "13px", color: "#f0f4ff" }}>👤 Cliente</span>
          <button className="btn btn-primary btn-sm"
            style={{ fontSize: "11px", padding: "4px 10px" }}
            onClick={() => setModalClienteAbierto(true)}>
            + Nuevo
          </button>
          {clienteSeleccionado && (
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: "18px", lineHeight: 1 }}
              onClick={() => { setClienteSeleccionado(null); setBusquedaCliente(""); }}>×</button>
          )}
        </div>

        <input type="text"
          placeholder="🔍 Buscar por cédula, nombre o teléfono..."
          value={busquedaCliente}
          onChange={(e) => handleBuscarCliente(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${border}`, background: "rgba(255,255,255,0.04)", color: "#f0f4ff", fontSize: "13px" }} />

        {clienteSeleccionado && (
          <div style={{ marginTop: "10px", padding: "10px 14px", background: "rgba(16,185,129,0.1)", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ color: "#34d399", fontSize: "13px" }}>✅ {clienteSeleccionado.nombre}</strong>
                {clienteSeleccionado.cedula && <span style={{ color: "#34d399", fontSize: "12px" }}> — CC: {clienteSeleccionado.cedula}</span>}
                {clienteSeleccionado.telefono && <div style={{ fontSize: "12px", color: "#34d399", marginTop: "2px" }}>📱 {clienteSeleccionado.telefono}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                {clienteSeleccionado.totalCompras >= 5 && <span className="badge badge-warning" style={{ fontSize: "10px" }}>⭐ Frecuente</span>}
                {clienteSeleccionado.totalGastado > 0 && (
                  <div style={{ fontSize: "11px", color: textMuted, marginTop: "4px" }}>
                    💰 {formatMoney(clienteSeleccionado.totalGastado)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {busquedaCliente && !clienteSeleccionado && (
          <div style={{ marginTop: "10px", padding: "9px 12px", background: "rgba(245,158,11,0.1)", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.25)", fontSize: "13px", color: "#fbbf24" }}>
            ⚠️ Cliente no encontrado.{" "}
            <span style={{ color: "#22d3ee", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => { setNuevoCliente(p => ({ ...p, cedula: busquedaCliente })); setModalClienteAbierto(true); }}>
              ¿Registrarlo ahora?
            </span>
          </div>
        )}
      </div>

      {/* ── Items del carrito ── */}
      <div style={{ minHeight: "120px", maxHeight: "260px", overflowY: "auto", marginBottom: "12px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 20px", color: textMuted }}>
            🛍️ Carrito vacío — clic en un producto para agregar
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 0", borderBottom: `1px solid ${border}`
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "13px", color: "#f0f4ff" }}>{item.nombre}</div>
                <div style={{ color: "#10b981", fontWeight: "600", fontSize: "13px" }}>{formatMoney(item.precioVenta)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button onClick={() => cambiarCantidad(item.id, -1)} style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  border: `1px solid ${border}`, cursor: "pointer",
                  background: surface, color: "#f0f4ff", fontSize: "16px", lineHeight: 1
                }}>−</button>
                <span style={{ minWidth: "22px", textAlign: "center", fontWeight: "700", color: "#f0f4ff" }}>{item.cantidad}</span>
                <button onClick={() => cambiarCantidad(item.id, 1)} style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  border: `1px solid ${border}`, cursor: "pointer",
                  background: surface, color: "#f0f4ff", fontSize: "16px", lineHeight: 1
                }}>+</button>
              </div>
              <div style={{ minWidth: "80px", textAlign: "right", fontWeight: "700", fontSize: "13px", color: "#f0f4ff" }}>
                {formatMoney(item.precioVenta * item.cantidad)}
              </div>
              <button onClick={() => eliminarItem(item.id)} style={{
                background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: "20px", lineHeight: 1
              }}>×</button>
            </div>
          ))
        )}
      </div>

      {/* ── Descuento ── */}
      {items.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", padding: "10px 14px", background: surface, borderRadius: "9px", border: `1px solid ${border}` }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#f0f4ff" }}>🏷️ Descuento:</span>
          <input type="number" value={descuento} min="0" max="100"
            onChange={(e) => setDescuento(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
            style={{ width: "70px", padding: "6px 8px", borderRadius: "7px", border: `1px solid ${border}`, textAlign: "center", background: "rgba(255,255,255,0.06)", color: "#f0f4ff", fontSize: "14px" }} />
          <span style={{ color: textMuted, fontSize: "13px" }}>%</span>
          {descuento > 0 && (
            <span style={{ color: "#f87171", fontSize: "13px", fontWeight: "600", marginLeft: "auto" }}>
              -{formatMoney(montoDescuento)}
            </span>
          )}
        </div>
      )}

      {/* ── Métodos de pago ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
        {[
          { id: "efectivo",      icon: "💵", label: "Efectivo" },
          { id: "tarjeta",       icon: "💳", label: "Tarjeta" },
          { id: "transferencia", icon: "🏦", label: "Transferencia" },
          { id: "nequi",         icon: "📱", label: "Nequi" }
        ].map(m => (
          <button key={m.id} onClick={() => setMetodoPago(m.id)} style={{
            padding: "10px 8px", borderRadius: "9px", cursor: "pointer", fontSize: "13px", fontWeight: "600",
            border: metodoPago === m.id ? "2px solid #3b82f6" : `1px solid ${border}`,
            background: metodoPago === m.id ? "rgba(59,130,246,0.15)" : surface,
            color: metodoPago === m.id ? "#22d3ee" : textMuted,
            transition: "all 0.2s"
          }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* ── Resumen total ── */}
      {items.length > 0 && (
        <div style={{ padding: "14px", background: surface, borderRadius: "10px", border: `1px solid ${border}`, marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: textMuted, marginBottom: "6px" }}>
            <span>Subtotal</span><span style={{ color: "#f0f4ff" }}>{formatMoney(subtotal)}</span>
          </div>
          {descuento > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#f87171", marginBottom: "6px" }}>
              <span>Descuento ({descuento}%)</span><span>-{formatMoney(montoDescuento)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "1.25rem", borderTop: `1px solid ${border}`, paddingTop: "10px", marginTop: "4px" }}>
            <span style={{ color: "#f0f4ff" }}>TOTAL</span>
            <span style={{ color: "#10b981" }}>{formatMoney(total)}</span>
          </div>
        </div>
      )}

      {/* ── Botón cobrar ── */}
      <button onClick={handleCobrar} disabled={procesando || items.length === 0} style={{
        width: "100%", padding: "14px", fontSize: "1rem", fontWeight: "700",
        borderRadius: "10px", border: "none", cursor: items.length === 0 ? "not-allowed" : "pointer",
        background: items.length === 0
          ? "rgba(255,255,255,0.06)"
          : "linear-gradient(135deg, #10b981, #059669)",
        color: items.length === 0 ? textMuted : "white",
        boxShadow: items.length === 0 ? "none" : "0 4px 16px rgba(16,185,129,0.35)",
        transition: "all 0.2s", marginBottom: "8px"
      }}>
        {procesando ? "⏳ Procesando..." : `💰 Cobrar ${formatMoney(total)}`}
        {clienteSeleccionado?.telefono && " 📱"}
      </button>

      {items.length > 0 && (
        <button onClick={() => { if (confirm("¿Limpiar carrito?")) setItems([]); }} style={{
          width: "100%", padding: "9px", borderRadius: "9px",
          border: `1px solid ${border}`, cursor: "pointer",
          background: surface, color: textMuted, fontSize: "13px"
        }}>
          🗑️ Limpiar Carrito
        </button>
      )}

      {/* ── Modal nuevo cliente ── */}
      {modalClienteAbierto && (
        <Modal titulo="➕ Registrar Nuevo Cliente" onClose={() => setModalClienteAbierto(false)}>
          <form onSubmit={handleRegistrarNuevoCliente}>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input type="text" required value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                placeholder="Nombre del cliente" />
            </div>
            <div className="form-group">
              <label>Cédula</label>
              <input type="text" value={nuevoCliente.cedula}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, cedula: e.target.value })}
                placeholder="Número de cédula" />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input type="text" value={nuevoCliente.telefono}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                placeholder="Ej: 3001234567" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={nuevoCliente.email}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                placeholder="correo@email.com" />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button type="button" className="btn btn-light" onClick={() => setModalClienteAbierto(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">➕ Registrar Cliente</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Factura automática ── */}
      {facturaVenta && <Factura venta={facturaVenta} onClose={() => setFacturaVenta(null)} />}
    </div>
  );
}
