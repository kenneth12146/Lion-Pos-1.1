const CLOUD_NAME = "drybcc8do";
const UPLOAD_PRESET = "lionpos_uploads";

export async function subirImagen(archivo) {
  const formData = new FormData();
  formData.append("file", archivo);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "lionpos");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Error al subir imagen a Cloudinary");
  const data = await res.json();
  return data.secure_url; // URL pública lista para guardar en Firebase
}
