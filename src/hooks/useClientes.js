import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, increment } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { sesion } = useAuth();

  useEffect(() => {
    if (!sesion?.id) return;
    const ref = collection(db, `negocios/${sesion.id}/clientes`);
    const unsub = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setClientes(data);
      setCargando(false);
    });
    return () => unsub();
  }, [sesion]);

  const agregar = async (cliente) => {
    const ref = collection(db, `negocios/${sesion.id}/clientes`);
    await addDoc(ref, { ...cliente, fechaRegistro: Date.now(), totalCompras: 0, totalGastado: 0, ultimaCompra: null });
  };

  const editar = async (id, datos) => {
    const ref = doc(db, `negocios/${sesion.id}/clientes`, id);
    await updateDoc(ref, { ...datos, fechaModificacion: Date.now() });
  };

  const eliminar = async (id) => {
    const ref = doc(db, `negocios/${sesion.id}/clientes`, id);
    await deleteDoc(ref);
  };

  const buscarPorCedula = async (cedula) => {
    const ref = collection(db, `negocios/${sesion.id}/clientes`);
    const q = query(ref, where("cedula", "==", cedula));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  };

  const actualizarEstadisticas = async (clienteId, monto) => {
    const ref = doc(db, `negocios/${sesion.id}/clientes`, clienteId);
    await updateDoc(ref, { totalCompras: increment(1), totalGastado: increment(monto), ultimaCompra: Date.now() });
  };

  return { clientes, cargando, agregar, editar, eliminar, buscarPorCedula, actualizarEstadisticas };
}
