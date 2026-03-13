 import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { hashPassword } from "../utils/utils";

export default function Registro() {
  const [nombre,   setNombre]   = useState("");
  const [correo,   setCorreo]   = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [cargando, setCargando] = useState(false);
  const [exitoso,  setExitoso]  = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const q = query(collection(db, "negocios"), where("correo", "==", correo));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setError("Ya existe una cuenta con ese correo");
        return;
      }

      const passwordHash = await hashPassword(password);

      const negocioRef = doc(collection(db, "negocios"));
      await setDoc(negocioRef, {
        nombre,
        correo,
        passwordHash,
        configuracion: {
          moneda:            "COP",
          alertaStockMinimo: 5,
          iva:               19,
        },
        creadoEn: new Date().toISOString(),
      });

      const adminRef = doc(db, "negocios", negocioRef.id, "usuarios", "admin");
      await setDoc(adminRef, {
        username:     "admin",
        nombre:       "Administrador",
        passwordHash,
        rol:          "administrador",
        creadoEn:     new Date().toISOString(),
      });

      setExitoso(true);
      setTimeout(() => navigate("/"), 3000);

    } catch (err) {
      setError("Error al registrarse: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  // ── Pantalla de éxito ──
  if (exitoso) {
    return (
      <div className="login-container">
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
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
          <h2>¡Cuenta creada!</h2>
          <p style={{ margin: "12px 0", color: "var(--text-secondary)" }}>
            Tu negocio fue registrado exitosamente.
          </p>
          <div style={{
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "8px", padding: "16px", margin: "16px 0"
          }}>
            <p style={{ margin: 0, fontSize: "14px" }}>
              👤 Usuario creado: <strong>admin</strong><br />
              🔑 Contraseña: <strong>la que registraste</strong>
            </p>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Redirigiendo al login...
          </p>
        </div>
      </div>
    );
  }

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
        <p className="subtitle">Crear cuenta</p>
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
            <label>Nombre del negocio</label>
            <input
              type="text"
              placeholder="Mi Tienda"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button
            className="btn"
            type="submit"
            style={{ width: "100%" }}
            disabled={cargando}
          >
            {cargando ? "⏳ Creando cuenta..." : "Crear Cuenta"}
          </button>

        </form>
      </div>

      <div className="login-footer">
        ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
      </div>
    </div>
  );
}
