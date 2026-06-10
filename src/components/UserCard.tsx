import React from "react";
import {
  IonCard,
  IonCardContent,
  IonBadge,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { createOutline, trash } from "ionicons/icons";
import type { Usuario } from "../models/Usuario";
import "./UserCard.css";

// Tarjeta reutilizable que muestra la información de un usuario. Tiene dos
// acciones independientes: editar (lápiz) y eliminar (basura). El diseño
// replica el patrón visual de FoodCard (barra verde izquierda, esquinas
// redondeadas, sombra suave).
interface Props {
  usuario: Usuario;
  /** Llamado al tocar el ícono de editar; abre el formulario de edición. */
  onEdit: (id: number) => void;
  /** Llamado al tocar el ícono de basura; solicita eliminar al usuario. */
  onDelete: (id: number) => void;
}

const UserCard: React.FC<Props> = ({ usuario, onEdit, onDelete }) => {
  // Primera letra del nombre como avatar.
  const inicial = usuario.name.charAt(0);

  return (
    <IonCard className="user-card">
      <IonCardContent className="user-card-content">
        {/* Avatar circular con la inicial del nombre. */}
        <div className="user-card-avatar">{inicial}</div>

        {/* Nombre y correo. */}
        <div className="user-card-info">
          <h2>{usuario.name}</h2>
          <p>{usuario.correo}</p>
        </div>

        {/* Píldora del rol. */}
        <IonBadge className="user-card-rol">{usuario.rol}</IonBadge>

        {/* Botones de acción. */}
        <div className="user-card-actions">
          <IonButton
            fill="clear"
            color="primary"
            onClick={() => onEdit(usuario.id)}
          >
            <IonIcon icon={createOutline} slot="icon-only" />
          </IonButton>
          <IonButton
            fill="clear"
            color="danger"
            onClick={() => onDelete(usuario.id)}
          >
            <IonIcon icon={trash} slot="icon-only" />
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default UserCard;
