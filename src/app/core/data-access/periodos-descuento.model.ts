import type { Periodo } from '../date/periodo';

/** Periodo de descuentos automáticos ya procesado (`ResponsePeriodoProcesado` del swagger). */
export interface PeriodoProcesadoResponse {
  readonly idPeriodo: number;
  /** ISO 8601. */
  readonly fechaInicioPeriodo: string;
  /** ISO 8601. */
  readonly fechaFinPeriodo: string;
}

/** Periodo procesado listo para la vista: fechas sin hora. */
export interface PeriodoProcesado extends Periodo {
  readonly id: number;
}
