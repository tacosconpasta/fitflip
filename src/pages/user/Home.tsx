import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonFab, IonFabButton, IonIcon,
  IonList, IonSpinner
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { getDias, insertDia, getDiaConComidas } from '../../lib/BaseDatos';
import type { Comida } from '../../models/Comida';
import type { Dia } from '../../models/Dia';
import FoodCard from '../../components/FoodCard';
import CalorieProgress from '../../components/CalorieProgress';
import './Home.css';

const USER_ID = 1;

const Home: React.FC = () => {
  const history = useHistory();
  const [dia, setDia] = useState<Dia | null>(null);
  const [comidas, setComidas] = useState<Comida[]>([]);
  const [loading, setLoading] = useState(true);

  const hoy = new Date().toISOString().slice(0, 10);

  const cargarDia = async () => {
    setLoading(true);
    const dias = await getDias(USER_ID);
    let diaHoy = dias.find(d => d.fecha === hoy);

    if (!diaHoy) {
      const nuevoId = await insertDia({
        fecha: hoy,
        descripcion: '',
        calorias_meta: 2000,
        calorias_obtenidas: 0,
        user_id: USER_ID,
      });
      const creado = await getDiaConComidas(nuevoId);
      diaHoy = creado ?? undefined;
    }

    if (diaHoy) {
      const conComidas = await getDiaConComidas(diaHoy.id);
      setDia(conComidas);
      setComidas(conComidas?.comidas ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarDia();
  }, []);

  useEffect(() => {
    return history.listen(() => {
      cargarDia();
    });
  }, [history]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Hoy</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {loading ? (
          <div className="home-loading">
            <IonSpinner />
          </div>
        ) : (
          <>
            {dia && (
              <CalorieProgress
                obtenidas={dia.calorias_obtenidas}
                meta={dia.calorias_meta}
              />
            )}

            {comidas.length === 0 ? (
              <div className="home-empty">
                <p>No hay comidas registradas hoy.</p>
                <p>Toca + para agregar una.</p>
              </div>
            ) : (
              <IonList>
                {comidas.map(c => (
                  <FoodCard
                    key={c.id}
                    comida={c}
                    onClick={(id: number) => history.push(`/food-detail/${id}`)}
                  />
                ))}
              </IonList>
            )}
          </>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push(`/add-food/${dia?.id}`)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Home;