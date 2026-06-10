import { Redirect } from "react-router-dom";
import { useAuth, homeForRol } from "./AuthContext";
import type { Rol } from "../models/Usuario";

// Wrap a page's content in <Guard rol="user"> (or "admin"). It redirects
// anonymous visitors to /login and users with the wrong rol to their own home.
// It does not touch the router, so each area can adopt it without affecting
// the others' routes.
export const Guard: React.FC<{ rol: Rol; children: React.ReactNode }> = ({
  rol,
  children,
}) => {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Redirect to="/login" />;
  }
  if (usuario.rol !== rol) {
    return <Redirect to={homeForRol(usuario.rol)} />;
  }
  return <>{children}</>;
};
