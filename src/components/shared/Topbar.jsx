import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export default function Topbar({ seccion, onMenuToggle }) {
  const { sesion } = useAuth();
  const [logoNegocio, setLogoNegocio] = useState(null);

  const inicial = sesion?.nombre?.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    if (!sesion?.id) return;
    const cargarLogo = async () => {
      try {
        const snap = await getDoc(doc(db, "negocios", sesion.id));
        if (snap.exists() && snap.data()?.logo) {
          setLogoNegocio(snap.data().logo);
        }
      } catch (e) {
        console.error("Error cargando logo:", e);
      }
    };
    cargarLogo();
  }, [sesion?.id]);

  return (
    <div className="topbar">

      {/* ── Lado izquierdo ── */}
      <div className="topbar-left">
        <button
          className="topbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="Abrir menú">
          ☰
        </button>

        {/* Logo del programa + título */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/logo.png"
            alt="Lion POS"
            style={{
              width:        "32px",
              height:       "32px",
              borderRadius: "8px",
              objectFit:    "cover",
              boxShadow:    "0 0 12px rgba(245,158,11,0.4)",
            }}
          />
          <div>
            <div className="topbar-title">Lion POS</div>
            <div className="topbar-section">{seccion}</div>
          </div>
        </div>
      </div>

      {/* ── Lado derecho ── */}
      <div className="topbar-right">
        <div className="topbar-user">

          {/* Avatar con logo del negocio o inicial */}
          {logoNegocio ? (
            <img
              src={logoNegocio}
              alt="Logo negocio"
              className="topbar-avatar"
              style={{
                objectFit:    "cover",
                borderRadius: "10px",
                border:       "1px solid rgba(255,255,255,0.1)",
              }}
              onError={() => setLogoNegocio(null)}
            />
          ) : (
            <div className="topbar-avatar">{inicial}</div>
          )}

          <div className="topbar-user-info">
            <div className="topbar-user-name">{sesion?.nombre}</div>
            <div className="topbar-user-role">{sesion?.rol}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
