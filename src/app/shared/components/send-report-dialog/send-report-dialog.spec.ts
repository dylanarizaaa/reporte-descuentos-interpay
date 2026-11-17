import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';
import { ApiError } from '../../../core/http/api-response';
import { SendReportDialog } from './send-report-dialog';

@Component({
  imports: [SendReportDialog],
  template: `
    <app-send-report-dialog
      [open]="open()"
      [request]="request"
      (closed)="cerrados = cerrados + 1"
    />
  `,
})
class Host {
  readonly open = signal(true);
  respuesta: Observable<unknown> = of({});
  readonly request = () => this.respuesta;
  cerrados = 0;
}

const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('SendReportDialog', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove());
  });

  const dialog = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
  const button = (name: string) =>
    [...(dialog()?.querySelectorAll('button') ?? [])].find((item) => text(item) === name)!;

  async function enviar(): Promise<void> {
    button('Enviar').click();
    await fixture.whenStable();
  }

  it('usa los textos de ventas con descuento por defecto', () => {
    expect(text(dialog())).toContain('¿Enviar el reporte por correo?');
    expect(text(dialog())).toContain('No enviar');
  });

  it('muestra el mensaje del backend si la solicitud falla con un error de negocio', async () => {
    host.respuesta = throwError(() => new ApiError('El periodo no tiene ventas.', 400));
    await enviar();
    expect(text(dialog()?.querySelector('[role="alert"]'))).toBe('El periodo no tiene ventas.');
  });

  it('con un error de red muestra un mensaje genérico y permite reintentar', async () => {
    host.respuesta = throwError(() => new Error('offline'));
    await enviar();
    expect(text(dialog()?.querySelector('[role="alert"]'))).toBe(
      'No pudimos enviar el reporte. Inténtalo de nuevo.',
    );

    host.respuesta = of({});
    await enviar();
    expect(text(dialog())).toContain('Tu reporte está en camino');
    expect(document.activeElement).toBe(button('Cerrar'));
  });

  it('cerrar vuelve al primer paso para el próximo envío', async () => {
    await enviar();
    button('Cerrar').click();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(host.cerrados).toBeGreaterThan(0);

    host.open.set(false);
    await fixture.whenStable();
    host.open.set(true);
    await fixture.whenStable();
    expect(text(dialog())).toContain('¿Enviar el reporte por correo?');
  });
});
