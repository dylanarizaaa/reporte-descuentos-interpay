import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { Periodo } from '../../../core/date/periodo';
import type { ConsultaReporte } from '../../../core/routing/report-query';
import { ReportFilters } from './report-filters';

const ENERO: Periodo = { inicio: new Date(2026, 0, 1), fin: new Date(2026, 0, 31) };

@Component({
  imports: [ReportFilters],
  template: `
    <app-report-filters
      [periodo]="periodo()"
      [cedula]="cedula()"
      [busquedaHabilitada]="busqueda()"
      [envioHabilitado]="envio()"
      (consultar)="consultas.push($event)"
      (enviar)="envios = envios + 1"
    >
      <span appReportPeriod>campo de periodo</span>
    </app-report-filters>
  `,
})
class Host {
  readonly periodo = signal<Periodo | null>(null);
  readonly cedula = signal('');
  readonly busqueda = signal(false);
  readonly envio = signal(false);
  readonly consultas: ConsultaReporte[] = [];
  envios = 0;
}

describe('ReportFilters', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const button = (name: string) =>
    [...el().querySelectorAll('button')].find((item) => item.textContent?.trim() === name)!;
  const search = () => el().querySelector<HTMLInputElement>('app-search-field input')!;
  const submit = async () => {
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  it('proyecta el campo de periodo y sin periodo no consulta', async () => {
    expect(el().textContent).toContain('campo de periodo');
    expect(button('Consultar').disabled).toBe(true);
    expect(button('Enviar reporte').disabled).toBe(true);

    await submit();
    expect(host.consultas).toEqual([]);
  });

  it('consulta con el periodo y la búsqueda solo si el buscador está habilitado', async () => {
    host.periodo.set(ENERO);
    host.cedula.set('123');
    await fixture.whenStable();
    expect(search().value).toBe('123');
    expect(search().disabled).toBe(true);

    await submit();
    host.busqueda.set(true);
    await fixture.whenStable();
    search().value = ' 456 ';
    search().dispatchEvent(new Event('input'));
    await submit();

    expect(host.consultas).toEqual([
      { periodo: ENERO, cedula: '' },
      { periodo: ENERO, cedula: '456' },
    ]);
  });

  it('"Enviar reporte" se activa con resultados y lo avisa', async () => {
    host.envio.set(true);
    await fixture.whenStable();
    button('Enviar reporte').click();
    expect(host.envios).toBe(1);
  });
});
