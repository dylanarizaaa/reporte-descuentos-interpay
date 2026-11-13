/*
 * Fechas de calendario (sin hora). Todas las funciones trabajan con `Date` locales a medianoche y
 * devuelven fechas nuevas: no mutan sus argumentos.
 */

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

/** Encabezados de la grilla, empezando en domingo como en el diseño. */
export const WEEKDAY_SHORT_NAMES = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'] as const;
export const WEEKDAY_NAMES = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** La misma fecha a medianoche local. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Primer día del mes de `date`. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Primer día del mes que está `months` meses antes o después del mes de `date`. */
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** Días de calendario de `from` a `to` (negativo si `to` es anterior). No le afecta el horario de verano. */
export function diffInDays(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / MS_PER_DAY);
}

/** Compara solo el día: negativo si `a` es anterior a `b`, 0 si es el mismo día. */
export function compareDays(a: Date, b: Date): number {
  return diffInDays(b, a);
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return !!a && !!b && compareDays(a, b) === 0;
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

/** 2026-01-23 (formato de fecha ISO para la URL y el API). */
export function toIsoDate(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Fecha a partir de `AAAA-MM-DD`. `null` si el texto no es una fecha válida (p. ej. 2026-02-30). */
export function parseIsoDate(value: string | null | undefined): Date | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) {
    return null;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

/** 23/01/2026 */
export function formatDayMonthYear(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${pad(date.getFullYear(), 4)}`;
}

/** "viernes, 23 de enero de 2026": nombre accesible de un día del calendario. */
export function formatLongDay(date: Date): string {
  return `${WEEKDAY_NAMES[date.getDay()]}, ${date.getDate()} de ${MONTH_NAMES[
    date.getMonth()
  ].toLowerCase()} de ${date.getFullYear()}`;
}

/**
 * Semanas (de domingo a sábado) que muestra la grilla de un mes. Incluye los días de los meses
 * vecinos que completan la primera y la última semana.
 */
export function monthWeeks(month: Date): Date[][] {
  const first = startOfMonth(month);
  const gridStart = addDays(first, -first.getDay());
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const weekCount = Math.ceil((first.getDay() + last.getDate()) / 7);
  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  );
}
