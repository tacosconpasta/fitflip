export type Rol = "user" | "admin";

export interface Usuario {
  id: number;
  correo: string;
  contrasena: string;
  name: string;
  image: string | null;
  rol: Rol;
}

export type NewUsuario = Omit<Usuario, "id">;
