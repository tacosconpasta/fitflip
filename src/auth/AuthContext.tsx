import { createContext, useContext, useEffect, useState } from "react";
import { getUsuarioByCorreo } from "../lib/BaseDatos";
import type { Usuario } from "../models/Usuario";

interface AuthContextValue {
  usuario: Usuario | null;
  login: (correo: string, contrasena: string) => Promise<Usuario>;
  logout: () => void;
}

const STORAGE_KEY = "fitflip.usuario";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Normalizes a route target for a given rol. Each area keeps its own base path,
// so login and the guards only need to agree on these two destinations.
export function homeForRol(rol: Usuario["rol"]): string {
  return rol === "admin" ? "/admin" : "/home";
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  });

  useEffect(() => {
    if (usuario) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [usuario]);

  const login = async (
    correo: string,
    contrasena: string
  ): Promise<Usuario> => {
    const found = await getUsuarioByCorreo(correo.trim().toLowerCase());
    if (!found || found.contrasena !== contrasena) {
      throw new Error("Correo o contraseña incorrectos");
    }
    setUsuario(found);
    return found;
  };

  const logout = () => setUsuario(null);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
};
