import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./context/AuthContext";
import App from "./App";
import "./styles/estilos.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
