import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion,   setSesion]   = useState(null);
  const [cargando, setCargando] = useState(true);

  // Restaurar sesión al recargar
  useEffect(() => {
    const data = localStorage.getItem("sesion_negocio");
    if (data) {
      const session = JSON.parse(data);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        localStorage.removeItem("sesion_negocio");
      } else {
        setSesion(session);
      }
    }
    setCargando(false);
  }, []);

  const login = async (sesionData) => {
    const data = {
      ...sesionData,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
    };
    localStorage.setItem("sesion_negocio", JSON.stringify(data));
    setSesion(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("sesion_negocio");
    setSesion(null);
  };

  return (
    <AuthContext.Provider value={{ sesion, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// ===== THEME CONTEXT =====
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
