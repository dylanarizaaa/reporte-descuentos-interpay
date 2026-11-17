import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { PeriodoProcesado } from '../../../core/data-access/periodos-descuento.model';
import type { Periodo } from '../../../core/date/periodo';
import { ProcessedPeriodSelect } from './processed-period-select';

const ENERO: PeriodoProcesado = { id: 1, inicio: new Date(2026, 0, 1), fin: new Date(2026, 0, 31) };

@Component({
  imports: [ProcessedPeriodSelect],
  template: `
    <app-processed-period-select
      [anios]="[2026, 2025]"
      [anio]="anio()"
      [periodos]="periodos()"
      [value]="value()"
      (anioChange)="anios.push($event)"
      (valueChange)="valores.push($event)"
    />
  `,
})
class Host {
  readonly anio = signal<number | null>(2026);
  readonly periodos = signal<readonly PeriodoProcesado[]>([ENERO]);
  readonly value = signal<Periodo | null>(null);
  readonly anios: number[] = [];
  readonly valores: (Periodo | null)[] = [];
}

describe('ProcessedPeriodSelect', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let select: {
    onYearChange(year: number | null): void;
    onPeriodChange(id: number | null): void;
    periodoLabel(id: number): string;
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    select = fixture.debugElement.query(By.directive(ProcessedPeriodSelect))
      .componentInstance as unknown as typeof select;
  });

  it('ignora el mismo año, valores vacíos y periodos que no están en la lista', () => {
    select.onYearChange(2026);
    select.onYearChange(null);
    select.onPeriodChange(99);
    select.onPeriodChange(null);

    expect(host.anios).toEqual([]);
    expect(host.valores).toEqual([]);
    expect(select.periodoLabel(99)).toBe('');
    expect(select.periodoLabel(1)).toBe('01/01/2026 – 31/01/2026');
  });

  it('cambiar de año sin periodo elegido no emite periodo', () => {
    select.onYearChange(2025);
    expect(host.anios).toEqual([2025]);
    expect(host.valores).toEqual([]);
  });

  it('sin año no indica "sin periodos" porque aún no se han pedido', async () => {
    host.anio.set(null);
    host.periodos.set([]);
    await fixture.whenStable();
    const periodo = (fixture.nativeElement as HTMLElement).querySelectorAll('button')[1];
    expect(periodo.textContent?.trim()).toBe('DD/MM/AAAA – DD/MM/AAAA');
  });
});
