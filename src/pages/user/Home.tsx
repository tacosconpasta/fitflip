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
import "./Home.css";

// User landing (owner: Coworker A — VerDias y CRUD de Comidas).
// Wrapped in <Guard rol="user"> so only standard users reach it.
const Home: React.FC = () => {
  const { usuario, logout } = useAuth();

  return (
    <Guard rol="user">
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>FitFlip</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={logout}>Salir</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText>
            <h2>Hola, {usuario?.name}</h2>
            <p>Aquí irá el registro de tus días.</p>
          </IonText>
        </IonContent>
      </IonPage>
    </Guard>
  );
};

export default Home;
