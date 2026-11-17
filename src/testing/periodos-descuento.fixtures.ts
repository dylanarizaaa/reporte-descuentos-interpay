import type { PeriodoProcesadoResponse } from '../app/core/data-access/periodos-descuento.model';
import type { RespuestaGeneral } from '../app/core/http/api-response';
import { respuesta } from './ventas-descuento.fixtures';

const ultimoDia = (anio: number, mes: number) => new Date(anio, mes, 0).getDate();
const pad = (value: number) => String(value).padStart(2, '0');

/** Periodos mensuales procesados de `desde` a `hasta` (meses de 1 a 12), del más antiguo al más reciente. */
export function periodosMensuales(
  desde: { anio: number; mes: number },
  hasta: { anio: number; mes: number },
): PeriodoProcesadoResponse[] {
  const periodos: PeriodoProcesadoResponse[] = [];
  for (let anio = desde.anio, mes = desde.mes; anio * 12 + mes <= hasta.anio * 12 + hasta.mes;) {
    periodos.push({
      idPeriodo: anio * 100 + mes,
      fechaInicioPeriodo: `${anio}-${pad(mes)}-01T00:00:00`,
      fechaFinPeriodo: `${anio}-${pad(mes)}-${pad(ultimoDia(anio, mes))}T00:00:00`,
    });
    mes = mes === 12 ? 1 : mes + 1;
    anio = mes === 1 ? anio + 1 : anio;
  }
  return periodos;
}

/** Periodos procesados de 2025: octubre a diciembre. */
export const PERIODOS_2025: RespuestaGeneral<PeriodoProcesadoResponse[]> = respuesta(
  periodosMensuales({ anio: 2025, mes: 10 }, { anio: 2025, mes: 12 }),
);

/** Periodos procesados de 2026: solo enero. */
export const PERIODOS_2026: RespuestaGeneral<PeriodoProcesadoResponse[]> = respuesta(
  periodosMensuales({ anio: 2026, mes: 1 }, { anio: 2026, mes: 1 }),
);
