import { useEffect, useRef, useState } from "react";
import { formatMoney, formatDate } from "../../utils/utils";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Factura({ venta, onClose }) {
  const { sesion } = useAuth();
  const facturaRef = useRef();
  const [config, setConfig] = useState({
    nombre: "Mi Negocio",
    nit: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    logo: "",
    mensajeFactura: "¡Gracias por su compra!"
  });

  useEffect(() => {
    if (!sesion?.id) return;
    const cargar = async () => {
      const ref = doc(db, "negocios", sesion.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setConfig(prev => ({
          ...prev,
          nombre: data.nombre || prev.nombre,
          logo: data.logo || "",
          ...data.configuracion
        }));
      }
    };
    cargar();
  }, [sesion]);

  const subtotal  = venta.subtotal || venta.total;
  const descuento = venta.descuento || 0;
  const total     = venta.total;

  // ── Construye HTML limpio para impresión ──
  const handleImprimir = () => {
    const ventana = window.open("", "_blank", "width=420,height=650");

    const items = venta.items?.map((item) => `
      <tr>
        <td style="max-width:110px;word-break:break-word;padding:3px 4px;">${item.nombre}</td>
        <td style="text-align:center;padding:3px 4px;">${item.cantidad}</td>
        <td style="text-align:right;padding:3px 4px;">${formatMoney(item.precioVenta)}</td>
        <td style="text-align:right;padding:3px 4px;font-weight:600;">${formatMoney(item.precioVenta * item.cantidad)}</td>
      </tr>
    `).join("") || "";

    const logoHtml = config.logo
      ? `<img src="${config.logo}" alt="logo" style="width:60px;height:60px;object-fit:cover;border-radius:8px;display:block;margin:0 auto 8px;" />`
      : "";

    const descuentoHtml = descuento > 0
      ? `<tr>
           <td>Descuento (${venta.porcentajeDescuento}%):</td>
           <td style="text-align:right;color:#c0392b;">-${formatMoney(descuento)}</td>
         </tr>`
      : "";

    const clienteHtml = venta.cliente?.nombre && venta.cliente.nombre !== "Mostrador"
      ? `<tr><td><b>Cliente:</b></td><td style="text-align:right;">${venta.cliente.nombre}</td></tr>
         ${venta.cliente.cedula
           ? `<tr><td><b>Cédula:</b></td><td style="text-align:right;">${venta.cliente.cedula}</td></tr>`
           : ""}`
      : "";

    ventana.document.write(`
      <html>
        <head>
          <title>Factura ${venta.id}</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; color:#000 !important; background:transparent !important; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              padding: 12px;
              width: 300px;
              color: #000;
              background: #fff;
            }
            .header    { text-align:center; margin-bottom:10px; }
            .nombre    { font-size:16px; font-weight:bold; margin-bottom:3px; }
            .info      { font-size:11px; margin-bottom:2px; }
            .divider   { border:none; border-top:1px dashed #000; margin:8px 0; }
            .div-solid { border:none; border-top:2px solid #000; margin:8px 0; }
            table      { width:100%; border-collapse:collapse; }
            td         { padding:2px 4px; vertical-align:top; }
            th         {
              font-weight: bold;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1px solid #000;
              padding: 4px 4px 6px;
              text-align: left;
            }
            th.center  { text-align:center; }
            th.right   { text-align:right; }
            .total-label { font-size:15px; font-weight:800; }
            .total-value { font-size:15px; font-weight:800; text-align:right; }
            .footer    { text-align:center; margin-top:12px; font-size:11px; }
            @media print { body { width:80mm; } }
          </style>
        </head>
        <body>

          <!-- HEADER -->
          <div class="header">
            ${logoHtml}
            <div class="nombre">${config.nombre}</div>
            ${config.nit       ? `<div class="info">NIT: ${config.nit}</div>`        : ""}
            ${config.direccion ? `<div class="info">${config.direccion}</div>`        : ""}
            ${config.ciudad    ? `<div class="info">${config.ciudad}</div>`           : ""}
            ${config.telefono  ? `<div class="info">Tel: ${config.telefono}</div>`    : ""}
          </div>

          <div class="divider"></div>

          <!-- INFO VENTA -->
          <table>
            <tbody>
              <tr><td><b>Factura:</b></td><td style="text-align:right;">${venta.id}</td></tr>
              <tr><td><b>Fecha:</b></td><td style="text-align:right;">${formatDate(venta.timestamp)}</td></tr>
              <tr><td><b>Cajero:</b></td><td style="text-align:right;">${venta.usuario}</td></tr>
              ${clienteHtml}
            </tbody>
          </table>

          <div class="divider"></div>

          <!-- PRODUCTOS -->
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th class="center">Cant</th>
                <th class="right">V.Unit</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>

          <div class="divider"></div>

          <!-- SUBTOTALES -->
          <table>
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td style="text-align:right;">${formatMoney(subtotal)}</td>
              </tr>
              ${descuentoHtml}
              <tr>
                <td>Método de pago:</td>
                <td style="text-align:right;text-transform:capitalize;">${venta.forma || "efectivo"}</td>
              </tr>
            </tbody>
          </table>

          <div class="div-solid"></div>

          <!-- TOTAL -->
          <table>
            <tbody>
              <tr>
                <td class="total-label">TOTAL:</td>
                <td class="total-value">${formatMoney(total)}</td>
              </tr>
            </tbody>
          </table>

          <div class="divider"></div>

          <!-- FOOTER -->
          <div class="footer">
            <p>${config.mensajeFactura}</p>
            <p style="margin-top:4px;">🦁 Lion POS</p>
          </div>

        </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    setTimeout(() => { ventana.print(); ventana.close(); }, 400);
  };

  // ── Estilos inline pantalla (oscuro) ──
  const S = {
    overlay: {
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "20px",
      backdropFilter: "blur(6px)",
    },
    wrapper: {
      background: "#0d1221",
      border: "1px solid rgba(59,130,246,0.3)",
      borderRadius: "18px",
      padding: "24px",
      maxWidth: "460px",
      width: "100%",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
      position: "relative",
    },
    gradientBar: {
      position: "absolute", top: 0, left: 0, right: 0,
      height: "2px",
      background: "linear-gradient(90deg,#3b82f6,#06b6d4,#8b5cf6,#10b981,#3b82f6)",
      backgroundSize: "300% 100%",
      borderRadius: "18px 18px 0 0",
    },
    ticket: {
      fontFamily: "'Courier New', monospace",
      fontSize: "13px",
      background: "#111827",
      border: "1px dashed rgba(255,255,255,0.15)",
      borderRadius: "10px",
      padding: "20px",
      color: "#e2e8f0",
    },
    divider:      { borderTop: "1px dashed rgba(255,255,255,0.2)", margin: "10px 0" },
    dividerSolid: { borderTop: "2px solid rgba(255,255,255,0.35)", margin: "10px 0" },
    label:  { color: "rgba(255,255,255,0.45)", fontWeight: "600" },
    value:  { textAlign: "right", color: "#f0f4ff" },
    btnPrint: {
      padding: "9px 18px",
      background: "linear-gradient(135deg,#3b82f6,#2563eb)",
      color: "white", border: "none", borderRadius: "9px",
      cursor: "pointer", fontWeight: "600", fontSize: "13px",
      display: "flex", alignItems: "center", gap: "6px",
      boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
      transition: "all 0.2s",
    },
    btnClose: {
      padding: "9px 18px",
      background: "rgba(255,255,255,0.06)",
      color: "#f0f4ff",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "9px", cursor: "pointer",
      fontWeight: "600", fontSize: "13px",
      transition: "all 0.2s",
    },
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.wrapper}>

        {/* Barra superior animada */}
        <div style={S.gradientBar} />

        {/* Botones */}
        <div style={{ display:"flex", gap:"10px", marginBottom:"18px", justifyContent:"flex-end" }}>
          <button
            style={S.btnPrint}
            onClick={handleImprimir}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
          >
            🖨️ Imprimir
          </button>
          <button
            style={S.btnClose}
            onClick={onClose}
            onMouseEnter={e => {
              e.currentTarget.style.background    = "rgba(239,68,68,0.15)";
              e.currentTarget.style.borderColor   = "#ef4444";
              e.currentTarget.style.color         = "#f87171";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background    = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor   = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color         = "#f0f4ff";
            }}
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Ticket pantalla — solo referencia visual, NO se usa para imprimir */}
        <div ref={facturaRef} style={S.ticket}>

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:"14px" }}>
            {config.logo && (
              <img
                src={config.logo} alt="logo"
                style={{
                  width:"64px", height:"64px", objectFit:"cover",
                  borderRadius:"12px", display:"block", margin:"0 auto 10px",
                  border:"2px solid rgba(59,130,246,0.4)",
                  boxShadow:"0 0 16px rgba(59,130,246,0.3)",
                }}
              />
            )}
            <div style={{ fontSize:"16px", fontWeight:"bold", color:"#f0f4ff", letterSpacing:"0.5px" }}>
              {config.nombre}
            </div>
            {config.nit       && <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px" }}>NIT: {config.nit}</div>}
            {config.direccion && <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px" }}>{config.direccion}</div>}
            {config.ciudad    && <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px" }}>{config.ciudad}</div>}
            {config.telefono  && <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px" }}>📞 {config.telefono}</div>}
          </div>

          <div style={S.divider} />

          {/* Info venta */}
          <table style={{ width:"100%", marginBottom:"8px" }}>
            <tbody>
              <tr>
                <td style={S.label}>Factura:</td>
                <td style={S.value}>{venta.id}</td>
              </tr>
              <tr>
                <td style={S.label}>Fecha:</td>
                <td style={S.value}>{formatDate(venta.timestamp)}</td>
              </tr>
              <tr>
                <td style={S.label}>Cajero:</td>
                <td style={S.value}>{venta.usuario}</td>
              </tr>
              {venta.cliente?.nombre && venta.cliente.nombre !== "Mostrador" && (
                <>
                  <tr>
                    <td style={S.label}>Cliente:</td>
                    <td style={S.value}>{venta.cliente.nombre}</td>
                  </tr>
                  {venta.cliente.cedula && (
                    <tr>
                      <td style={S.label}>Cédula:</td>
                      <td style={S.value}>{venta.cliente.cedula}</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>

          <div style={S.divider} />

          {/* Productos */}
          <table style={{ width:"100%", marginBottom:"8px" }}>
            <thead>
              <tr>
                {["Producto","Cant","V.Unit","Total"].map((h, i) => (
                  <td key={i} style={{
                    fontWeight:"bold", color:"#22d3ee",
                    fontSize:"11px", textTransform:"uppercase",
                    letterSpacing:"1px", paddingBottom:"6px",
                    textAlign: i === 0 ? "left" : i === 1 ? "center" : "right"
                  }}>
                    {h}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan="4"><div style={S.divider} /></td></tr>
              {venta.items?.map((item, i) => (
                <tr key={i}>
                  <td style={{ maxWidth:"110px", wordBreak:"break-word", color:"#e2e8f0", paddingRight:"6px" }}>
                    {item.nombre}
                  </td>
                  <td style={{ textAlign:"center", color:"#94a3b8" }}>{item.cantidad}</td>
                  <td style={{ textAlign:"right",  color:"#94a3b8" }}>{formatMoney(item.precioVenta)}</td>
                  <td style={{ textAlign:"right",  color:"#f0f4ff", fontWeight:"600" }}>
                    {formatMoney(item.precioVenta * item.cantidad)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={S.divider} />

          {/* Subtotales */}
          <table style={{ width:"100%" }}>
            <tbody>
              <tr>
                <td style={S.label}>Subtotal:</td>
                <td style={S.value}>{formatMoney(subtotal)}</td>
              </tr>
              {descuento > 0 && (
                <tr>
                  <td style={S.label}>Descuento ({venta.porcentajeDescuento}%):</td>
                  <td style={{ textAlign:"right", color:"#f87171", fontWeight:"600" }}>
                    -{formatMoney(descuento)}
                  </td>
                </tr>
              )}
              <tr>
                <td style={S.label}>Método de pago:</td>
                <td style={{ ...S.value, textTransform:"capitalize" }}>
                  {venta.forma || "efectivo"}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={S.dividerSolid} />

          {/* Total */}
          <table style={{ width:"100%" }}>
            <tbody>
              <tr>
                <td style={{ fontSize:"16px", fontWeight:"800", color:"#22d3ee", letterSpacing:"0.5px" }}>
                  TOTAL:
                </td>
                <td style={{ textAlign:"right", fontSize:"18px", fontWeight:"800", color:"#f0f4ff" }}>
                  {formatMoney(total)}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={S.divider} />

          {/* Footer */}
          <div style={{ textAlign:"center", marginTop:"12px", fontSize:"12px" }}>
            <p style={{ color:"rgba(255,255,255,0.45)", marginBottom:"4px" }}>
              {config.mensajeFactura}
            </p>
            <p style={{ color:"rgba(59,130,246,0.55)", fontSize:"11px", letterSpacing:"1px" }}>
              🦁 Lion POS
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
