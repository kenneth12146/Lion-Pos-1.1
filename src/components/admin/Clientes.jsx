import { useState } from "react";
import { useClientes } from "../../hooks/useClientes";
import { formatMoney, formatDate } from "../../utils/utils";
import Modal from "../shared/Modal";

const clienteVacio = { nombre: "", cedula: "", telefono: "", email: "" };

export default function Clientes() {
  const { clientes, cargando, agregar, editar, eliminar } = useClientes();
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(clienteVacio);
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const mostrarMensaje = (texto, tipo = "success") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.cedula?.includes(busqueda) ||
    c.telefono?.includes(busqueda)
  );

  const abrirModalNuevo = () => {
    setForm(clienteVacio);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (cliente) => {
    setForm(cliente);
    setEditandoId(cliente.id);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await editar(editandoId, form);
        mostrarMensaje("✅ Cliente actualizado");
      } else {
        await agregar(form);
        mostrarMensaje("✅ Cliente agregado");
      }
      setModalAbierto(false);
      setForm(clienteVacio);
    } catch (err) {
      mostrarMensaje("❌ " + err.message, "error");
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar cliente "${nombre}"?`)) return;
    try {
      await eliminar(id);
      mostrarMensaje("✅ Cliente eliminado");
    } catch (err) {
      mostrarMensaje("❌ " + err.message, "error");
    }
  };

  return (
    <div>
      {mensaje.texto && (
        <div className={`message ${mensaje.tipo} show`}>{mensaje.texto}</div>
      )}

      <div className="action-buttons">
        <button className="btn btn-primary" onClick={abrirModalNuevo}>
          + Agregar Cliente
        </button>
      </div>

      <div className="search-bar">
        <input type="text"
          placeholder="🔍 Buscar por nombre, cédula o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      <div className="card">
        <h3>👥 Clientes ({clientesFiltrados.length})</h3>
        {cargando ? <p>Cargando clientes...</p> : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Total Compras</th>
                <th>Total Gastado</th>
                <th>Última Compra</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: "center", padding: "30px" }}>
                  No hay clientes registrados
                </td></tr>
              ) : (
                clientesFiltrados.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.nombre}</strong></td>
                    <td>{c.cedula || "—"}</td>
                    <td>{c.telefono || "—"}</td>
                    <td><span className="badge badge-info">{c.totalCompras || 0}</span></td>
                    <td><strong>{formatMoney(c.totalGastado || 0)}</strong></td>
                    <td>{c.ultimaCompra ? formatDate(c.ultimaCompra) : "—"}</td>
                    <td>
                      <button className="btn btn-warning btn-sm"
                        style={{ marginRight: "8px" }}
                        onClick={() => abrirModalEditar(c)}>
                        ✏️
                      </button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => handleEliminar(c.id, c.nombre)}>
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

      {modalAbierto && (
        <Modal titulo={editandoId ? "✏️ Editar Cliente" : "➕ Nuevo Cliente"}
          onClose={() => setModalAbierto(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" value={form.nombre} required
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre completo" />
              </div>
              <div className="form-group">
                <label>Cédula</label>
                <input type="text" value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                  placeholder="Número de cédula" />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Ej: 3001234567" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="correo@email.com" />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button type="button" className="btn btn-light"
                onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">
                {editandoId ? "💾 Guardar" : "➕ Agregar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
