import {
  IonButtons,
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { Guard } from "../../auth/Guard";
import { useAuth } from "../../auth/AuthContext";

// Admin landing (owner: Coworker B — panel de administración / CRUD de usuarios).
// Wrapped in <Guard rol="admin"> so only admins reach it.
const AdminHome: React.FC = () => {
  const { usuario, logout } = useAuth();

  return (
    <Guard rol="admin">
      <IonPage>
        <IonHeader>
          <IonToolbar color="dark">
            <IonTitle>Panel de administración</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={logout}>Salir</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText>
            <h2>Hola, {usuario?.name}</h2>
            <p>Aquí irá el CRUD de usuarios.</p>
          </IonText>
        </IonContent>
      </IonPage>
    </Guard>
  );
};

export default AdminHome;
