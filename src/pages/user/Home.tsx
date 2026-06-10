import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonList,
  IonSpinner,
  IonAlert,
} from "@ionic/react";
import { add } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import {
  getDias,
  insertDia,
  getDiaConComidas,
  deleteComida,
} from "../../lib/BaseDatos";
import type { Comida } from "../../models/Comida";
import type { Dia } from "../../models/Dia";
import FoodCard from "../../components/FoodCard";
import CalorieProgress from "../../components/CalorieProgress";
import WeekCalendar from "../../components/WeekCalendar";
import "./Home.css";

// Usuario fijo por ahora. Mas adelante esto vendria del usuario autenticado
// (AuthContext) en lugar de estar quemado.
const USER_ID = 1;

// Pantalla principal del area de usuario. Junta el calendario semanal, el arco
// de calorias y la lista de comidas del dia seleccionado. Permite cambiar de
// dia desde el calendario, eliminar comidas y navegar a agregar/ver detalle.
const Home: React.FC = () => {
  const history = useHistory();
  // Fecha de hoy en formato YYYY-MM-DD (misma convencion que el resto de la app).
  const hoy = new Date().toISOString().slice(0, 10);

  // Lista de todos los dias con registro del usuario (alimenta el calendario).
  const [dias, setDias] = useState<Dia[]>([]);
  // Fecha que se esta viendo en pantalla. Arranca en hoy.
  const [selectedFecha, setSelectedFecha] = useState(hoy);
  // Dia cargado (con sus calorias meta/obtenidas) correspondiente a selectedFecha.
  const [dia, setDia] = useState<Dia | null>(null);
  // Comidas del dia que se esta viendo.
  const [comidas, setComidas] = useState<Comida[]>([]);
  // Indicador de carga mientras se consulta la base de datos.
  const [loading, setLoading] = useState(true);
  // Id de la comida pendiente de confirmar para eliminar (null = no hay alerta).
  const [comidaAEliminar, setComidaAEliminar] = useState<number | null>(null);

  // Mantiene disponible la ultima fecha seleccionada para el listener de
  // navegacion, sin tener que volver a suscribirse cada vez que cambia.
  const selectedRef = useRef(selectedFecha);
  selectedRef.current = selectedFecha;

  // Carga desde la base de datos el dia indicado y sus comidas.
  const cargar = async (fecha: string) => {
    setLoading(true);

    // Se traen todos los dias del usuario y se busca el de la fecha pedida.
    let todos = await getDias(USER_ID);
    let target = todos.find((d) => d.fecha === fecha);

    // El registro de hoy se crea bajo demanda para que siempre haya un dia que
    // llenar. Los dias pasados no se crean: solo existen si ya tenian registro.
    if (!target && fecha === hoy) {
      await insertDia({
        fecha: hoy,
        descripcion: "",
        calorias_meta: 2000,
        calorias_obtenidas: 0,
        user_id: USER_ID,
      });
      // Se vuelve a leer para tomar el dia recien creado (ya con su id).
      todos = await getDias(USER_ID);
      target = todos.find((d) => d.fecha === hoy);
    }

    // Se actualiza la lista del calendario (incluye el dia de hoy si se creo).
    setDias(todos);

    if (target) {
      // Se cargan el dia y sus comidas para mostrarlos.
      const conComidas = await getDiaConComidas(target.id);
      setDia(conComidas);
      setComidas(conComidas?.comidas ?? []);
    } else {
      // Dia sin registro (por ejemplo uno pasado sin datos): se limpia la vista.
      setDia(null);
      setComidas([]);
    }

    setLoading(false);
  };

  // Carga cada vez que cambia el dia seleccionado (tambien corre al montar con hoy).
  useEffect(() => {
    cargar(selectedFecha);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFecha]);

  // Refresca el dia seleccionado al volver desde las pantallas de agregar o
  // detalle, para reflejar comidas nuevas o eliminadas. Se usa selectedRef para
  // leer la fecha vigente sin re-suscribir el listener en cada cambio.
  useEffect(() => {
    return history.listen(() => cargar(selectedRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  // Confirma la eliminacion de la comida pendiente y recarga el dia actual.
  const confirmarEliminar = async () => {
    if (comidaAEliminar != null) {
      await deleteComida(comidaAEliminar);
      setComidaAEliminar(null);
      await cargar(selectedFecha);
    }
  };

  // Si el dia seleccionado es hoy (afecta el titulo y el texto de ayuda).
  const esHoy = selectedFecha === hoy;
  // Etiqueta legible de la fecha seleccionada (ej. "lunes, 10 de junio").
  // Se agrega "T00:00:00" para que se interprete como hora local y no se corra
  // de dia al formatear.
  const fechaLabel = new Date(`${selectedFecha}T00:00:00`).toLocaleDateString(
    "es-ES",
    { weekday: "long", day: "numeric", month: "long" },
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {/* El titulo dice "Hoy" si se ve el dia actual, o "Día" en otro caso. */}
          <IonTitle>{esHoy ? "Hoy" : "Día"}</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* scrollY={false}: se desactiva el scroll global del contenido para que
          solo la lista de comidas haga scroll (el calendario y el arco quedan
          fijos arriba). */}
      <IonContent scrollY={false}>
        {/* Columna que ocupa toda la altura: arriba lo fijo, abajo la lista. */}
        <div className="home-layout">
          {/* Calendario semanal. Recibe los dias con registro para pintarlos de
              verde y avisa con onSelect cuando se elige otro dia. */}
          <WeekCalendar
            dias={dias}
            selected={selectedFecha}
            onSelect={setSelectedFecha}
          />

          {loading ? (
            // Mientras carga, se muestra un spinner centrado.
            <div className="home-loading">
              <IonSpinner />
            </div>
          ) : (
            <>
              {/* Arco de calorias del dia (solo si hay un dia cargado). */}
              {dia && (
                <CalorieProgress
                  obtenidas={dia.calorias_obtenidas}
                  meta={dia.calorias_meta}
                />
              )}

              {/* Fecha legible del dia que se esta viendo. */}
              <h3 className="home-date">{fechaLabel}</h3>

              {comidas.length === 0 ? (
                // Estado vacio: no hay comidas para este dia.
                <div className="home-empty">
                  <p>No hay comidas registradas.</p>
                  {/* La ayuda de "Toca +" solo aplica si se esta viendo hoy. */}
                  {esHoy && <p>Toca + para agregar una.</p>}
                </div>
              ) : (
                // Contenedor de la lista: es la unica zona con scroll. El
                // degradado inferior (.home-fade) hace el efecto blanco de abajo
                // hacia arriba.
                <div className="home-list-wrap">
                  <IonList className="home-list">
                    {comidas.map((c) => (
                      <FoodCard
                        key={c.id}
                        comida={c}
                        onClick={(id) => history.push(`/food-detail/${id}`)}
                        onDelete={(id) => setComidaAEliminar(id)}
                      />
                    ))}
                  </IonList>
                  <div className="home-fade" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Boton flotante (+) para agregar una comida al dia que se esta viendo.
            Se deshabilita si todavia no hay un dia cargado. */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed" className="home-fab-wrap">
          <IonFabButton
            className="home-fab"
            disabled={!dia}
            onClick={() => dia && history.push(`/dia/${dia.id}/comida`)}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Alerta de confirmacion antes de eliminar una comida. Se abre cuando
            comidaAEliminar tiene un id. Cancelar o cerrar limpia ese id. */}
        <IonAlert
          isOpen={comidaAEliminar != null}
          header="¿Eliminar comida?"
          message="Esta acción no se puede deshacer."
          buttons={[
            {
              text: "Cancelar",
              role: "cancel",
              handler: () => setComidaAEliminar(null),
            },
            {
              text: "Eliminar",
              role: "destructive",
              handler: confirmarEliminar,
            },
          ]}
          onDidDismiss={() => setComidaAEliminar(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
