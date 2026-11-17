import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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
  /** Disparador de un select del calendario ("Desde" o "Año"), nombrado por su <label>. */
  const combobox = (name: string) => {
    const label = [...dialog()!.querySelectorAll('label')].find((item) => text(item) === name)!;
    return document.getElementById(label.htmlFor) as HTMLButtonElement;
  };
  /** Opciones de la lista abierta (vive en su propio overlay, fuera del diálogo). */
  const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];

  async function choose(select: string, option: string): Promise<void> {
    await click(combobox(select));
    await click(options().find((item) => text(item) === option)!);
  }

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
    expect(combobox('Desde').getAttribute('role')).toBe('combobox');
    expect(text(combobox('Desde'))).toBe('Enero');
    expect(text(combobox('Año'))).toBe('2026');
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

    // Lista propia (no la nativa): los meses futuros del año actual están inactivos.
    await click(combobox('Desde'));
    expect(combobox('Desde').getAttribute('aria-expanded')).toBe('true');
    const marzo = options().find((item) => text(item) === 'Marzo')!;
    expect(marzo.getAttribute('aria-disabled')).toBe('true');
    await click(options().find((item) => text(item) === 'Enero')!);

    // Primero el año y luego el mes; elegir una opción no cierra el calendario.
    await choose('Año', '2025');
    await choose('Desde', 'Noviembre');
    expect(dialog()).not.toBeNull();
    expect(headings()).toEqual(['Noviembre 2025', 'Diciembre 2025']);
    expect(text(combobox('Desde'))).toBe('Noviembre');

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
    expect(text(combobox('Año'))).toBe('2026');
  });

  describe('teclado', () => {
    const focused = () => document.activeElement?.getAttribute('aria-label');

    async function key(name: string): Promise<void> {
      (document.activeElement as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { key: name, bubbles: true }),
      );
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
    }

    it('mueve el foco por días, semanas y meses y desplaza la vista si hace falta', async () => {
      await open();
      day('lunes, 23 de febrero de 2026').focus();

      await key('a');
      expect(focused()).toBe('lunes, 23 de febrero de 2026');
      await key('ArrowRight');
      expect(focused()).toBe('martes, 24 de febrero de 2026');
      await key('ArrowLeft');
      expect(focused()).toBe('lunes, 23 de febrero de 2026');
      await key('Home');
      expect(focused()).toBe('domingo, 22 de febrero de 2026');
      await key('End');
      expect(focused()).toBe('sábado, 28 de febrero de 2026');
      await key('ArrowUp');
      expect(focused()).toBe('sábado, 21 de febrero de 2026');

      // Fuera de los meses visibles (enero y febrero): la vista avanza un mes.
      await key('ArrowDown');
      expect(focused()).toBe('sábado, 28 de febrero de 2026');
      await key('ArrowDown');
      expect(focused()).toBe('sábado, 7 de marzo de 2026');
      expect(headings()).toEqual(['Febrero 2026', 'Marzo 2026']);

      // PageUp / PageDown van al mismo día del mes anterior / siguiente (o al último si no existe).
      await key('PageUp');
      expect(focused()).toBe('sábado, 7 de febrero de 2026');
      await key('PageUp');
      expect(focused()).toBe('miércoles, 7 de enero de 2026');
      expect(headings()).toEqual(['Enero 2026', 'Febrero 2026']);
      await key('PageDown');
      expect(focused()).toBe('sábado, 7 de febrero de 2026');
    });

    it('no pasa del primer mes que se puede mostrar', async () => {
      await open();
      await choose('Año', '2022');
      expect(headings()).toEqual(['Enero 2022', 'Febrero 2022']);

      day('sábado, 1 de enero de 2022').focus();
      await key('ArrowLeft');
      expect(focused()).toBe('sábado, 1 de enero de 2022');
      expect(headings()).toEqual(['Enero 2022', 'Febrero 2022']);
      expect(
        dialog()!.querySelector<HTMLButtonElement>('[aria-label="Mes anterior"]')!.disabled,
      ).toBe(true);
    });

    it('la vista previa ignora días que no se pueden elegir', async () => {
      await open();
      await click(day('viernes, 23 de enero de 2026'));
      day('martes, 24 de febrero de 2026').dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      expect(day('jueves, 29 de enero de 2026').parentElement?.getAttribute('aria-selected')).toBe(
        'false',
      );
      day('jueves, 29 de enero de 2026').dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(
        day('miércoles, 28 de enero de 2026').parentElement?.getAttribute('aria-selected'),
      ).toBe('true');
      // Al salir del día, la vista previa vuelve al día con foco (el inicio): no queda rango.
      day('jueves, 29 de enero de 2026').dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();
      expect(
        day('miércoles, 28 de enero de 2026').parentElement?.getAttribute('aria-selected'),
      ).toBe('false');

      // Un día inactivo no cambia la selección al hacer clic.
      await click(day('martes, 24 de febrero de 2026'));
      expect(text(dialog()!.querySelector('[aria-live="polite"]'))).toContain('Fecha inicial');
    });
  });

  it('ignora valores vacíos de los selects y "Aplicar" sin rango completo', async () => {
    await open();
    const picker = fixture.debugElement.query(By.directive(PeriodPicker))
      .componentInstance as unknown as {
      onMonthChange(month: number | null): void;
      onYearChange(year: number | null): void;
      apply(): void;
    };

    picker.onMonthChange(null);
    picker.onYearChange(null);
    picker.apply();
    fixture.detectChanges();

    expect(headings()).toEqual(['Enero 2026', 'Febrero 2026']);
    expect(host.aplicados).toEqual([]);

    // Un mes futuro no se puede mostrar a la izquierda: la vista queda en el mes actual.
    picker.onMonthChange(10);
    fixture.detectChanges();
    expect(headings()).toEqual(['Febrero 2026', 'Marzo 2026']);
  });
});
