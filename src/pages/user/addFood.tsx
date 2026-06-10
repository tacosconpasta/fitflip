import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonItem, IonLabel, IonInput,
  IonTextarea, IonButton, IonBackButton, IonButtons,
  IonToast, IonSearchbar, IonList, IonBadge,
  IonModal, IonIcon, IonFooter, IonSelect, IonSelectOption,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import {
  agregarComidaADia, insertComida, getDiaById,
  getComidasFrecuentes, comidaExisteEnCatalogo,
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

  // Crea una comida nueva en el catalogo y la agrega al dia. Valida el nombre y
  // que no exista ya en el catalogo del usuario (no se puede repetir una comida).
  const guardar = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setToastMsg('El nombre es obligatorio');
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
                <IonItem button key={f.nombre} onClick={() => agregarRapido(f)}>
                  <IonLabel>
                    <h2>{f.nombre}</h2>
                    {f.descripcion ? <p>{f.descripcion}</p> : null}
                  </IonLabel>
                  <IonBadge slot="end" className="addfood-cal">
                    {f.calorias} kcal
                  </IonBadge>
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
            <IonItem>
              <IonLabel position="stacked">Nombre</IonLabel>
              <IonInput
                value={nombre}
                placeholder="ej. Arroz con pollo"
                onIonChange={(e) => setNombre(e.detail.value ?? '')}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Tipo</IonLabel>
              <IonSelect
                value={tipo}
                onIonChange={(e) => setTipo(e.detail.value as TipoComida)}
              >
                {TIPOS_COMIDA.map((t) => (
                  <IonSelectOption key={t} value={t}>
                    {t}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Descripción</IonLabel>
              <IonTextarea
                value={descripcion}
                placeholder="ej. Sin salsa"
                onIonChange={(e) => setDescripcion(e.detail.value ?? '')}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Calorías</IonLabel>
              <IonInput
                type="number"
                value={calorias}
                placeholder="0"
                onIonChange={(e) => setCalorias(Number(e.detail.value ?? 0))}
              />
            </IonItem>

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
