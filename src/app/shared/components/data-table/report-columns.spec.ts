import { signal } from '@angular/core';
import type { SortingState } from '@tanstack/angular-table';
import { formatReportValue, sortingChange } from './report-columns';

describe('report-columns', () => {
  describe('formatReportValue', () => {
    it('formatea cada tipo de dato', () => {
      expect(formatReportValue('money', 60000)?.replace(/\s/g, ' ')).toBe('$ 60.000');
      expect(formatReportValue('percent', 19.5)).toBe('19,5%');
      expect(formatReportValue('integer', 1250)).toBe('1.250');
      expect(formatReportValue('date', '2026-01-23T10:15:00')).toBe('23/01/2026');
      expect(formatReportValue('code', 1201)).toBe('1201');
      expect(formatReportValue('text', 'Bogotá')).toBe('Bogotá');
    });

    it('sin dato o con un dato que no corresponde al tipo devuelve null', () => {
      expect(formatReportValue('text', null)).toBeNull();
      expect(formatReportValue('text', undefined)).toBeNull();
      expect(formatReportValue('code', '')).toBeNull();
      expect(formatReportValue('money', '60000')).toBeNull();
      expect(formatReportValue('percent', 'x')).toBeNull();
      expect(formatReportValue('integer', '3')).toBeNull();
      expect(formatReportValue('date', 'no-es-fecha')).toBeNull();
    });
  });

  it('sortingChange acepta el nuevo estado o una función que lo calcula', () => {
    const sorting = signal<SortingState>([]);
    const onChange = sortingChange(sorting);

    onChange([{ id: 'valor', desc: false }]);
    expect(sorting()).toEqual([{ id: 'valor', desc: false }]);

    onChange((current) => current.map((item) => ({ ...item, desc: true })));
    expect(sorting()).toEqual([{ id: 'valor', desc: true }]);
  });
});
