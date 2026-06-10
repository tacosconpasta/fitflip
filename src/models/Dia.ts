import type { ComidaDelDia } from "./Comida";

export interface Dia {
  id: number;
  fecha: string;
  descripcion: string;
  calorias_meta: number;
  calorias_obtenidas: number;
  user_id: number;
}

export type NewDia = Omit<Dia, "id">;

export interface DiaConComidas extends Dia {
  comidas: ComidaDelDia[];
}
