 import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { hashPassword } from "../utils/utils";

export default function SeleccionarRol() {
  const { sesion, login, logout } = useAuth();
  const navigate = useNavigate();

  const [paso,       setPaso]       = useState(1);
  const [rolElegido, setRolElegido] = useState("");
  const [usuario,    setUsuario]    = useState("");
  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState("");
  const [cargando,   setCargando]   = useState(false);

  const elegirRol = (rol) => {
    setRolElegido(rol);
    setError("");
    setPaso(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const usuarioRef  = doc(db, "negocios", sesion.id, "usuarios", usuario.toLowerCase().trim());
      const usuarioSnap = await getDoc(usuarioRef);

      if (!usuarioSnap.exists()) {
        setError("Usuario no encontrado");
        return;
      }

      const usuarioData = usuarioSnap.data();

      if (usuarioData.rol !== rolElegido) {
        setError(`Este usuario no tiene acceso como ${rolElegido}`);
        return;
      }

      const passwordHash = await hashPassword(password);
      if (usuarioData.passwordHash !== passwordHash) {
        setError("Contraseña incorrecta");
        return;
      }

      await login({
        ...sesion,
        rol:           usuarioData.rol,
        usuarioId:     usuario.toLowerCase().trim(),
        nombreUsuario: usuarioData.nombre,
      });

      navigate(usuarioData.rol === "administrador" ? "/admin" : "/cajero");

    } catch (err) {
      setError("Error al verificar: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-container">

      {/* ── Header con logo ── */}
      <div className="login-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", marginBottom: "8px" }}>
          <img
            src="/logo.png"
            alt="Lion POS"
            style={{
              width:        "56px",
              height:       "56px",
              borderRadius: "14px",
              objectFit:    "cover",
              boxShadow:    "0 0 24px rgba(245,158,11,0.5)",
            }}
          />
          <h1 style={{ margin: 0 }}>Lion<span style={{ color: "#f59e0b" }}>POS</span></h1>
        </div>
        <p className="subtitle">Bienvenido, {sesion?.nombre}</p>
      </div>

      <div className="card">

        {/* PASO 1 — Elegir rol */}
        {paso === 1 && (
          <>
            <h2 style={{ textAlign: "center", marginBottom: "24px" }}>
              ¿Cómo deseas ingresar?
            </h2>
            <div className="grid-2">
              <button
                className="btn"
                onClick={() => elegirRol("administrador")}
                style={{
                  padding: "30px", fontSize: "1.1rem",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "10px"
                }}
              >
                <span style={{ fontSize: "2.5rem" }}>🛠️</span>
                Administrador
              </button>

              <button
                className="btn light"
                onClick={() => elegirRol("cajero")}
                style={{
                  padding: "30px", fontSize: "1.1rem",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "10px"
                }}
              >
                <span style={{ fontSize: "2.5rem" }}>🛒</span>
                Cajero
              </button>
            </div>
          </>
        )}

        {/* PASO 2 — Credenciales */}
        {paso === 2 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <button
                onClick={() => { setPaso(1); setError(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-secondary)", fontSize: "20px", padding: 0
                }}
              >
                ←
              </button>
              <h2 style={{ margin: 0 }}>
                {rolElegido === "administrador" ? "🛠️ Administrador" : "🛒 Cajero"}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
                  background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171", fontSize: "14px",
                }}>
                  ❌ {error}
                </div>
              )}

              <div className="form-group">
                <label>Usuario</label>
                <input
                  type="text"
                  placeholder={rolElegido === "administrador" ? "admin" : "cajero"}
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                className="btn"
                type="submit"
                style={{ width: "100%" }}
                disabled={cargando}
              >
                {cargando ? "⏳ Verificando..." : "Entrar"}
              </button>
            </form>
          </>
        )}

      </div>

      <div className="login-footer">
        <button onClick={logout} className="btn warn" style={{ width: "100%", marginTop: "12px" }}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
