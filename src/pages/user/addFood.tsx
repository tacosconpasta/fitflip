import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonItem, IonLabel, IonInput,
  IonTextarea, IonButton, IonBackButton, IonButtons,
  IonToast
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { insertComida } from '../../lib/BaseDatos';
import './AddFood.css';

interface Params {
  diaId: string;
}

const AddFood: React.FC = () => {
  const { diaId } = useParams<Params>();
  const history = useHistory();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [calorias, setCalorias] = useState<number>(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const guardar = async () => {
    if (!nombre.trim()) {
      setToastMsg('El nombre es obligatorio');
      setShowToast(true);
      return;
    }

    await insertComida({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      calorias,
      image: null,
      dia_id: Number(diaId),
    });

    history.goBack();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Agregar comida</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonItem>
          <IonLabel position="stacked">Nombre</IonLabel>
          <IonInput
            value={nombre}
            placeholder="ej. Arroz con pollo"
            onIonChange={e => setNombre(e.detail.value ?? '')}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Descripción</IonLabel>
          <IonTextarea
            value={descripcion}
            placeholder="ej. Almuerzo"
            onIonChange={e => setDescripcion(e.detail.value ?? '')}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Calorías</IonLabel>
          <IonInput
            type="number"
            value={calorias}
            placeholder="0"
            onIonChange={e => setCalorias(Number(e.detail.value ?? 0))}
          />
        </IonItem>

        <div className="addfood-buttons">
          <IonButton expand="block" onClick={guardar}>
            Guardar comida
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={() => history.goBack()}>
            Cancelar
          </IonButton>
        </div>

        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AddFood;