import {
  dayRangeState,
  EMPTY_RANGE,
  isDayDisabled,
  maxEndDate,
  selectDay,
} from './range-selection';

const day = (month: number, date: number) => new Date(2026, month - 1, date);
const limits = { today: day(2, 23), maxDays: 30 };

describe('range-selection', () => {
  describe('selectDay', () => {
    it('el primer clic marca el inicio y el segundo el fin', () => {
      const started = selectDay(EMPTY_RANGE, day(1, 23));
      expect(started).toEqual({ inicio: day(1, 23), fin: null });
      expect(selectDay(started, day(2, 10))).toEqual({ inicio: day(1, 23), fin: day(2, 10) });
    });

    it('un día anterior al inicio pasa a ser el nuevo inicio', () => {
      expect(selectDay({ inicio: day(1, 23), fin: null }, day(1, 5))).toEqual({
        inicio: day(1, 5),
        fin: null,
      });
    });

    it('con el rango completo, un clic empieza otro rango', () => {
      expect(selectDay({ inicio: day(1, 1), fin: day(1, 10) }, day(1, 20))).toEqual({
        inicio: day(1, 20),
        fin: null,
      });
    });

    it('permite un rango de un solo día', () => {
      expect(selectDay({ inicio: day(1, 5), fin: null }, day(1, 5))).toEqual({
        inicio: day(1, 5),
        fin: day(1, 5),
      });
    });
  });

  describe('isDayDisabled', () => {
    it('bloquea las fechas futuras', () => {
      expect(isDayDisabled(day(2, 23), EMPTY_RANGE, limits)).toBe(false);
      expect(isDayDisabled(day(2, 24), EMPTY_RANGE, limits)).toBe(true);
    });

    it('con el inicio elegido, bloquea los días a más de 30 días', () => {
      const draft = { inicio: day(1, 10), fin: null };
      expect(isDayDisabled(day(2, 9), draft, limits)).toBe(false);
      expect(isDayDisabled(day(2, 10), draft, limits)).toBe(true);
      // Los días anteriores siguen disponibles: cambian el inicio.
      expect(isDayDisabled(day(1, 1), draft, limits)).toBe(false);
    });

    it('con el rango completo no limita por la duración', () => {
      expect(isDayDisabled(day(2, 20), { inicio: day(1, 1), fin: day(1, 5) }, limits)).toBe(false);
    });
  });

  it('maxEndDate no pasa de hoy', () => {
    expect(maxEndDate(day(1, 10), limits)).toEqual(day(2, 9));
    expect(maxEndDate(day(2, 15), limits)).toEqual(day(2, 23));
  });

  describe('dayRangeState', () => {
    const draft = { inicio: day(1, 23), fin: day(2, 5) };

    it('marca los extremos y los días intermedios', () => {
      expect(dayRangeState(day(1, 23), draft)).toBe('selected');
      expect(dayRangeState(day(2, 5), draft)).toBe('selected');
      expect(dayRangeState(day(1, 30), draft)).toBe('inside');
      expect(dayRangeState(day(1, 22), draft)).toBe('none');
      expect(dayRangeState(day(2, 6), draft)).toBe('none');
    });

    it('muestra la vista previa hasta el día bajo el cursor', () => {
      const partial = { inicio: day(1, 23), fin: null };
      expect(dayRangeState(day(1, 25), partial, day(1, 26))).toBe('inside');
      expect(dayRangeState(day(1, 26), partial, day(1, 26))).toBe('inside');
      expect(dayRangeState(day(1, 27), partial, day(1, 26))).toBe('none');
      expect(dayRangeState(day(1, 25), partial)).toBe('none');
    });
  });
});
