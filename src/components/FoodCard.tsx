import React from 'react';
import {
  IonCard, IonCardContent, IonLabel, IonBadge, IonButton, IonIcon,
} from '@ionic/react';
import { trash } from 'ionicons/icons';
import type { ComidaDelDia } from '../models/Comida';
import './FoodCard.css';

// Tarjeta de una comida dentro de un dia. Tiene dos zonas interactivas: el
// cuerpo (abre el detalle/edicion) y el icono de basura (la quita del dia).
interface Props {
  comida: ComidaDelDia;
  // Se llama con el id del registro (dia_comida) al tocar el cuerpo.
  onClick: (registroId: number) => void;
  // Se llama con el id del registro al tocar el icono de basura.
  onDelete: (registroId: number) => void;
}

const FoodCard: React.FC<Props> = ({ comida, onClick, onDelete }) => {
  // Calorias totales = calorias por porcion * porciones.
  const totalCalorias = Math.round(comida.calorias * comida.cantidad);

  return (
    <IonCard className="food-card">
      <IonCardContent className="food-card-content">
        <div
          className="food-card-main"
          onClick={() => onClick(comida.registro_id)}
        >
          <IonLabel>
            <h2>{comida.nombre}</h2>
            <p className="food-card-sub">
              <span className="food-card-tipo">{comida.tipo}</span>
            </p>
          </IonLabel>
          {/* Calorias ya multiplicadas por las porciones, y debajo el "xN" si
              hay mas (o menos) de una porcion. */}
          <div className="food-card-cal-wrap">
            <IonBadge className="food-card-cal">{totalCalorias} kcal</IonBadge>
            {comida.cantidad !== 1 && (
              <span className="food-card-qty">x{comida.cantidad}</span>
            )}
          </div>
        </div>
        <IonButton
          className="food-card-delete"
          fill="clear"
          color="danger"
          onClick={() => onDelete(comida.registro_id)}
        >
          <IonIcon icon={trash} slot="icon-only" />
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default FoodCard;
