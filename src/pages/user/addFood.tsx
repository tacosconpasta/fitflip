import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonItem, IonLabel, IonInput,
  IonTextarea, IonButton, IonBackButton, IonButtons,
  IonToast, IonSearchbar, IonList, IonBadge,
  IonModal, IonIcon, IonFooter, IonSelect, IonSelectOption,
  IonCard, IonCardHeader, IonCardContent, IonAlert,
} from '@ionic/react';
import { add, trash } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import {
  agregarComidaADia, insertComida, getDiaById,
  getComidasFrecuentes, comidaExisteEnCatalogo,
  deleteComidaDelCatalogo,
} from '../../lib/BaseDatos';
import type { ComidaFrecuente, TipoComida } from '../../models/Comida';
import { TIPOS_COMIDA } from '../../models/Comida';
import './AddFood.css';

interface Params {
  diaId: string;
}

const AddFood: React.FC = () => {
  const { diaId } = useParams<Params>();
  const history = useHistory();

  // Campos del formulario manual (dentro del modal de "Nueva comida").
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [calorias, setCalorias] = useState<number>(0);
  const [tipo, setTipo] = useState<TipoComida>('Almuerzo');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Controla la apertura del modal del formulario manual.
  const [showForm, setShowForm] = useState(false);

  // Texto del buscador y lista de comidas frecuentes del usuario.
  const [query, setQuery] = useState('');
  const [frecuentes, setFrecuentes] = useState<ComidaFrecuente[]>([]);
  // Usuario dueño del dia (se usa para el check de catalogo).
  const [userId, setUserId] = useState<number | null>(null);
  const [comidaAEliminar, setComidaAEliminar] =
    useState<ComidaFrecuente | null>(null);

  // Al montar, se averigua el usuario dueño del dia y se cargan sus comidas
  // frecuentes (ya vienen ordenadas de la mas comida a la menos).
  useEffect(() => {
    const cargar = async () => {
      const dia = await getDiaById(Number(diaId));
      if (dia) {
        setUserId(dia.user_id);
        setFrecuentes(await getComidasFrecuentes(dia.user_id));
      }
    };
    cargar();
  }, [diaId]);

  // Filtra las frecuentes por el texto del buscador (nombre o descripcion).
  const q = query.trim().toLowerCase();
  const frecuentesFiltradas = q
    ? frecuentes.filter(
        (f) =>
          f.nombre.toLowerCase().includes(q) ||
          f.descripcion.toLowerCase().includes(q)
      )
    : frecuentes;

  // Agrega una comida del catalogo al dia y vuelve atras. Si ya estaba en el
  // dia se colapsa (suma una porcion) en lugar de duplicar el enlace.
  const agregarRapido = async (f: ComidaFrecuente) => {
    await agregarComidaADia(Number(diaId), f.id);
    history.goBack();
  };

  const confirmarEliminarDelCatalogo = async () => {
    if (!comidaAEliminar || userId == null) return;

    await deleteComidaDelCatalogo(comidaAEliminar.id);
    setComidaAEliminar(null);
    setFrecuentes(await getComidasFrecuentes(userId));
  };

  // Crea una comida nueva en el catalogo y la agrega al dia. Valida el nombre y
  // que no exista ya en el catalogo del usuario (no se puede repetir una comida).
  const guardar = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setToastMsg('El nombre es obligatorio');
      setShowToast(true);
      return;
    }
    if (!Number.isFinite(calorias) || calorias < 0) {
      setToastMsg('Las calorías no pueden ser negativas');
      setShowToast(true);
      return;
    }
    if (userId == null) return;
    if (await comidaExisteEnCatalogo(userId, nombreLimpio)) {
      setToastMsg('Ya existe una comida con ese nombre');
      setShowToast(true);
      return;
    }

    const comidaId = await insertComida({
      nombre: nombreLimpio,
      descripcion: descripcion.trim(),
      calorias,
      tipo,
      image: null,
      user_id: userId,
    });
    await agregarComidaADia(Number(diaId), comidaId);

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
        {/* Buscador en la parte superior: filtra la lista de frecuentes. */}
        <IonSearchbar
          value={query}
          placeholder="Buscar comida"
          onIonInput={(e) => setQuery(e.detail.value ?? '')}
        />

        {/* Lista de comidas frecuentes (de la mas comida a la menos). Tocar una
            la agrega directamente al dia. */}
        {frecuentesFiltradas.length > 0 && (
          <>
            <h3 className="addfood-section">Comidas frecuentes</h3>
            <IonList>
              {frecuentesFiltradas.map((f) => (
                <IonItem button key={f.id} onClick={() => agregarRapido(f)}>
                  <IonLabel>
                    <h2>{f.nombre}</h2>
                    <p>{f.tipo}</p>
                  </IonLabel>
                  <IonBadge slot="end" className="addfood-cal">
                    {f.calorias} kcal
                  </IonBadge>
                  <IonButton
                    slot="end"
                    fill="clear"
                    color="danger"
                    aria-label={`Eliminar ${f.nombre} del catálogo`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setComidaAEliminar(f);
                    }}
                  >
                    <IonIcon icon={trash} slot="icon-only" />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          </>
        )}

        {/* Modal con el formulario para registrar una comida nueva manualmente. */}
        <IonModal isOpen={showForm} onDidDismiss={() => setShowForm(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Nueva comida</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowForm(false)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonCard className="addfood-form-card">
              <IonCardHeader className="addfood-form-card-header">
              <IonInput
                className="addfood-form-title-input"
                aria-label="Nombre de la comida"
                value={nombre}
                placeholder="ej. Arroz con pollo"
                onIonInput={(e) => setNombre(e.detail.value ?? '')}
              />
              </IonCardHeader>

              <IonCardContent className="addfood-form-card-content">
                <div className="addfood-form-card-row">
                  <IonItem lines="none">
                    <IonLabel position="stacked">Tipo</IonLabel>
                    <IonSelect
                      value={tipo}
                      interface="popover"
                      onIonChange={(e) =>
                        setTipo(e.detail.value as TipoComida)
                      }
                    >
                      {TIPOS_COMIDA.map((t) => (
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
                      min="0"
                      value={calorias}
                      placeholder="0"
                      onIonInput={(e) =>
                        setCalorias(Number(e.detail.value ?? 0))
                      }
                    />
                  </IonItem>
                </div>

                <IonItem className="addfood-form-description" lines="none">
                  <IonLabel position="stacked">Descripción</IonLabel>
                  <IonTextarea
                    value={descripcion}
                    placeholder="ej. Sin salsa"
                    autoGrow
                    rows={1}
                    onIonInput={(e) =>
                      setDescripcion(e.detail.value ?? '')
                    }
                  />
                </IonItem>
              </IonCardContent>
            </IonCard>

            <div className="addfood-buttons">
              <IonButton expand="block" onClick={guardar}>
                Guardar comida
              </IonButton>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />

        <IonAlert
          isOpen={comidaAEliminar != null}
          header="¿Eliminar del catálogo?"
          message={`Se eliminará “${comidaAEliminar?.nombre ?? ''}” y todas sus apariciones anteriores.`}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: () => setComidaAEliminar(null),
            },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: confirmarEliminarDelCatalogo,
            },
          ]}
          onDidDismiss={() => setComidaAEliminar(null)}
        />
      </IonContent>

      {/* Boton al pie (mas cerca del pulgar) para abrir el formulario de una
          comida nueva. */}
      <IonFooter>
        <IonToolbar>
          <IonButton
            className="addfood-new-btn"
            expand="block"
            onClick={() => setShowForm(true)}
          >
            <IonIcon icon={add} slot="start" />
            Añadir nueva comida
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default AddFood;
