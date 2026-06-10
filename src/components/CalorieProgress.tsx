import { IonProgressBar } from '@ionic/react';
import './CalorieProgress.css';

interface Props {
  obtenidas: number;
  meta: number;
}

const CalorieProgress: React.FC<Props> = ({ obtenidas, meta }) => {
  const porcentaje = meta > 0 ? Math.min(obtenidas / meta, 1) : 0;
  const sobrante = meta - obtenidas;
  const excedido = obtenidas > meta;

  return (
    <div className="calorie-progress">
      <div className="calorie-progress-header">
        <span className="calorie-progress-title">Calorías del día</span>
        <span className="calorie-progress-nums">{obtenidas} / {meta} kcal</span>
      </div>
      <IonProgressBar value={porcentaje} color={excedido ? 'danger' : 'primary'} />
      <p className="calorie-progress-sub" style={{ color: excedido ? 'var(--ion-color-danger)' : 'var(--ion-color-medium)' }}>
        {excedido ? `${Math.abs(sobrante)} kcal sobre la meta` : `${sobrante} kcal restantes`}
      </p>
    </div>
  );
};

export default CalorieProgress;