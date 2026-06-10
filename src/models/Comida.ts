export interface Comida {
  id: number;
  nombre: string;
  descripcion: string;
  calorias: number;
  image: string | null;
  // Veces que esta comida se agrego al mismo dia (repeticiones colapsadas).
  cantidad: number;
  dia_id: number;
}

// Al insertar, cantidad es opcional (por defecto 1).
export type NewComida = Omit<Comida, "id" | "cantidad"> & { cantidad?: number };

// Modelo de render para la lista de comidas frecuentes: una comida distinta
// (agrupada por nombre) junto con cuantas veces la ha registrado el usuario.
export interface ComidaFrecuente {
  nombre: string;
  descripcion: string;
  calorias: number;
  image: string | null;
  veces: number;
}
