import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { hashPassword } from "../utils/utils";

export default function Login() {
  const [correo,   setCorreo]   = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const q = query(collection(db, "negocios"), where("correo", "==", correo));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No existe una cuenta con ese correo");
        return;
      }

      const negocioId = snapshot.docs[0].id;
      const negocio   = snapshot.docs[0].data();

      const passwordHash = await hashPassword(password);
      if (negocio.passwordHash !== passwordHash) {
        setError("Contraseña incorrecta");
        return;
      }

      await login({
        id:     negocioId,
        nombre: negocio.nombre,
        correo: negocio.correo,
        rol:    null,
      });

      navigate("/seleccionar-rol");

    } catch (err) {
      setError("Error al iniciar sesión: " + err.message);
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
        <p className="subtitle">Sistema de Punto de Venta</p>
      </div>

      <div className="card">
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
            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="correo@empresa.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
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
            {cargando ? "⏳ Verificando..." : "Iniciar Sesión"}
          </button>

        </form>
      </div>

      <div className="login-footer">
        ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
      </div>
    </div>
  );
}
