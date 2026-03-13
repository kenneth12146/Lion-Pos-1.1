import { useState } from "react";
import { useProductos } from "../../hooks/useProductos";
import { formatMoney } from "../../utils/utils";
import Modal from "../shared/Modal";
import ImageUploader from "../shared/ImageUploader";

const productoVacio = {
  codigo: "", nombre: "", categoria: "", cantidad: 0,
  precioCompra: 0, precioVenta: 0, imagen: ""
};

// ── Helpers formato COP ──────────────────────────────
const formatearCOP = (valor) => {
  const num = String(valor).replace(/\D/g, "");
  if (!num || num === "0") return "";
  return new Intl.NumberFormat("es-CO").format(parseInt(num));
};

const parsearNumero = (valor) => {
  return parseInt(String(valor).replace(/\D/g, "")) || 0;
};
// ────────────────────────────────────────────────────

export default function Inventario() {
  const { productos, cargando, agregar, editar, eliminar } = useProductos();
  const [busqueda, setBusqueda]         = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm]                 = useState(productoVacio);
  const [editandoId, setEditandoId]     = useState(null);
  const [mensaje, setMensaje]           = useState({ texto: "", tipo: "" });

  const mostrarMensaje = (texto, tipo = "success") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirModalNuevo = () => {
    setForm(productoVacio);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto) => {
    setForm(producto);
    setEditandoId(producto.id);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await editar(editandoId, form);
        mostrarMensaje("✅ Producto actualizado correctamente");
      } else {
        await agregar(form);
        mostrarMensaje("✅ Producto agregado correctamente");
      }
      setModalAbierto(false);
      setForm(productoVacio);
    } catch (err) {
      mostrarMensaje("❌ Error: " + err.message, "error");
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await eliminar(id);
      mostrarMensaje("✅ Producto eliminado");
    } catch (err) {
      mostrarMensaje("❌ Error: " + err.message, "error");
    }
  };

  // Estilo reutilizable para inputs de precio
  const inputPrecioWrapper = {
    position: "relative",
    display:  "flex",
    alignItems: "center",
  };

  const prefijoCOP = {
    position:      "absolute",
    left:          "12px",
    color:         "#94a3b8",
    fontSize:      "13px",
    pointerEvents: "none",
    userSelect:    "none",
  };

  return (
    <div>

      {/* Toast */}
      {mensaje.texto && (
        <div style={{
          padding:      "12px 20px",
          borderRadius: "10px",
          marginBottom: "20px",
          background:   mensaje.tipo === "error" ? "rgba(239,68,68,0.15)"  : "rgba(16,185,129,0.15)",
          border:       `1px solid ${mensaje.tipo === "error" ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}`,
          color:        mensaje.tipo === "error" ? "#ef4444" : "#10b981",
          fontSize:     "14px",
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Acciones */}
      <div className="action-buttons">
        <button className="btn btn-primary" onClick={abrirModalNuevo}>
          + Agregar Producto
        </button>
      </div>

      {/* Búsqueda */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, código o categoría..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="card">
        <h3 style={{ color: "#06b6d4", marginBottom: "16px" }}>
          📦 Inventario ({productosFiltrados.length} productos)
        </h3>

        {cargando ? (
          <p style={{ color: "#94a3b8", padding: "20px", textAlign: "center" }}>
            Cargando productos...
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>P. Compra</th>
                <th>P. Venta</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No hay productos
                  </td>
                </tr>
              ) : (
                productosFiltrados.map(p => (
                  <tr key={p.id}>
                    <td>
                      {p.imagen ? (
                        <img src={p.imagen} alt={p.nombre} style={{
                          width: "44px", height: "44px", borderRadius: "8px",
                          objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)",
                        }} />
                      ) : (
                        <div style={{
                          width: "44px", height: "44px", borderRadius: "8px",
                          background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
                        }}>📦</div>
                      )}
                    </td>
                    <td>
                      <code style={{
                        background: "rgba(255,255,255,0.06)", padding: "3px 8px",
                        borderRadius: "5px", fontSize: "12px", color: "#22d3ee",
                      }}>
                        {p.codigo}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600, color: "#f0f4ff" }}>{p.nombre}</td>
                    <td style={{ color: "#94a3b8" }}>{p.categoria || "—"}</td>
                    <td style={{ color: "#94a3b8" }}>{formatMoney(p.precioCompra)}</td>
                    <td style={{ color: "#10b981", fontWeight: 600 }}>{formatMoney(p.precioVenta)}</td>
                    <td>
                      <span className={`badge ${p.cantidad <= 5 ? "badge-danger" : "badge-success"}`}>
                        {p.cantidad}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-warning btn-sm"
                        onClick={() => abrirModalEditar(p)}
                        style={{ marginRight: "8px" }}>
                        ✏️ Editar
                      </button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => handleEliminar(p.id, p.nombre)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <Modal
          titulo={editandoId ? "✏️ Editar Producto" : "➕ Nuevo Producto"}
          onClose={() => setModalAbierto(false)}
        >
          <form onSubmit={handleSubmit}>

            {/* Imagen */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{
                  fontSize: "11px", color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px"
                }}>
                  Imagen del Producto
                </p>
                <ImageUploader
                  onUpload={(url) => setForm(prev => ({ ...prev, imagen: url }))}
                  preview={form.imagen || null}
                  label="Subir Imagen"
                />
              </div>
            </div>

            {/* Campos */}
            <div className="form-grid">

              <div className="form-group">
                <label>Código *</label>
                <input type="text" value={form.codigo} required
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="Ej: PROD001" />
              </div>

              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" value={form.nombre} required
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre del producto" />
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <input type="text" value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  placeholder="Ej: Bebidas" />
              </div>

              {/* Stock — solo enteros, sin flechas */}
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatearCOP(form.cantidad)}
                  onChange={(e) => setForm({ ...form, cantidad: parsearNumero(e.target.value) })}
                  placeholder="0"
                  style={{ appearance: "textfield" }}
                />
              </div>

              {/* Precio Compra */}
              <div className="form-group">
                <label>Precio Compra</label>
                <div style={inputPrecioWrapper}>
                  <span style={prefijoCOP}>$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatearCOP(form.precioCompra)}
                    onChange={(e) => setForm({ ...form, precioCompra: parsearNumero(e.target.value) })}
                    placeholder="0"
                    style={{ paddingLeft: "22px", width: "100%" }}
                  />
                </div>
              </div>

              {/* Precio Venta */}
              <div className="form-group">
                <label>Precio Venta</label>
                <div style={inputPrecioWrapper}>
                  <span style={prefijoCOP}>$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatearCOP(form.precioVenta)}
                    onChange={(e) => setForm({ ...form, precioVenta: parsearNumero(e.target.value) })}
                    placeholder="0"
                    style={{ paddingLeft: "22px", width: "100%" }}
                  />
                </div>
              </div>

            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button type="button" className="btn btn-light"
                onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editandoId ? "💾 Guardar Cambios" : "➕ Agregar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
