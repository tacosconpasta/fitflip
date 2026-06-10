import './CalorieProgress.css';

// Arco de calorias: un medidor en forma de semicirculo que se va llenando
// segun las calorias obtenidas respecto a la meta del dia. Dibujado con SVG.
interface Props {
  // Calorias acumuladas hasta el momento en el dia.
  obtenidas: number;
  // Meta de calorias del dia.
  meta: number;
}

const CalorieProgress: React.FC<Props> = ({ obtenidas, meta }) => {
  // Porcentaje de llenado entre 0 y 1. Se limita a 1 para no pasarse del arco
  // aunque las calorias superen la meta.
  const porcentaje = meta > 0 ? Math.min(obtenidas / meta, 1) : 0;
  // Calorias que faltan para la meta (negativo si se excedio).
  const restantes = meta - obtenidas;
  // Indica si ya se paso de la meta, para pintar el arco en rojo.
  const excedido = obtenidas > meta;

  // Geometria del semicirculo. El arco va desde (cx-r, cy) por arriba hasta
  // (cx+r, cy), es decir, media circunferencia abierta hacia abajo.
  const r = 100; // radio
  const cx = 120; // centro X
  const cy = 120; // centro Y (base del arco)
  // Path SVG del arco: M = punto inicial, A = arco con radio r hasta el final.
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  // Longitud total del arco (media circunferencia = PI * r).
  const arcLength = Math.PI * r;
  // Truco para el llenado: se usa el arco como linea punteada con un solo
  // "guion" del largo del arco y se desplaza (dashOffset) la parte no llena.
  // A menos porcentaje, mas desplazamiento -> se ve menos relleno.
  const dashOffset = arcLength * (1 - porcentaje);
  // Color del relleno: rojo si se excedio, verde saturado si va dentro de meta.
  const fillColor = excedido ? 'var(--ion-color-danger)' : '#00c853';

  return (
    <div className="calorie-progress">
      <div className="calorie-arc-wrap">
        <svg viewBox="0 0 240 150" className="calorie-arc">
          {/* Arco de fondo (gris): la pista completa del medidor. */}
          <path className="calorie-arc-bg" d={arcPath} />
          {/* Arco de relleno: mismo path, pero recortado con dasharray/offset
              para mostrar solo la porcion correspondiente al porcentaje. */}
          <path
            className="calorie-arc-fill"
            d={arcPath}
            style={{
              stroke: fillColor,
              strokeDasharray: arcLength,
              strokeDashoffset: dashOffset,
            }}
          />
        </svg>
        {/* Texto centrado dentro del arco: calorias obtenidas y la meta. */}
        <div className="calorie-arc-center">
          <span className="calorie-arc-value">{obtenidas}</span>
          <span className="calorie-arc-meta">/ {meta} kcal</span>
        </div>
      </div>
      {/* Subtitulo: calorias restantes, o cuanto se paso de la meta. */}
      <p
        className="calorie-progress-sub"
        style={{
          color: excedido ? 'var(--ion-color-danger)' : 'var(--ion-color-medium)',
        }}
      >
        {excedido
          ? `${Math.abs(restantes)} kcal sobre la meta`
          : `${restantes} kcal restantes`}
      </p>
    </div>
  );
};

export default CalorieProgress;
