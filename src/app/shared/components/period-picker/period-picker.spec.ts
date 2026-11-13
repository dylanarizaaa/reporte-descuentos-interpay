import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { Periodo } from '../../../core/date/periodo';
import { TODAY } from '../../../core/date/today';
import { PeriodPicker } from './period-picker';

@Component({
  imports: [PeriodPicker],
  template: `<app-period-picker [periodo]="periodo()" (periodoChange)="onChange($event)" />`,
})
class Host {
  readonly periodo = signal<Periodo | null>(null);
  readonly aplicados: Periodo[] = [];

  onChange(periodo: Periodo): void {
    this.aplicados.push(periodo);
    this.periodo.set(periodo);
  }
}

const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('PeriodPicker', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [{ provide: TODAY, useValue: () => new Date(2026, 1, 23) }],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove());
  });

  const trigger = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[hlmPopoverTrigger]')!;
  const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
  const day = (label: string) =>
    dialog()!.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
  const button = (name: string) =>
    [...dialog()!.querySelectorAll('button')].find(
      (item) => text(item) === name,
    ) as HTMLButtonElement;
  const headings = () => [...dialog()!.querySelectorAll('h3')].map(text);

  async function open(): Promise<void> {
    trigger().click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function click(element: HTMLElement): Promise<void> {
    element.click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('muestra el formato esperado mientras no hay periodo', () => {
    expect(text(trigger().querySelector('[aria-hidden="true"]'))).toBe('DD/MM/AAAA – DD/MM/AAAA');
    expect(text(trigger().querySelector('.sr-only'))).toBe('sin seleccionar');
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('abre en el mes anterior y el actual, con "Hasta" calculado', async () => {
    await open();

    expect(dialog()?.getAttribute('aria-labelledby')).toBeTruthy();
    expect(headings()).toEqual(['Enero 2026', 'Febrero 2026']);
    const [desde, anio] = [...dialog()!.querySelectorAll('select')];
    expect(desde.value).toBe('0');
    expect(anio.value).toBe('2026');
    expect(dialog()!.querySelector<HTMLInputElement>('input[disabled]')!.value).toBe('Febrero');
    // No hay fechas futuras.
    expect(day('martes, 24 de febrero de 2026').getAttribute('aria-disabled')).toBe('true');
    expect(day('lunes, 23 de febrero de 2026').getAttribute('aria-current')).toBe('date');
  });

  it('elige el rango con dos clics y lo publica al aplicar', async () => {
    await open();
    expect(button('Aplicar').disabled).toBe(true);

    await click(day('viernes, 23 de enero de 2026'));
    expect(day('viernes, 23 de enero de 2026').parentElement?.getAttribute('aria-selected')).toBe(
      'true',
    );
    // Con el inicio elegido, el fin puede estar a máximo 30 días.
    expect(day('domingo, 22 de febrero de 2026').hasAttribute('aria-disabled')).toBe(false);
    expect(day('lunes, 23 de febrero de 2026').getAttribute('aria-disabled')).toBe('true');
    expect(text(dialog()!.querySelector('[aria-live="polite"]'))).toContain(
      'Elige la fecha final, hasta el domingo, 22 de febrero de 2026.',
    );

    await click(day('lunes, 23 de febrero de 2026'));
    expect(button('Aplicar').disabled).toBe(true);

    await click(day('domingo, 22 de febrero de 2026'));
    expect(day('viernes, 30 de enero de 2026').parentElement?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(button('Aplicar').disabled).toBe(false);

    await click(button('Aplicar'));
    expect(host.aplicados).toEqual([{ inicio: new Date(2026, 0, 23), fin: new Date(2026, 1, 22) }]);
    expect(text(trigger())).toBe('23/01/2026 – 22/02/2026');
  });

  it('"Limpiar" borra la selección y cerrar sin aplicar la descarta', async () => {
    host.periodo.set({ inicio: new Date(2026, 1, 2), fin: new Date(2026, 1, 9) });
    fixture.detectChanges();
    await open();

    // Abre desde el mes del periodo aplicado.
    expect(headings()).toEqual(['Febrero 2026', 'Marzo 2026']);
    expect(day('lunes, 2 de febrero de 2026').parentElement?.getAttribute('aria-selected')).toBe(
      'true',
    );

    await click(button('Limpiar'));
    expect(day('lunes, 2 de febrero de 2026').parentElement?.getAttribute('aria-selected')).toBe(
      'false',
    );
    expect(button('Aplicar').disabled).toBe(true);
    expect(host.aplicados).toEqual([]);
    expect(text(trigger())).toBe('02/02/2026 – 09/02/2026');
  });

  it('"Desde", "Año" y las flechas cambian los meses visibles dentro de los límites', async () => {
    await open();
    const [desde, anio] = [...dialog()!.querySelectorAll('select')];

    // Primero el año: en el actual, los meses futuros no se pueden elegir en "Desde".
    anio.value = '2025';
    anio.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    desde.value = '10';
    desde.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(headings()).toEqual(['Noviembre 2025', 'Diciembre 2025']);

    await click(dialog()!.querySelector<HTMLButtonElement>('[aria-label="Mes siguiente"]')!);
    expect(headings()).toEqual(['Diciembre 2025', 'Enero 2026']);
    expect(dialog()!.querySelector<HTMLInputElement>('input[disabled]')!.value).toBe('Enero 2026');

    // El mes de la izquierda llega hasta el actual: después no se avanza más.
    await click(dialog()!.querySelector<HTMLButtonElement>('[aria-label="Mes siguiente"]')!);
    await click(dialog()!.querySelector<HTMLButtonElement>('[aria-label="Mes siguiente"]')!);
    expect(headings()).toEqual(['Febrero 2026', 'Marzo 2026']);
    expect(
      dialog()!.querySelector<HTMLButtonElement>('[aria-label="Mes siguiente"]')!.disabled,
    ).toBe(true);
    // Los meses futuros del año actual no se ofrecen en "Desde".
    expect(desde.querySelector<HTMLOptionElement>('option[value="2"]')!.disabled).toBe(true);
  });
});
