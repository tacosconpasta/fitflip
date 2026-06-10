// Tipo (momento) de una comida.
export type TipoComida = "Desayuno" | "Almuerzo" | "Cena" | "Snack";

// Lista de tipos para poblar los selectores.
export const TIPOS_COMIDA: TipoComida[] = [
  "Desayuno",
  "Almuerzo",
  "Cena",
  "Snack",
];

// Catalogo de comidas del usuario. Una comida es una entidad unica que puede
// usarse en muchos dias (relacion N:M con dia a traves de dia_comida).
export interface Comida {
  id: number;
  nombre: string;
  descripcion: string;
  calorias: number; // calorias por porcion
  tipo: TipoComida;
  image: string | null;
  user_id: number;
}

export type NewComida = Omit<Comida, "id">;

// Modelo de render: una comida tal como aparece dentro de un dia, junto con sus
// porciones. Combina datos del catalogo (comida) y del enlace (dia_comida).
export interface ComidaDelDia {
  registro_id: number; // id en la tabla intermedia dia_comida
  comida_id: number; // id en el catalogo comida
  nombre: string;
  descripcion: string;
  calorias: number; // por porcion (del catalogo)
  tipo: TipoComida;
  image: string | null;
  cantidad: number; // porciones (puede ser fraccional, ej. 0.5)
}

// Modelo de render para la lista de comidas frecuentes: una comida del catalogo
// junto con cuanto se ha usado (suma de porciones registradas en todos los dias).
export interface ComidaFrecuente {
  id: number;
  nombre: string;
  descripcion: string;
  calorias: number;
  tipo: TipoComida;
  image: string | null;
  veces: number;
}
