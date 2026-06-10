import React from 'react';
import {
  IonCard, IonCardContent, IonLabel, IonBadge, IonButton, IonIcon,
} from '@ionic/react';
import { trash } from 'ionicons/icons';
import type { Comida } from '../models/Comida';
import './FoodCard.css';

// Tarjeta que representa una comida en la lista del dia. Tiene dos zonas
// interactivas independientes: el cuerpo (abre el detalle) y el icono de
// basura (pide eliminar la comida).
interface Props {
  comida: Comida;
  // Se llama al tocar el cuerpo de la tarjeta; abre la vista ampliada
  // (FoodDetail) con el id de la comida.
  onClick: (id: number) => void;
  // Se llama al tocar el icono rojo de basura; solicita eliminar la comida.
  onDelete: (id: number) => void;
}

const FoodCard: React.FC<Props> = ({ comida, onClick, onDelete }) => {
  return (
    <IonCard className="food-card">
      <IonCardContent className="food-card-content">
        {/* Cuerpo de la tarjeta: nombre, descripcion y calorias. Al tocarlo se
            abre el detalle de la comida. */}
        <div className="food-card-main" onClick={() => onClick(comida.id)}>
          <IonLabel>
            <h2>{comida.nombre}</h2>
            <p>{comida.descripcion}</p>
          </IonLabel>
          <IonBadge className="food-card-cal">{comida.calorias} kcal</IonBadge>
        </div>
        {/* Boton de eliminar (icono de basura rojo). Esta separado del cuerpo
            para que tocarlo no abra el detalle, solo dispare onDelete. */}
        <IonButton
          className="food-card-delete"
          fill="clear"
          color="danger"
          onClick={() => onDelete(comida.id)}
        >
          <IonIcon icon={trash} slot="icon-only" />
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default FoodCard;
