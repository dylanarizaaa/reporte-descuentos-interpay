import { formatPeriodo, isPeriodoValido, parsePeriodo, periodoToParams } from './periodo';

describe('periodo', () => {
  const inicio = new Date(2026, 0, 23);

  it('formatea el periodo como DD/MM/AAAA – DD/MM/AAAA', () => {
    expect(formatPeriodo({ inicio, fin: new Date(2026, 1, 22) })).toBe('23/01/2026 – 22/02/2026');
  });

  it('acepta hasta 30 días entre inicio y fin', () => {
    expect(isPeriodoValido({ inicio, fin: inicio })).toBe(true);
    expect(isPeriodoValido({ inicio, fin: new Date(2026, 1, 22) })).toBe(true);
    expect(isPeriodoValido({ inicio, fin: new Date(2026, 1, 23) })).toBe(false);
    expect(isPeriodoValido({ inicio, fin: new Date(2026, 0, 22) })).toBe(false);
  });

  it('lee y escribe los query params desde / hasta', () => {
    const periodo = parsePeriodo('2026-01-23', '2026-02-10');
    expect(periodo).toEqual({ inicio, fin: new Date(2026, 1, 10) });
    expect(periodoToParams(periodo!)).toEqual({ desde: '2026-01-23', hasta: '2026-02-10' });
    expect(parsePeriodo('2026-01-23', undefined)).toBeNull();
    expect(parsePeriodo('2026-01-01', '2026-03-01')).toBeNull();
  });
});
