import {
  compareDays,
  diffInDays,
  formatDayMonthYear,
  isSameDay,
  parseIsoDate,
  toIsoDate,
} from './calendar-date';

/** Rango de fechas del reporte; ambos extremos se incluyen. */
export interface Periodo {
  readonly inicio: Date;
  readonly fin: Date;
}

/** Días que puede haber como máximo entre la fecha inicial y la final de un periodo. */
export const MAX_PERIOD_DAYS = 30;

/** "23/01/2026 – 23/02/2026" */
export function formatPeriodo(periodo: Periodo): string {
  return `${formatDayMonthYear(periodo.inicio)} – ${formatDayMonthYear(periodo.fin)}`;
}

/** El periodo es válido: el fin no es anterior al inicio y no supera el máximo de días. */
export function isPeriodoValido(periodo: Periodo, maxDays = MAX_PERIOD_DAYS): boolean {
  return (
    compareDays(periodo.fin, periodo.inicio) >= 0 &&
    diffInDays(periodo.inicio, periodo.fin) <= maxDays
  );
}

/** Periodo a partir de los query params `desde` / `hasta` (`AAAA-MM-DD`); `null` si no es válido. */
export function parsePeriodo(desde: string | undefined, hasta: string | undefined): Periodo | null {
  const inicio = parseIsoDate(desde);
  const fin = parseIsoDate(hasta);
  if (!inicio || !fin) {
    return null;
  }
  const periodo = { inicio, fin };
  return isPeriodoValido(periodo) ? periodo : null;
}

export function periodoToParams(periodo: Periodo): { desde: string; hasta: string } {
  return { desde: toIsoDate(periodo.inicio), hasta: toIsoDate(periodo.fin) };
}

/** Mismos días de inicio y fin (o ambos `null`). */
export function samePeriodo(a: Periodo | null, b: Periodo | null): boolean {
  return a === b || (!!a && !!b && isSameDay(a.inicio, b.inicio) && isSameDay(a.fin, b.fin));
}
