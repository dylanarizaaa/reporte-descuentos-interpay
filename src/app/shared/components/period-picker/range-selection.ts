import { addDays, compareDays, diffInDays } from '../../../core/date/calendar-date';

/** Rango que el usuario está eligiendo en el calendario (aún sin aplicar). */
export interface RangeDraft {
  readonly inicio: Date | null;
  readonly fin: Date | null;
}

export const EMPTY_RANGE: RangeDraft = { inicio: null, fin: null };

/** Límites para elegir días: no hay fechas futuras ni rangos de más de `maxDays` días. */
export interface RangeLimits {
  readonly today: Date;
  readonly maxDays: number;
}

/**
 * Aplica un clic sobre `day`:
 * - Sin inicio, o con el rango completo: `day` empieza un rango nuevo.
 * - Con inicio y sin fin: `day` cierra el rango; si es anterior al inicio, pasa a ser el inicio.
 */
export function selectDay(draft: RangeDraft, day: Date): RangeDraft {
  if (!draft.inicio || draft.fin || compareDays(day, draft.inicio) < 0) {
    return { inicio: day, fin: null };
  }
  return { inicio: draft.inicio, fin: day };
}

/**
 * Un día no se puede elegir si es futuro o si, con el inicio ya elegido, el rango superaría
 * `maxDays` días.
 */
export function isDayDisabled(day: Date, draft: RangeDraft, limits: RangeLimits): boolean {
  if (compareDays(day, limits.today) > 0) {
    return true;
  }
  return !!draft.inicio && !draft.fin && diffInDays(draft.inicio, day) > limits.maxDays;
}

/** Último día que se puede elegir como fin del rango con el inicio actual. */
export function maxEndDate(inicio: Date, limits: RangeLimits): Date {
  const max = addDays(inicio, limits.maxDays);
  return compareDays(max, limits.today) > 0 ? limits.today : max;
}

/**
 * Cómo se pinta `day`: `selected` = inicio o fin (círculo Acento), `inside` = dentro del rango
 * (círculo azul claro), `none` = fuera del rango.
 *
 * `previewEnd` es el día bajo el cursor o con foco cuando solo hay inicio: muestra cómo quedaría
 * el rango antes de confirmarlo (el día de vista previa se pinta como `inside`).
 */
export type DayRangeState = 'selected' | 'inside' | 'none';

export function dayRangeState(
  day: Date,
  draft: RangeDraft,
  previewEnd: Date | null = null,
): DayRangeState {
  const { inicio, fin } = draft;
  if (!inicio) {
    return 'none';
  }
  if (compareDays(day, inicio) === 0 || (fin && compareDays(day, fin) === 0)) {
    return 'selected';
  }
  const end = fin ?? previewEnd;
  return end && compareDays(day, inicio) > 0 && compareDays(day, end) <= 0 ? 'inside' : 'none';
}
