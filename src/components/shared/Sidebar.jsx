import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const menuAdmin = [
  { key: "estadisticas", icon: "📊", label: "Estadísticas" },
  { key: "inventario",   icon: "📦", label: "Inventario" },
  { key: "ventas",       icon: "💰", label: "Ventas" },
  { key: "devoluciones", icon: "🔄", label: "Devoluciones" },
  { key: "clientes",     icon: "👥", label: "Clientes" },
  { key: "usuarios",     icon: "👤", label: "Usuarios" },
  { key: "ajustes",      icon: "⚙️",  label: "Ajustes" },
];

const menuCajero = [
  { key: "vender",     icon: "🛒", label: "Punto de Venta" },
  { key: "pendientes", icon: "⏳", label: "Ventas Pendientes" },
  { key: "historial",  icon: "📋", label: "Mi Historial" },
  { key: "caja",       icon: "💵", label: "Mi Caja" },
];

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const setSize = () => {
      canvas.width  = 260;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];

    const particles = Array.from({ length: 55 }, (_, i) => ({
      x:     Math.random() * 260,
      y:     Math.random() * window.innerHeight,
      r:     Math.random() * 2.5 + 0.8,
      vx:    (Math.random() - 0.5) * 0.5,
      vy:    (Math.random() - 0.5) * 0.5,
      ci:    i % COLORS.length,
      timer: Math.floor(Math.random() * 180),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.timer++;
        if (p.timer > 180) { p.timer = 0; p.ci = (p.ci + 1) % COLORS.length; }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            ctx.beginPath();
            ctx.globalAlpha = (1 - d / 80) * 0.25;
            ctx.strokeStyle = COLORS[p.ci];
            ctx.lineWidth   = 0.6;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        ctx.globalAlpha = 0.85;
        ctx.shadowColor = COLORS[p.ci];
        ctx.shadowBlur  = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[p.ci];
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", setSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        display: "block",
      }}
    />
  );
}

const S = {
  sidebar: {
    position:      "fixed",
    left:          0,
    top:           0,
    width:         "260px",
    height:        "100vh",
    background:    "#070b14",
    borderRight:   "1px solid rgba(255,255,255,0.07)",
    overflowY:     "auto",
    overflowX:     "hidden",
    zIndex:        1000,
    transition:    "left 0.3s ease",
    display:       "flex",
    flexDirection: "column",
  },
  content: {
    position:      "relative",
    zIndex:        1,
    display:       "flex",
    flexDirection: "column",
    flex:          1,
    minHeight:     "100%",
  },
  header: {
    padding:      "22px 18px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background:   "rgba(0,0,0,0.3)",
  },
  brand: {
    display:      "flex",
    alignItems:   "center",
    gap:          "10px",
    marginBottom: "18px",
  },
  brandName: {
    fontSize:      "20px",
    fontWeight:    800,
    color:         "#f0f4ff",
    letterSpacing: "0.5px",
    fontFamily:    "inherit",
  },
  brandSpan: { color: "#f59e0b" },
  userBox: {
    display:      "flex",
    alignItems:   "center",
    gap:          "10px",
    padding:      "10px 12px",
    background:   "rgba(255,255,255,0.04)",
    borderRadius: "10px",
    border:       "1px solid rgba(255,255,255,0.07)",
  },
  avatar: {
    width:          "40px",
    height:         "40px",
    borderRadius:   "10px",
    background:     "linear-gradient(135deg,#8b5cf6,#3b82f6)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontWeight:     700,
    fontSize:       "16px",
    color:          "white",
    flexShrink:     0,
    boxShadow:      "0 0 14px rgba(139,92,246,0.5)",
  },
  avatarImg: {
    width:        "40px",
    height:       "40px",
    borderRadius: "10px",
    objectFit:    "cover",
    flexShrink:   0,
    boxShadow:    "0 0 14px rgba(139,92,246,0.5)",
    border:       "1px solid rgba(255,255,255,0.1)",
  },
  userName: {
    fontSize:     "13px",
    fontWeight:   600,
    color:        "#f0f4ff",
    whiteSpace:   "nowrap",
    overflow:     "hidden",
    textOverflow: "ellipsis",
  },
  userRole: {
    fontSize:      "11px",
    color:         "#4a5568",
    textTransform: "capitalize",
    marginTop:     "2px",
  },
  sectionTitle: {
    padding:       "14px 18px 6px",
    fontSize:      "10px",
    textTransform: "uppercase",
    letterSpacing: "2px",
    color:         "rgba(255,255,255,0.2)",
    fontWeight:    600,
    fontFamily:    "inherit",
  },
  menu: {
    listStyle: "none",
    padding:   "4px 10px",
    margin:    0,
  },
  menuLink: (active) => ({
    display:        "flex",
    alignItems:     "center",
    gap:            "11px",
    padding:        active ? "11px 11px" : "11px 13px",
    color:          active ? "#22d3ee" : "rgba(255,255,255,0.5)",
    textDecoration: "none",
    fontSize:       "14px",
    fontWeight:     active ? 600 : 500,
    borderRadius:   "9px",
    marginBottom:   "2px",
    background:     active
      ? "linear-gradient(90deg,rgba(59,130,246,0.2),rgba(6,182,212,0.07))"
      : "transparent",
    borderLeft:     active ? "2px solid #3b82f6" : "2px solid transparent",
    transition:     "all 0.2s",
    cursor:         "pointer",
    fontFamily:     "inherit",
    border:         "none",
    width:          "100%",
    textAlign:      "left",
  }),
  menuIcon: {
    fontSize:   "17px",
    width:      "22px",
    textAlign:  "center",
    flexShrink: 0,
  },
  divider: {
    height:     "1px",
    background: "rgba(255,255,255,0.05)",
    margin:     "8px 18px",
  },
  logoutLink: {
    display:        "flex",
    alignItems:     "center",
    gap:            "11px",
    padding:        "11px 13px",
    color:          "rgba(239,68,68,0.7)",
    textDecoration: "none",
    fontSize:       "14px",
    fontWeight:     500,
    borderRadius:   "9px",
    marginBottom:   "2px",
    background:     "transparent",
    transition:     "all 0.2s",
    cursor:         "pointer",
    fontFamily:     "inherit",
    border:         "none",
    width:          "100%",
    textAlign:      "left",
  },
};

