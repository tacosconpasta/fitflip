import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonItem, IonLabel, IonInput,
  IonTextarea, IonButton, IonBackButton, IonButtons,
  IonToast, IonAlert, IonSpinner
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { getComidaById, updateComida, deleteComida } from '../../lib/BaseDatos';
import type { Comida } from '../../models/Comida';
import './FoodDetail.css';

interface Params {
  id: string;
}

const FoodDetail: React.FC = () => {
  const { id } = useParams<Params>();
  const history = useHistory();

  const [comida, setComida] = useState<Comida | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [calorias, setCalorias] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const data = await getComidaById(Number(id));
      if (data) {
        setComida(data);
        setNombre(data.nombre);
        setDescripcion(data.descripcion);
        setCalorias(data.calorias);
      }
      setLoading(false);
    };
    cargar();
  }, [id]);

  const guardar = async () => {
    if (!nombre.trim()) {
      setToastMsg('El nombre es obligatorio');
      setShowToast(true);
      return;
    }

    await updateComida({
      ...comida!,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      calorias,
    });

    setToastMsg('Comida actualizada');
    setShowToast(true);
    setTimeout(() => history.goBack(), 1500);
  };

  const eliminar = async () => {
    await deleteComida(Number(id));
    history.goBack();
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <div className="fooddetail-loading">
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Detalle</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonItem>
          <IonLabel position="stacked">Nombre</IonLabel>
          <IonInput
            value={nombre}
            onIonChange={e => setNombre(e.detail.value ?? '')}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Descripción</IonLabel>
          <IonTextarea
            value={descripcion}
            onIonChange={e => setDescripcion(e.detail.value ?? '')}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Calorías</IonLabel>
          <IonInput
            type="number"
            value={calorias}
            onIonChange={e => setCalorias(Number(e.detail.value ?? 0))}
          />
        </IonItem>

      <div className="fooddetail-info">
          <p>Edita los campos que necesites y guarda los cambios.</p>
        </div>
        <div className="fooddetail-buttons">
          <IonButton expand="block" onClick={guardar}>
            Guardar cambios
          </IonButton>
          <IonButton expand="block" fill="outline" color="danger" className="fooddetail-danger" onClick={() => setShowAlert(true)}>
            Eliminar comida
          </IonButton>
        </div>
        <IonAlert
          isOpen={showAlert}
          header="¿Eliminar comida?"
          message="Esta acción no se puede deshacer."
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Eliminar', role: 'destructive', handler: eliminar }
          ]}
          onDidDismiss={() => setShowAlert(false)}
        />

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

export default FoodDetail;