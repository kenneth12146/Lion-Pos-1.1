import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection, onSnapshot, addDoc,
  query, orderBy, doc, updateDoc, increment, deleteDoc
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export function useDevoluciones() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { sesion } = useAuth();

  useEffect(() => {
    if (!sesion?.id) return;
    const ref = collection(db, `negocios/${sesion.id}/devoluciones`);
    const q = query(ref, orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDevoluciones(data);
      setCargando(false);
    });
    return () => unsub();
  }, [sesion]);

  const registrar = async (devolucion) => {
    if (!devolucion.items || devolucion.items.length === 0)
      throw new Error("La devolución debe tener al menos un producto");

    // 1️⃣ Registrar la devolución
    const devolucionCompleta = {
      ...devolucion,
      id: `DEV${Date.now()}`,
      timestamp: Date.now(),
      fecha: new Date().toISOString(),
      usuario: sesion?.nombre || "Sistema",
      synced: true
    };
    const ref = collection(db, `negocios/${sesion.id}/devoluciones`);
    await addDoc(ref, devolucionCompleta);

    // 2️⃣ Devolver stock a cada producto
    for (const item of devolucion.items) {
      if (!item.id) continue;
      const productoRef = doc(db, `negocios/${sesion.id}/productos`, item.id);
      await updateDoc(productoRef, {
        cantidad: increment(item.cantidad)
      });
    }

    // 3️⃣ Eliminar la venta original de Firebase
    if (devolucion.ventaDocId) {
      const ventaRef = doc(db, `negocios/${sesion.id}/ventas`, devolucion.ventaDocId);
      await deleteDoc(ventaRef);
    }

    return devolucionCompleta.id;
  };

  return { devoluciones, cargando, registrar };
}
