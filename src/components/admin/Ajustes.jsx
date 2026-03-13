import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useProductos } from "../../hooks/useProductos";
import ImageUploader from "../shared/ImageUploader";

export default function Ajustes() {
  const { sesion } = useAuth();
  const { productos, agregar } = useProductos();
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [cargando, setCargando] = useState(false);

  const [config, setConfig] = useState({
    nombre: "", telefono: "", direccion: "", ciudad: "",
    nit: "", email: "", logo: "", iva: 0, moneda: "COP",
    alertaStockMinimo: 5, mensajeFactura: "¡Gracias por su compra!"
  });

  useEffect(() => {
    if (!sesion?.id) return;
    const cargarConfig = async () => {
      const snap = await getDoc(doc(db, "negocios", sesion.id));
      if (snap.exists()) {
        const data = snap.data();
        setConfig(prev => ({ ...prev, ...data.configuracion, nombre: data.nombre, logo: data.logo || "" }));
      }
    };
    cargarConfig();
  }, [sesion]);

  const mostrarMensaje = (texto, tipo = "success") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: "", tipo: "" }), 3000);
  };

  const handleGuardarConfig = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await updateDoc(doc(db, "negocios", sesion.id), {
        nombre: config.nombre,
        logo: config.logo,
        configuracion: {
          telefono: config.telefono,
          direccion: config.direccion,
          ciudad: config.ciudad,
          nit: config.nit,
          email: config.email,
          iva: config.iva,
          moneda: config.moneda,
          alertaStockMinimo: config.alertaStockMinimo,
          mensajeFactura: config.mensajeFactura
        }
      });
      mostrarMensaje("✅ Configuración guardada correctamente");
    } catch (err) {
      mostrarMensaje("❌ Error: " + err.message, "error");
    } finally {
      setCargando(false);
    }
  };

  const handleLogoUpload = async (url) => {
    setConfig(prev => ({ ...prev, logo: url }));
    try {
      await updateDoc(doc(db, "negocios", sesion.id), { logo: url });
      mostrarMensaje("✅ Logo actualizado correctamente");
    } catch (err) {
      mostrarMensaje("❌ Error al guardar logo: " + err.message, "error");
    }
  };

  const handleExportarCSV = () => {
    if (productos.length === 0) { mostrarMensaje("❌ No hay productos para exportar", "error"); return; }
    const headers = ["codigo", "nombre", "categoria", "cantidad", "precioCompra", "precioVenta", "imagen"];
    const filas = productos.map(p =>
      headers.map(h => `"${String(p[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...filas].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `inventario_${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    mostrarMensaje(`✅ Exportados ${productos.length} productos`);
  };

  const handleImportarCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const lineas = ev.target.result.trim().split("\n");
        const headers = lineas[0].split(",").map(h => h.replace(/"/g, "").trim());
        const productosImportados = lineas.slice(1).map(linea => {
          const valores = linea.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
          const obj = {};
          headers.forEach((h, i) => {
            let val = (valores[i] || "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
            if (["cantidad", "precioCompra", "precioVenta"].includes(h)) val = parseFloat(val) || 0;
            obj[h] = val;
          });
          return obj;
        }).filter(p => p.nombre);
        let importados = 0;
        for (const producto of productosImportados) { await agregar(producto); importados++; }
        mostrarMensaje(`✅ ${importados} productos importados correctamente`);
      } catch (err) { mostrarMensaje("❌ Error al importar: " + err.message, "error"); }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleDescargarPlantilla = () => {
    const csv = `codigo,nombre,categoria,cantidad,precioCompra,precioVenta,imagen\nPROD001,Producto de ejemplo,General,10,5000,8000,`;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = "plantilla_inventario.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Mensaje toast */}
      {mensaje.texto && (
        <div style={{
          padding: "12px 20px",
          borderRadius: "10px",
          marginBottom: "20px",
          background: mensaje.tipo === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
          border: `1px solid ${mensaje.tipo === "error" ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}`,
          color: mensaje.tipo === "error" ? "#ef4444" : "#10b981",
          fontSize: "14px",
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* ── Info del negocio ── */}
      <div className="card">
        <h3 style={{ color: "#06b6d4", marginBottom: "20px" }}>🏪 Información del Negocio</h3>
        <form onSubmit={handleGuardarConfig}>

          {/* Logo con ImageUploader */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "14px" }}>
              Logo del Negocio
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <ImageUploader
                onUpload={handleLogoUpload}
                preview={config.logo || null}
                label="Cambiar Logo"
              />
              <div style={{ flex: 1 }}>
                <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0, lineHeight: "1.6" }}>
                  📷 Haz clic en la imagen para subir tu logo directamente.<br />
                  Formatos aceptados: <span style={{ color: "#22d3ee" }}>JPG, PNG, WEBP</span><br />
                  Se guarda automáticamente en Cloudinary y Firebase.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div className="form-group">
              <label>Nombre del Negocio *</label>
              <input type="text" value={config.nombre} required
                onChange={(e) => setConfig({ ...config, nombre: e.target.value })} />
            </div>
            <div className="form-group">
              <label>NIT / RUT</label>
              <input type="text" value={config.nit}
                onChange={(e) => setConfig({ ...config, nit: e.target.value })}
                placeholder="900.123.456-7" />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input type="text" value={config.telefono}
                onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                placeholder="3001234567" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                placeholder="negocio@email.com" />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input type="text" value={config.direccion}
                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                placeholder="Calle 123 # 45-67" />
            </div>
            <div className="form-group">
              <label>Ciudad</label>
              <input type="text" value={config.ciudad}
                onChange={(e) => setConfig({ ...config, ciudad: e.target.value })}
                placeholder="Barranquilla" />
            </div>
          </div>

          <h4 style={{ margin: "24px 0 15px", color: "#f0f4ff" }}>⚙️ Configuración del Sistema</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
            <div className="form-group">
              <label>IVA (%)</label>
              <input type="number" value={config.iva} min="0" max="100"
                onChange={(e) => setConfig({ ...config, iva: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label>Moneda</label>
              <select value={config.moneda}
                onChange={(e) => setConfig({ ...config, moneda: e.target.value })}>
                <option value="COP">COP — Peso Colombiano</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="MXN">MXN — Peso Mexicano</option>
              </select>
            </div>
            <div className="form-group">
              <label>Alerta Stock Mínimo</label>
              <input type="number" value={config.alertaStockMinimo} min="1"
                onChange={(e) => setConfig({ ...config, alertaStockMinimo: parseInt(e.target.value) || 5 })} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "15px" }}>
            <label>Mensaje en factura</label>
            <input type="text" value={config.mensajeFactura}
              onChange={(e) => setConfig({ ...config, mensajeFactura: e.target.value })}
              placeholder="¡Gracias por su compra!" />
          </div>

          <button type="submit" className="btn btn-primary"
            style={{ marginTop: "15px" }} disabled={cargando}>
            {cargando ? "Guardando..." : "💾 Guardar Configuración"}
          </button>
        </form>
      </div>

      {/* ── Importar / Exportar ── */}
      <div className="card" style={{ marginTop: "20px" }}>
        <h3 style={{ color: "#06b6d4", marginBottom: "8px" }}>📦 Gestión de Inventario</h3>
        <p style={{ color: "#94a3b8", marginBottom: "20px", fontSize: "14px" }}>
          Importa o exporta tu inventario en formato CSV compatible con Excel.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>

          {/* Exportar */}
          <div style={{
            padding: "20px",
            background: "rgba(59,130,246,0.05)",
            border: "1px solid rgba(59,130,246,0.15)",
            borderRadius: "12px", textAlign: "center"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📤</div>
            <h4 style={{ color: "#f0f4ff", marginBottom: "8px" }}>Exportar Inventario</h4>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "15px" }}>
              Descarga todos tus productos en un archivo CSV
            </p>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleExportarCSV}>
              ⬇️ Exportar CSV ({productos.length} productos)
            </button>
          </div>

          {/* Importar */}
          <div style={{
            padding: "20px",
            background: "rgba(16,185,129,0.05)",
            border: "1px solid rgba(16,185,129,0.15)",
            borderRadius: "12px", textAlign: "center"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📥</div>
            <h4 style={{ color: "#f0f4ff", marginBottom: "8px" }}>Importar Inventario</h4>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "15px" }}>
              Sube un archivo CSV para agregar productos en masa
            </p>
            <label style={{
              display: "block", padding: "10px",
              background: "linear-gradient(135deg,#10b981,#059669)",
              color: "white", borderRadius: "8px", cursor: "pointer",
              fontWeight: "600", fontSize: "14px",
              boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
            }}>
              ⬆️ Importar CSV
              <input type="file" accept=".csv" onChange={handleImportarCSV} style={{ display: "none" }} />
            </label>
          </div>

          {/* Plantilla */}
          <div style={{
            padding: "20px",
            background: "rgba(139,92,246,0.05)",
            border: "1px solid rgba(139,92,246,0.15)",
            borderRadius: "12px", textAlign: "center"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📋</div>
            <h4 style={{ color: "#f0f4ff", marginBottom: "8px" }}>Descargar Plantilla</h4>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "15px" }}>
              Descarga la plantilla para llenar y luego importar
            </p>
            <button className="btn btn-primary" style={{
              width: "100%",
              background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
              boxShadow: "0 4px 15px rgba(139,92,246,0.3)"
            }} onClick={handleDescargarPlantilla}>
              📄 Descargar Plantilla
            </button>
          </div>
        </div>

        {/* Instrucciones */}
        <div style={{
          marginTop: "20px", padding: "15px",
          background: "rgba(245,158,11,0.07)",
          border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: "10px", fontSize: "13px"
        }}>
          <strong style={{ color: "#f59e0b" }}>📌 Instrucciones para importar:</strong>
          <ol style={{ margin: "8px 0 0 20px", color: "#94a3b8", lineHeight: "1.8" }}>
            <li>Descarga la plantilla CSV</li>
            <li>Ábrela en Excel o Google Sheets</li>
            <li>Llena los productos respetando las columnas</li>
            <li>Guarda como CSV y súbela aquí</li>
          </ol>
        </div>
      </div>

      {/* ── Estadísticas ── */}
      <div className="card" style={{ marginTop: "20px" }}>
        <h3 style={{ color: "#06b6d4", marginBottom: "20px" }}>📊 Estadísticas del Sistema</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
          {[
            { label: "Productos",  valor: productos.length,                                                              icon: "📦", color: "#3b82f6" },
            { label: "Con Stock",  valor: productos.filter(p => p.cantidad > 0).length,                                  icon: "✅", color: "#10b981" },
            { label: "Sin Stock",  valor: productos.filter(p => p.cantidad <= 0).length,                                 icon: "🚫", color: "#ef4444" },
            { label: "Stock Bajo", valor: productos.filter(p => p.cantidad > 0 && p.cantidad <= config.alertaStockMinimo).length, icon: "⚠️", color: "#f59e0b" },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: "20px",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${stat.color}30`,
              borderTop: `3px solid ${stat.color}`,
              borderRadius: "12px", textAlign: "center"
            }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>{stat.icon}</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: stat.color }}>{stat.valor}</div>
              <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
