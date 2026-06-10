import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronBack, chevronForward } from 'ionicons/icons';
import type { Dia } from '../models/Dia';
import './WeekCalendar.css';

// Calendario semanal propio (no usa ningún componente de calendario externo).
// Muestra una fila de 7 días con tamaño fijo. Los días que tienen un registro
// (es decir, donde se llevaron calorias) se pintan de verde y son los unicos
// seleccionables. El dia seleccionado se resalta con un verde mas saturado.
interface Props {
  // Dias que tienen registro en la base de datos. Se usan para saber cuales
  // celdas pintar de verde (tracked).
  dias: Dia[];
  // Fecha actualmente seleccionada, en formato YYYY-MM-DD.
  selected: string;
  // Se llama cuando el usuario toca un dia verde, pasando su fecha.
  onSelect: (fecha: string) => void;
}

// Etiquetas cortas de los dias de la semana empezando en lunes (español).
const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// Toda la aritmetica de fechas se hace en UTC para que un string YYYY-MM-DD
// siempre caiga en la misma celda sin importar la zona horaria del dispositivo.
// Asi coincide con como el resto de la app obtiene "hoy" (con toISOString()).

// Convierte un string YYYY-MM-DD en un Date fijado a medianoche UTC.
function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Convierte un Date de vuelta a string YYYY-MM-DD (parte de fecha en UTC).
function isoUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Devuelve una copia del Date desplazada n dias (puede ser negativo).
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

const WeekCalendar: React.FC<Props> = ({ dias, selected, onSelect }) => {
  // Fecha de hoy en el mismo formato que usa toda la app.
  const hoy = new Date().toISOString().slice(0, 10);

  // Desplazamiento de semanas respecto a la semana actual.
  // 0 = esta semana, -1 = la anterior, +1 = la siguiente, etc.
  const [offset, setOffset] = useState(0);

  // Conjunto con las fechas que tienen registro, para consultar en O(1) si una
  // celda debe pintarse de verde.
  const trackedSet = new Set(dias.map((d) => d.fecha));

  // Calcula el lunes de la semana que se esta mostrando.
  // 1) Se parte de hoy y se desplaza segun el offset de semanas.
  const anchor = addDays(parseISO(hoy), offset * 7);
  // 2) getUTCDay devuelve 0=domingo .. 6=sabado. Se calcula cuantos dias hay
  //    que retroceder para llegar al lunes (si es domingo, retrocede 6).
  const dow = anchor.getUTCDay();
  const mondayShift = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(anchor, mondayShift);
  // 3) Se generan los 7 dias de la semana a partir del lunes.
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  // Etiqueta "mes año" que se muestra en la cabecera (ej. "junio 2026").
  const monthLabel = monday.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div className="week-calendar">
      {/* Cabecera: flecha atras, mes/año y flecha adelante para cambiar de semana. */}
      <div className="wc-header">
        <button
          type="button"
          className="wc-nav"
          onClick={() => setOffset((o) => o - 1)}
          aria-label="Semana anterior"
        >
          <IonIcon icon={chevronBack} />
        </button>
        <span className="wc-month">{monthLabel}</span>
        <button
          type="button"
          className="wc-nav"
          onClick={() => setOffset((o) => o + 1)}
          aria-label="Semana siguiente"
        >
          <IonIcon icon={chevronForward} />
        </button>
      </div>

      {/* Fila con las 7 celdas de la semana. */}
      <div className="wc-row">
        {week.map((date, i) => {
          // Fecha de esta celda en formato YYYY-MM-DD.
          const iso = isoUTC(date);
          // tracked: tiene registro -> se pinta de verde y es seleccionable.
          const tracked = trackedSet.has(iso);
          // isSelected: es el dia actualmente seleccionado -> verde mas saturado.
          const isSelected = iso === selected;
          // isToday: es el dia de hoy -> se le agrega un borde resaltado.
          const isToday = iso === hoy;

          // Se arma la lista de clases CSS segun el estado de la celda.
          // El orden importa: --selected va despues de --tracked para que gane
          // su color cuando un dia esta seleccionado y ademas tiene registro.
          const cls = [
            'wc-day',
            tracked ? 'wc-day--tracked' : '',
            isSelected ? 'wc-day--selected' : '',
            isToday ? 'wc-day--today' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={iso} className="wc-cell">
              {/* Letra del dia de la semana (L, M, X, ...). */}
              <span className="wc-dow">{DOW[i]}</span>
              {/* Numero del dia. Solo se puede tocar si tiene registro (tracked);
                  los dias sin datos quedan deshabilitados. */}
              <button
                type="button"
                className={cls}
                disabled={!tracked}
                onClick={() => tracked && onSelect(iso)}
              >
                {date.getUTCDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekCalendar;
