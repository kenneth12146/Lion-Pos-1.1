import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection, onSnapshot, addDoc,
  query, orderBy, doc, updateDoc,
  increment, getDoc, getDocs
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export function useVentas() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { sesion } = useAuth();

  useEffect(() => {
    if (!sesion?.id) return;
    const ref = collection(db, `negocios/${sesion.id}/ventas`);
    const q = query(ref, orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
      setVentas(data);
      setCargando(false);
    });
    return () => unsub();
  }, [sesion]);

  const registrar = async (venta) => {
    if (!venta.items || venta.items.length === 0)
      throw new Error("El carrito está vacío");
    if (venta.total <= 0)
      throw new Error("El total debe ser mayor a cero");

    // Verificar stock
    for (const item of venta.items) {
      const productoRef = doc(db, `negocios/${sesion.id}/productos`, item.id);
      const productoSnap = await getDoc(productoRef);
      if (!productoSnap.exists()) throw new Error(`Producto "${item.nombre}" no encontrado`);
      const stockActual = productoSnap.data().cantidad ?? 0;
      if (stockActual < item.cantidad) {
        throw new Error(`Stock insuficiente para "${item.nombre}". Disponible: ${stockActual}, solicitado: ${item.cantidad}`);
      }
    }

    // Generar número consecutivo
    const ventasRef = collection(db, `negocios/${sesion.id}/ventas`);
    const snap = await getDocs(ventasRef);
    const consecutivo = snap.size + 1;
    const ventaId = `F-${String(consecutivo).padStart(4, "0")}`;

    // Registrar venta
    const ventaCompleta = {
      ...venta,
      id: ventaId,
      consecutivo,
      timestamp: Date.now(),
      fecha: new Date().toISOString(),
      usuario: sesion?.nombre || "Sistema",
      synced: true
    };
    await addDoc(ventasRef, ventaCompleta);

    // Descontar stock
    for (const item of venta.items) {
      const productoRef = doc(db, `negocios/${sesion.id}/productos`, item.id);
      await updateDoc(productoRef, { cantidad: increment(-item.cantidad) });
    }

    return ventaId;
  };

  return { ventas, cargando, registrar };
}
