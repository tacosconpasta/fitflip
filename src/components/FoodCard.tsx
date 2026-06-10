import React from 'react';
import { IonCard, IonCardContent, IonLabel, IonBadge } from '@ionic/react';
import type { Comida } from '../models/Comida';
import './FoodCard.css';

interface Props {
  comida: Comida;
  onClick: (id: number) => void;
}

const FoodCard: React.FC<Props> = ({ comida, onClick }) => {
  return (
    <IonCard button onClick={() => onClick(comida.id)}>
      <IonCardContent>
        <div className="food-card-row">
          <IonLabel>
            <h2>{comida.nombre}</h2>
            <p>{comida.descripcion}</p>
          </IonLabel>
          <IonBadge color="primary">{comida.calorias} kcal</IonBadge>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default FoodCard;