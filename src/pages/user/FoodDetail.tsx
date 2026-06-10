import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonBackButton, IonButtons,
  IonToast, IonAlert, IonSpinner, IonNote, IonSelect, IonSelectOption,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import {
  getComidaDelDia, updateComida, actualizarPorciones, quitarComidaDeDia,
} from '../../lib/BaseDatos';
import type { ComidaDelDia, TipoComida } from '../../models/Comida';
import { TIPOS_COMIDA } from '../../models/Comida';
import './FoodDetail.css';

interface Params {
  // id del registro en dia_comida (la comida dentro de un dia).
  id: string;
}

const FoodDetail: React.FC = () => {
  const { id } = useParams<Params>();
  const history = useHistory();

  const [registro, setRegistro] = useState<ComidaDelDia | null>(null);
  const [nombre, setNombre] = useState('');
  const [calorias, setCalorias] = useState<number>(0);
  const [tipo, setTipo] = useState<TipoComida>('Almuerzo');
  const [porciones, setPorciones] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const data = await getComidaDelDia(Number(id));
      if (data) {
        setRegistro(data);
        setNombre(data.nombre);
        setCalorias(data.calorias);
        setTipo(data.tipo);
        setPorciones(data.cantidad);
      }
      setLoading(false);
    };
    cargar();
  }, [id]);

  // El total se recalcula de forma dinamica al cambiar las calorias o las
  // porciones (antes de guardar), no solo al guardar.
  useEffect(() => {
    setTotal(Math.round(calorias * porciones));
  }, [calorias, porciones]);

  const guardar = async () => {
    if (!nombre.trim()) {
      setToastMsg('El nombre es obligatorio');
      setShowToast(true);
      return;
    }
    if (!(porciones > 0)) {
      setToastMsg('Las porciones deben ser mayores a 0');
      setShowToast(true);
      return;
    }

    // Datos de la comida (catalogo): afecta todos los dias que la usan.
    await updateComida({
      id: registro!.comida_id,
      nombre: nombre.trim(),
      // La descripción no se edita en esta vista, pero se conserva en el catálogo.
      descripcion: registro!.descripcion,
      calorias,
      tipo,
      image: registro!.image,
    });
    // Porciones de esta comida en este dia (solo este registro).
    await actualizarPorciones(Number(id), porciones);

    setToastMsg('Comida actualizada');
    setShowToast(true);
    setTimeout(() => history.goBack(), 1200);
  };

  const eliminar = async () => {
    await quitarComidaDeDia(Number(id));
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
        {/* Los datos compartidos del catálogo se agrupan en una tarjeta para
            diferenciarlos visualmente de las porciones propias del día. */}
        <IonCard className="fooddetail-card">
          <IonCardHeader className="fooddetail-card-header">
            <IonCardTitle className="fooddetail-card-title">
              Comida
            </IonCardTitle>
          </IonCardHeader>

          <IonCardContent className="fooddetail-card-content">
            <IonItem className="fooddetail-card-name" lines="inset">
              <IonLabel position="stacked">Nombre</IonLabel>
              <IonInput
                value={nombre}
                onIonChange={e => setNombre(e.detail.value ?? '')}
              />
            </IonItem>

            <div className="fooddetail-card-row">
              <IonItem lines="none">
                <IonLabel position="stacked">Tipo</IonLabel>
                <IonSelect
                  value={tipo}
                  interface="popover"
                  onIonChange={e => setTipo(e.detail.value as TipoComida)}
                >
                  {TIPOS_COMIDA.map(t => (
                    <IonSelectOption key={t} value={t}>
                      {t}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem lines="none">
                <IonLabel position="stacked">Calorías por porción</IonLabel>
                <IonInput
                  type="number"
                  value={calorias}
                  onIonInput={e => setCalorias(Number(e.detail.value ?? 0))}
                />
              </IonItem>
            </div>

            {registro && calorias !== registro.calorias && (
              <IonNote
                className="fooddetail-calorie-warning"
                color="danger"
                role="alert"
              >
                Cambiar las calorías afectará TODAS sus apariciones.
              </IonNote>
            )}
          </IonCardContent>
        </IonCard>

        {/* Seccion 2: lo que es propio de este dia. */}
        <h2 className="fooddetail-section">En este día</h2>
        <IonNote className="fooddetail-section-note">
          Las porciones solo cambian en este día.
        </IonNote>

        <IonItem>
          <IonLabel position="stacked">Porciones</IonLabel>
          <IonInput
            type="number"
            step="0.5"
            min="0"
            value={porciones}
            onIonInput={e => setPorciones(Number(e.detail.value ?? 0))}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Total de calorías</IonLabel>
          {/* Solo lectura (no editable): el estado total se actualiza solo al
              cambiar las calorías o las porciones. */}
          <IonInput
            className="fooddetail-total"
            type="number"
            value={total}
            readonly
          />
        </IonItem>

        <div className="fooddetail-buttons">
          <IonButton expand="block" onClick={guardar}>
            Guardar cambios
          </IonButton>
          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            className="fooddetail-danger"
            onClick={() => setShowAlert(true)}
          >
            Quitar del día
          </IonButton>
        </div>

        <IonAlert
          isOpen={showAlert}
          header="¿Quitar comida del día?"
          message="Se quitará de este día. La comida seguirá en tu lista."
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Quitar', role: 'destructive', handler: eliminar },
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