export default function Sidebar({ tipo, seccionActiva, setSeccion, className }) {
  const { sesion, logout } = useAuth();
  const menu    = tipo === "admin" ? menuAdmin : menuCajero;
  const inicial = sesion?.nombre?.charAt(0).toUpperCase() || "U";
  const isOpen  = className?.includes("open");

  const [logoNegocio, setLogoNegocio] = useState(null);

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
    <aside
      style={{ ...S.sidebar, left: isOpen ? 0 : undefined }}
      className={`sidebar ${className || ""}`}
    >
      <ParticleCanvas />

      <div style={S.content}>

        <div style={S.header}>

          {/* ── Brand con logo del programa ── */}
          <div style={S.brand}>
            <img
              src="public/logo.png"
              alt="Lion POS"
              style={{
                width:        "38px",
                height:       "38px",
                borderRadius: "10px",
                objectFit:    "cover",
                flexShrink:   0,
                boxShadow:    "0 0 18px rgba(245,158,11,0.5)",
              }}
            />
            <div style={S.brandName}>
              Lion<span style={S.brandSpan}>POS</span>
            </div>
          </div>

          {/* ── Usuario / logo del negocio ── */}
          <div style={S.userBox}>
            {logoNegocio ? (
              <img
                src={logoNegocio}
                alt="Logo negocio"
                style={S.avatarImg}
                onError={() => setLogoNegocio(null)}
              />
            ) : (
              <div style={S.avatar}>{inicial}</div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={S.userName}>{sesion?.nombre || "Usuario"}</div>
              <div style={S.userRole}>{sesion?.rol || tipo}</div>
            </div>
          </div>
        </div>

        <div style={S.sectionTitle}>Navegación</div>
        <ul style={S.menu}>
          {menu.map(item => (
            <li key={item.key}>
              <button
                style={S.menuLink(seccionActiva === item.key)}
                onClick={() => setSeccion(item.key)}
                onMouseEnter={e => {
                  if (seccionActiva !== item.key) {
                    e.currentTarget.style.background = "rgba(59,130,246,0.1)";
                    e.currentTarget.style.color      = "#f0f4ff";
                    e.currentTarget.style.transform  = "translateX(4px)";
                  }
                }}
                onMouseLeave={e => {
                  if (seccionActiva !== item.key) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color      = "rgba(255,255,255,0.5)";
                    e.currentTarget.style.transform  = "none";
                  }
                }}
              >
                <span style={S.menuIcon}>{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {tipo === "admin" && (
          <>
            <div style={S.sectionTitle}>Sistema</div>
            <ul style={S.menu}>
              <li>
                <button
                  style={S.menuLink(false)}
                  onClick={() => window.location.href = "/seleccionar-rol"}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(59,130,246,0.1)";
                    e.currentTarget.style.color      = "#f0f4ff";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color      = "rgba(255,255,255,0.5)";
                  }}
                >
                  <span style={S.menuIcon}>🔀</span>
                  Cambiar Rol
                </button>
              </li>
            </ul>
          </>
        )}

        <div style={{ flex: 1 }} />
        <div style={S.divider} />
        <ul style={{ ...S.menu, paddingBottom: "16px" }}>
          <li>
            <button
              style={S.logoutLink}
              onClick={logout}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                e.currentTarget.style.color      = "#ef4444";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color      = "rgba(239,68,68,0.7)";
              }}
            >
              <span style={S.menuIcon}>🚪</span>
              Cerrar Sesión
            </button>
          </li>
        </ul>

      </div>
    </aside>
  );
}
