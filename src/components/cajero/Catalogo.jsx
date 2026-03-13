import { useState } from "react";
import { useProductos } from "../../hooks/useProductos";
import { formatMoney } from "../../utils/utils";

export default function Catalogo({ onAgregarAlCarrito }) {
  const { productos, cargando } = useProductos();
  const [busqueda, setBusqueda]           = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [vista, setVista]                 = useState("grid"); // "grid" | "lista"

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];

  const productosFiltrados = productos
    .filter(p => p.cantidad > 0)
    .filter(p => categoriaActiva ? p.categoria === categoriaActiva : true)
    .filter(p =>
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
    );

  const surface = "rgba(255,255,255,0.04)";
  const border  = "rgba(255,255,255,0.08)";

  return (
    <div className="card">

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ color: "#06b6d4", margin: 0 }}>
          📦 Productos ({productosFiltrados.length})
        </h3>

        {/* Toggle vista */}
        <div style={{ display: "flex", gap: "4px", background: surface, borderRadius: "9px", padding: "4px", border: `1px solid ${border}` }}>
          <button onClick={() => setVista("grid")} title="Vista Grid" style={{
            width: "34px", height: "30px", borderRadius: "7px", border: "none",
            cursor: "pointer", fontSize: "15px", transition: "all 0.2s",
            background: vista === "grid" ? "rgba(59,130,246,0.25)" : "transparent",
            color: vista === "grid" ? "#22d3ee" : "rgba(255,255,255,0.35)",
          }}>⊞</button>
          <button onClick={() => setVista("lista")} title="Vista Lista" style={{
            width: "34px", height: "30px", borderRadius: "7px", border: "none",
            cursor: "pointer", fontSize: "15px", transition: "all 0.2s",
            background: vista === "lista" ? "rgba(59,130,246,0.25)" : "transparent",
            color: vista === "lista" ? "#22d3ee" : "rgba(255,255,255,0.35)",
          }}>☰</button>
        </div>
      </div>

      {/* ── Búsqueda ── */}
      <div className="search-bar" style={{ marginBottom: "12px" }}>
        <input type="text"
          placeholder="🔍 Buscar producto o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      {/* ── Categorías ── */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
        <button onClick={() => setCategoriaActiva("")} style={{
          padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
          cursor: "pointer", border: "none", transition: "all 0.2s",
          background: categoriaActiva === "" ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : surface,
          color: categoriaActiva === "" ? "white" : "rgba(255,255,255,0.45)",
        }}>Todos</button>
        {categorias.map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{
            padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
            cursor: "pointer", border: `1px solid ${border}`, transition: "all 0.2s",
            background: categoriaActiva === cat ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : surface,
            color: categoriaActiva === cat ? "white" : "rgba(255,255,255,0.45)",
          }}>{cat}</button>
        ))}
      </div>

      {/* ── Alertas ── */}
      {!cargando && productos.length === 0 && (
        <div style={{ padding: "13px 16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "9px", marginBottom: "12px", color: "#fbbf24", fontSize: "13px" }}>
          ⚠️ No hay productos. Agrégalos desde Admin → Inventario.
        </div>
      )}
      {!cargando && productos.length > 0 && productosFiltrados.length === 0 && !busqueda && !categoriaActiva && (
        <div style={{ padding: "13px 16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "9px", marginBottom: "12px", color: "#fbbf24", fontSize: "13px" }}>
          ⚠️ Todos los productos tienen stock 0. Actualízalos en Admin → Inventario.
        </div>
      )}

      {/* ── Contenido ── */}
      {cargando ? (
        <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "40px" }}>
          Cargando productos...
        </p>
      ) : productosFiltrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }}>
          😕 No se encontraron productos
        </div>

      ) : vista === "grid" ? (
        /* ════════════ VISTA GRID ════════════ */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
          gap: "12px",
          maxHeight: "520px",
          overflowY: "auto",
          padding: "4px 2px",
        }}>
          {productosFiltrados.map(p => (
            <div key={p.id} onClick={() => onAgregarAlCarrito(p)}
              style={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform    = "translateY(-4px)";
                e.currentTarget.style.borderColor  = "rgba(59,130,246,0.45)";
                e.currentTarget.style.boxShadow    = "0 8px 24px rgba(59,130,246,0.18)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform    = "translateY(0)";
                e.currentTarget.style.borderColor  = "rgba(255,255,255,0.07)";
                e.currentTarget.style.boxShadow    = "none";
              }}
            >
              {/* Imagen completa sin recorte */}
              <div style={{
                width: "100%",
                aspectRatio: "1 / 1",        // cuadrado perfecto
                background: "rgba(255,255,255,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}>
                {p.imagen
                  ? <img src={p.imagen} alt={p.nombre} style={{
                      width: "100%", height: "100%",
                      objectFit: "contain",    // ← imagen completa, sin mochar
                      padding: "8px",
                    }} />
                  : <span style={{ fontSize: "48px" }}>📦</span>
                }
              </div>

              {/* Info */}
              <div style={{ padding: "10px 12px 12px" }}>
                <div style={{
                  fontWeight: "600", fontSize: "13px", color: "#f0f4ff",
                  marginBottom: "6px", lineHeight: "1.3",
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {p.nombre}
                </div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#10b981", marginBottom: "6px" }}>
                  {formatMoney(p.precioVenta)}
                </div>
                <span style={{
                  fontSize: "11px", color: "rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.06)",
                  padding: "2px 8px", borderRadius: "10px",
                }}>
                  Stock: {p.cantidad ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>

      ) : (
        /* ════════════ VISTA LISTA ════════════ */
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "520px", overflowY: "auto", padding: "2px" }}>
          {productosFiltrados.map(p => (
            <div key={p.id} onClick={() => onAgregarAlCarrito(p)}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                background: "#111827", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "11px", padding: "10px 14px", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)";
                e.currentTarget.style.background  = "#161f33";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.background  = "#111827";
              }}
            >
              {/* Miniatura */}
              <div style={{
                width: "56px", height: "56px", borderRadius: "9px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, overflow: "hidden",
              }}>
                {p.imagen
                  ? <img src={p.imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }} />
                  : <span style={{ fontSize: "26px" }}>📦</span>
                }
              </div>

              {/* Nombre + categoría */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "#f0f4ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.nombre}
                </div>
                {p.categoria && (
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                    {p.categoria}
                  </div>
                )}
              </div>

              {/* Stock */}
              <span className={`badge ${p.cantidad <= 5 ? "badge-danger" : "badge-success"}`}>
                {p.cantidad}
              </span>

              {/* Precio */}
              <div style={{ fontWeight: "700", fontSize: "15px", color: "#10b981", whiteSpace: "nowrap" }}>
                {formatMoney(p.precioVenta)}
              </div>

              {/* Botón agregar */}
              <button style={{
                width: "32px", height: "32px", borderRadius: "8px", border: "none",
                background: "rgba(59,130,246,0.2)", color: "#22d3ee",
                fontSize: "20px", cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.4)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(59,130,246,0.2)"}
              >+</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
