export interface Comida {
  id: number;
  nombre: string;
  descripcion: string;
  calorias: number;
  image: string | null;
  dia_id: number;
}

export type NewComida = Omit<Comida, "id">;
