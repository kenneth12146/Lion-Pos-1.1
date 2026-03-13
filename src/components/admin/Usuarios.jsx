import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
import { collection, onSnapshot, updateDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { hashPassword } from "../../utils/utils";
import Modal from "../shared/Modal";

const usuarioVacio = { username: "", nombre: "", rol: "cajero", password: "" };

const ROL_BADGE = {
  administrador: { clase: "badge-warning", label: "👑 Admin"  },
  cajero:        { clase: "badge-info",    label: "🧾 Cajero" },
};

export default function Usuarios() {
  const { sesion } = useAuth();
  const [usuarios,     setUsuarios]     = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form,         setForm]         = useState(usuarioVacio);
  const [editandoId,   setEditandoId]   = useState(null);
  const [busqueda,     setBusqueda]     = useState("");
  const [mensaje,      setMensaje]      = useState({ texto: "", tipo: "" });
  const [procesando,   setProcesando]   = useState(false);

  // ── Cargar usuarios en tiempo real ──
  useEffect(() => {
    if (!sesion?.id) return;
    const ref = collection(db, `negocios/${sesion.id}/usuarios`);
    const unsub = onSnapshot(ref, (snap) => {
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCargando(false);
    });
    return () => unsub();
  }, [sesion]);

  const mostrarMensaje = (texto, tipo = "success") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3500);
  };

  const abrirNuevo = () => {
    setForm(usuarioVacio);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const abrirEditar = (u) => {
    setForm({ username: u.username, nombre: u.nombre, rol: u.rol, password: "" });
    setEditandoId(u.id);
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcesando(true);

    try {
      if (editandoId) {
        // ── Editar usuario existente ──
        const ref = doc(db, `negocios/${sesion.id}/usuarios`, editandoId);
        const updateData = {
          nombre: form.nombre,
          rol:    form.rol,
        };

        // Si escribió nueva contraseña, actualizarla
        if (form.password.length > 0) {
          if (form.password.length < 6) {
            mostrarMensaje("❌ La contraseña debe tener mínimo 6 caracteres", "error");
            return;
          }
          updateData.passwordHash = await hashPassword(form.password);
        }

        await updateDoc(ref, updateData);
        mostrarMensaje("✅ Usuario actualizado correctamente");

      } else {
        // ── Crear usuario nuevo ──
        if (!form.username.trim()) {
          mostrarMensaje("❌ El nombre de usuario es obligatorio", "error");
          return;
        }
        if (form.password.length < 6) {
          mostrarMensaje("❌ La contraseña debe tener mínimo 6 caracteres", "error");
          return;
        }

        // Validar que el username no exista ya
        const usernameClean = form.username.toLowerCase().trim();
        const existe = await getDoc(doc(db, `negocios/${sesion.id}/usuarios`, usernameClean));
        if (existe.exists()) {
          mostrarMensaje("❌ Ya existe un usuario con ese nombre de usuario", "error");
          return;
        }

        const passwordHash = await hashPassword(form.password);

        // El ID del documento ES el username
        await setDoc(doc(db, `negocios/${sesion.id}/usuarios`, usernameClean), {
          username:      usernameClean,
          nombre:        form.nombre,
          passwordHash,
          rol:           form.rol,
          activo:        true,
          negocioId:     sesion.id,
          fechaCreacion: Date.now(),
        });

        mostrarMensaje("✅ Usuario creado correctamente");
      }

      setModalAbierto(false);
      setForm(usuarioVacio);

    } catch (err) {
      mostrarMensaje("❌ " + err.message, "error");
    } finally {
      setProcesando(false);
    }
  };

  const toggleActivo = async (id, activo) => {
    try {
      await updateDoc(doc(db, `negocios/${sesion.id}/usuarios`, id), { activo: !activo });
      mostrarMensaje(`✅ Usuario ${!activo ? "activado" : "desactivado"}`);
    } catch (err) {
      mostrarMensaje("❌ " + err.message, "error");
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar usuario "${nombre}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, `negocios/${sesion.id}/usuarios`, id));
      mostrarMensaje("✅ Usuario eliminado");
    } catch (err) {
      mostrarMensaje("❌ " + err.message, "error");
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.username?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const surface = "rgba(255,255,255,0.04)";
  const border  = "rgba(255,255,255,0.08)";

  return (
    <div>

      {/* Toast */}
      {mensaje.texto && (
        <div style={{
          padding: "12px 18px", borderRadius: "9px", marginBottom: "18px",
          fontSize: "14px", fontWeight: "500",
          background: mensaje.tipo === "error" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
          border: `1px solid ${mensaje.tipo === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
          color:  mensaje.tipo === "error" ? "#f87171" : "#34d399",
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Acciones */}
      <div className="action-buttons">
        <button className="btn btn-primary" onClick={abrirNuevo}>
          + Agregar Usuario
        </button>
      </div>

      {/* Búsqueda */}
      <div className="search-bar">
        <input type="text" placeholder="🔍 Buscar por nombre o usuario..."
          value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      {/* Tabla */}
      <div className="card">
        <h3 style={{ color: "#06b6d4" }}>👥 Usuarios ({usuariosFiltrados.length})</h3>

        {cargando ? (
          <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "30px" }}>
            Cargando usuarios...
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }}>
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map(u => (
                    <tr key={u.id}>

                      {/* Nombre con avatar */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0,
                            background: u.rol === "administrador"
                              ? "linear-gradient(135deg,#f59e0b,#d97706)"
                              : "linear-gradient(135deg,#3b82f6,#06b6d4)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: "700", fontSize: "15px", color: "white",
                          }}>
                            {u.nombre?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span style={{ fontWeight: "600", color: "#f0f4ff" }}>{u.nombre}</span>
                        </div>
                      </td>

                      {/* Username */}
                      <td>
                        <span style={{
                          background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)",
                          borderRadius: "6px", padding: "3px 8px", fontSize: "13px",
                          color: "#22d3ee", fontFamily: "monospace"
                        }}>
                          @{u.username || u.id}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${ROL_BADGE[u.rol]?.clase || "badge-info"}`}>
                          {ROL_BADGE[u.rol]?.label || u.rol}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${u.activo ? "badge-success" : "badge-danger"}`}>
                          {u.activo ? "● Activo" : "● Inactivo"}
                        </span>
                      </td>

                      <td style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                        {u.fechaCreacion
                          ? new Date(u.fechaCreacion).toLocaleDateString("es-CO")
                          : "—"}
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-warning btn-sm"
                            title="Editar"
                            onClick={() => abrirEditar(u)}>
                            ✏️
                          </button>
                          <button
                            className={`btn btn-sm ${u.activo ? "btn-danger" : "btn-success"}`}
                            title={u.activo ? "Desactivar" : "Activar"}
                            onClick={() => toggleActivo(u.id, u.activo)}>
                            {u.activo ? "🚫" : "✅"}
                          </button>
                          <button className="btn btn-danger btn-sm"
                            title="Eliminar"
                            onClick={() => handleEliminar(u.id, u.nombre)}>
                            🗑️
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {modalAbierto && (
        <Modal
          titulo={editandoId ? "✏️ Editar Usuario" : "➕ Nuevo Usuario"}
          onClose={() => setModalAbierto(false)}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">

              <div className="form-group">
                <label>Nombre completo *</label>
                <input type="text" value={form.nombre} required
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Juan Pérez" />
              </div>

              <div className="form-group">
                <label>Usuario * <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>(para iniciar sesión)</span></label>
                <input
                  type="text"
                  value={form.username}
                  required={!editandoId}
                  disabled={!!editandoId}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                  placeholder="Ej: cajero1"
                  style={editandoId ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                />
                {editandoId && (
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px", display: "block" }}>
                    ⚠️ El usuario no se puede cambiar
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Rol</label>
                <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  <option value="cajero">🧾 Cajero</option>
                  <option value="administrador">👑 Administrador</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Contraseña {editandoId ? "(dejar vacío para no cambiar)" : "*"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  required={!editandoId}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

            </div>

            {/* Info según rol */}
            <div style={{
              padding: "11px 14px", borderRadius: "9px", marginTop: "4px",
              background: form.rol === "administrador"
                ? "rgba(245,158,11,0.08)" : "rgba(6,182,212,0.08)",
              border: `1px solid ${form.rol === "administrador"
                ? "rgba(245,158,11,0.2)" : "rgba(6,182,212,0.2)"}`,
              fontSize: "13px",
              color: form.rol === "administrador" ? "#fbbf24" : "#22d3ee",
            }}>
              {form.rol === "administrador"
                ? "👑 Tendrá acceso completo al panel de administración"
                : "🧾 Solo tendrá acceso al punto de venta"}
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button type="button" className="btn btn-light"
                onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={procesando}>
                {procesando
                  ? "⏳ Procesando..."
                  : editandoId ? "💾 Guardar Cambios" : "➕ Crear Usuario"}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
