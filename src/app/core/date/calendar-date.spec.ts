import {
  addMonths,
  diffInDays,
  formatDayMonthYear,
  formatLongDay,
  monthWeeks,
  parseIsoDate,
  toIsoDate,
} from './calendar-date';

describe('calendar-date', () => {
  it('cuenta días de calendario entre dos fechas', () => {
    expect(diffInDays(new Date(2026, 0, 23), new Date(2026, 1, 22))).toBe(30);
    expect(diffInDays(new Date(2026, 1, 22), new Date(2026, 0, 23))).toBe(-30);
    expect(diffInDays(new Date(2026, 0, 23, 23, 59), new Date(2026, 0, 24, 0, 1))).toBe(1);
  });

  it('suma meses devolviendo el primer día del mes', () => {
    expect(toIsoDate(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
    expect(toIsoDate(addMonths(new Date(2026, 0, 15), -1))).toBe('2025-12-01');
  });

  it('convierte entre Date y AAAA-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(parseIsoDate('2026-01-05')).toEqual(new Date(2026, 0, 5));
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('05/01/2026')).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
  });

  it('formatea fechas como en el diseño y para lectores de pantalla', () => {
    expect(formatDayMonthYear(new Date(2026, 0, 23))).toBe('23/01/2026');
    expect(formatLongDay(new Date(2026, 0, 23))).toBe('viernes, 23 de enero de 2026');
  });

  it('arma las semanas del mes empezando en domingo', () => {
    const weeks = monthWeeks(new Date(2026, 1, 1));
    // Febrero de 2026 empieza en domingo y tiene 28 días: cuatro semanas exactas.
    expect(weeks).toHaveLength(4);
    expect(toIsoDate(weeks[0][0])).toBe('2026-02-01');
    expect(toIsoDate(weeks[3][6])).toBe('2026-02-28');

    const january = monthWeeks(new Date(2026, 0, 1));
    expect(january).toHaveLength(5);
    expect(toIsoDate(january[0][0])).toBe('2025-12-28');
    expect(january.every((week) => week.length === 7)).toBe(true);
  });
});
