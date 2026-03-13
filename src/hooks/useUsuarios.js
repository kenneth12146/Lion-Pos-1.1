import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import { firebaseConfig } from "../firebase/firebase"; // asegúrate de exportar esto

export function useUsuarios() {
  const { sesion } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!sesion?.id) return;
    const ref = collection(db, `negocios/${sesion.id}/usuarios`);
    const unsub = onSnapshot(ref, (snap) => {
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCargando(false);
    });
    return () => unsub();
  }, [sesion]);

  // Crear usuario sin cerrar sesión del admin
  const crear = async ({ nombre, email, password, rol }) => {
    // Segunda instancia temporal de Firebase Auth
    const appSecundaria = initializeApp(firebaseConfig, `temp_${Date.now()}`);
    const authSecundaria = getAuth(appSecundaria);

    try {
      const cred = await createUserWithEmailAndPassword(authSecundaria, email, password);
      const uid = cred.user.uid;

      // Guardar en Firestore con el uid real de Firebase Auth
      const { setDoc, doc: firestoreDoc } = await import("firebase/firestore");
      await setDoc(firestoreDoc(db, `negocios/${sesion.id}/usuarios`, uid), {
        uid,
        nombre,
        email,
        rol,
        activo: true,
        negocioId: sesion.id,
        fechaCreacion: Date.now(),
      });

      return uid;
    } finally {
      await appSecundaria.delete(); // elimina instancia temporal
    }
  };

  const editar = async (id, data) => {
    const ref = doc(db, `negocios/${sesion.id}/usuarios`, id);
    await updateDoc(ref, {
      nombre: data.nombre,
      email:  data.email,
      rol:    data.rol,
    });
  };

  const toggleActivo = async (id, activo) => {
    await updateDoc(doc(db, `negocios/${sesion.id}/usuarios`, id), { activo: !activo });
  };

  const eliminar = async (id) => {
    await deleteDoc(doc(db, `negocios/${sesion.id}/usuarios`, id));
  };

  return { usuarios, cargando, crear, editar, toggleActivo, eliminar };
}
