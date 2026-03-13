import { useState, useRef } from "react";
import { subirImagen } from "../../utils/cloudinary";

export default function ImageUploader({ onUpload, preview = null, label = "Subir imagen" }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null);
  const [imgPreview, setImgPreview] = useState(preview);
  const inputRef = useRef(null);

  const handleChange = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    // Preview local inmediato
    const reader = new FileReader();
    reader.onload = (ev) => setImgPreview(ev.target.result);
    reader.readAsDataURL(archivo);

    setCargando(true);
    setError(null);
    try {
      const url = await subirImagen(archivo);
      onUpload(url); // devuelve la URL al componente padre
    } catch (e) {
      setError("Error al subir imagen. Intenta de nuevo.");
      setImgPreview(preview);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>

      {/* Preview */}
      <div
        onClick={() => !cargando && inputRef.current.click()}
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "12px",
          border: "2px dashed rgba(59,130,246,0.4)",
          background: "rgba(255,255,255,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: cargando ? "wait" : "pointer",
          overflow: "hidden",
          transition: "border-color 0.2s",
          position: "relative",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(59,130,246,0.8)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"}
      >
        {cargando ? (
          <div style={{ color: "#06b6d4", fontSize: "13px", textAlign: "center" }}>
            <div style={{ fontSize: "24px", marginBottom: "4px" }}>⏳</div>
            Subiendo...
          </div>
        ) : imgPreview ? (
          <img
            src={imgPreview}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", fontSize: "12px" }}>
            <div style={{ fontSize: "28px", marginBottom: "4px" }}>📷</div>
            Clic para subir
          </div>
        )}
      </div>

      {/* Botón */}
      <button
        type="button"
        disabled={cargando}
        onClick={() => inputRef.current.click()}
        style={{
          padding: "8px 18px",
          borderRadius: "8px",
          border: "1px solid rgba(59,130,246,0.4)",
          background: "rgba(59,130,246,0.1)",
          color: cargando ? "#94a3b8" : "#3b82f6",
          fontSize: "13px",
          cursor: cargando ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          fontFamily: "inherit",
        }}
        onMouseEnter={e => { if (!cargando) e.currentTarget.style.background = "rgba(59,130,246,0.2)"; }}
        onMouseLeave={e => { if (!cargando) e.currentTarget.style.background = "rgba(59,130,246,0.1)"; }}
      >
        {cargando ? "Subiendo..." : label}
      </button>

      {/* Error */}
      {error && (
        <div style={{ color: "#ef4444", fontSize: "12px", textAlign: "center" }}>
          {error}
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />
    </div>
  );
}
