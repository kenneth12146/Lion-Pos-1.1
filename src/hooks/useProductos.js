import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const generarCodigo = (nombre, total) => {
  const prefijo = nombre.substring(0, 3).toUpperCase().replace(/\s/g, "");
  const numero = String(total + 1).padStart(4, "0");
  return `${prefijo}-${numero}`;
};

export function useProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { sesion } = useAuth();

  useEffect(() => {
    if (!sesion?.id) return;
    const ref = collection(db, `negocios/${sesion.id}/productos`);
    const unsub = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProductos(data);
      setCargando(false);
    });
    return () => unsub();
  }, [sesion]);

  const agregar = async (producto) => {
    const ref = collection(db, `negocios/${sesion.id}/productos`);
    const snap = await getDocs(ref);
    const codigo = producto.codigo?.trim()
      ? producto.codigo
      : generarCodigo(producto.nombre || "PRD", snap.size);
    await addDoc(ref, { ...producto, codigo, fechaCreacion: Date.now() });
  };

  const editar = async (id, producto) => {
    const ref = doc(db, `negocios/${sesion.id}/productos`, id);
    await updateDoc(ref, { ...producto, fechaModificacion: Date.now() });
  };

  const eliminar = async (id) => {
    const ref = doc(db, `negocios/${sesion.id}/productos`, id);
    await deleteDoc(ref);
  };

  return { productos, cargando, agregar, editar, eliminar };
}
