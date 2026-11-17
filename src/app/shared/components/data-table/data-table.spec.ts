import { Component, input } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { injectTable, tableFeatures } from '@tanstack/angular-table';
import { DataTable } from './data-table';
import { REPORT_TABLE_FEATURES, reportColumn, type ReportColumnSpec } from './report-columns';

interface Fila {
  readonly id: string;
  readonly nombre: string;
  readonly valor: number;
}

const FILAS: Fila[] = [
  { id: '1', nombre: 'Ana', valor: 20 },
  { id: '2', nombre: 'Luis', valor: 10 },
];

const SPECS: ReportColumnSpec<Fila>[] = [
  { id: 'id', label: 'Id', kind: 'code', size: 100, value: (row) => row.id },
  { id: 'nombre', label: 'Nombre', kind: 'text', size: 200, value: (row) => row.nombre },
  { id: 'valor', label: 'Valor', kind: 'money', size: 150, value: (row) => row.valor },
  { id: 'extra', label: 'Extra', kind: 'text', size: 120, value: () => null },
];

/** Tabla de reporte: anchos fijos, "Id" fija al inicio y "Extra" al final. */
@Component({
  imports: [DataTable],
  template: `
    <app-data-table [table]="table" [loading]="loading()" labelledBy="titulo" density="compact">
      <p appDataTableEmpty>Sin filas</p>
    </app-data-table>
  `,
})
class ReportHost {
  readonly loading = input(false);
  readonly filas = input<Fila[]>(FILAS);
  readonly table = injectTable(() => ({
    features: REPORT_TABLE_FEATURES,
    columns: SPECS.map(reportColumn),
    data: this.filas(),
    state: { columnPinning: { start: ['id'], end: ['extra'] }, sorting: [] },
  }));
}

/** Tabla sin features: sin anchos, sin columnas fijas y sin orden. */
@Component({
  imports: [DataTable],
  template: `<app-data-table [table]="table" [loading]="loading()" />`,
})
class MinimalHost {
  readonly loading = input(false);
  readonly table = injectTable(() => ({
    features: tableFeatures({}),
    columns: [{ accessorKey: 'nombre', header: 'Nombre' }],
    data: FILAS,
  }));
}

/** jsdom no mide el layout: se simulan el ancho visible del contenedor y el de la tabla. */
let viewportWidth = 1200;
const SCROLL_WIDTH = 1500;
const isContainer = (element: HTMLElement) =>
  element.getAttribute?.('data-slot') === 'table-container';

class FakeResizeObserver {
  static disconnected = 0;
  constructor(private readonly callback: () => void) {}
  observe(): void {
    this.callback();
  }
  disconnect(): void {
    FakeResizeObserver.disconnected++;
  }
}

const originalResizeObserver = globalThis.ResizeObserver;

describe('DataTable', () => {
  beforeEach(() => {
    globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return isContainer(this) ? viewportWidth : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return isContainer(this) ? SCROLL_WIDTH : 0;
      },
    });
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
    delete (HTMLElement.prototype as { scrollWidth?: number }).scrollWidth;
    viewportWidth = 1200;
  });

  async function render<T>(
    host: new () => T,
    inputs: Record<string, unknown> = {},
  ): Promise<ComponentFixture<T>> {
    const fixture = TestBed.createComponent(host);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const el = (fixture: ComponentFixture<unknown>) => fixture.nativeElement as HTMLElement;
  const headers = (fixture: ComponentFixture<unknown>) =>
    [...el(fixture).querySelectorAll('th')] as HTMLTableCellElement[];

  it('fija las columnas de inicio y fin con su desplazamiento y su divisor', async () => {
    const fixture = await render(ReportHost);
    const [id, nombre, , extra] = headers(fixture);

    expect(id.style.position).toBe('sticky');
    expect(id.style.getPropertyValue('inset-inline-start')).toBe('0px');
    expect(id.classList).toContain('border-e');
    expect(extra.style.getPropertyValue('inset-inline-end')).toBe('0px');
    expect(extra.classList).toContain('border-s');
    expect(nombre.style.position).toBe('');
    expect(nombre.classList).not.toContain('border-e');

    const firstRowCells = [...el(fixture).querySelectorAll('tbody tr:first-child td')];
    expect((firstRowCells[0] as HTMLElement).style.position).toBe('sticky');
    expect(firstRowCells[0].classList).toContain('h-12');
  });

  it('usa anchos fijos y hace accesible por teclado la región desplazable', async () => {
    const fixture = await render(ReportHost);
    const container = el(fixture).querySelector<HTMLElement>('[data-slot=table-container]')!;
    const table = el(fixture).querySelector('table')!;

    expect(table.style.width).toBe('570px');
    expect(table.classList).toContain('table-fixed');
    expect([...el(fixture).querySelectorAll('col')].map((col) => col.style.width)).toEqual([
      '100px',
      '200px',
      '150px',
      '120px',
    ]);
    expect(container.getAttribute('role')).toBe('region');
    expect(container.getAttribute('tabindex')).toBe('0');
    expect(container.style.getPropertyValue('scroll-padding-inline-start')).toBe('100px');
    expect(container.style.getPropertyValue('scroll-padding-inline-end')).toBe('120px');
    const [titulo, pista] = container.getAttribute('aria-labelledby')!.split(' ');
    expect(titulo).toBe('titulo');
    expect(el(fixture).querySelector(`#${pista}`)?.textContent).toBe(
      'tabla con desplazamiento horizontal',
    );
    expect(headers(fixture)[0].getAttribute('aria-sort')).toBe('none');
  });

  it('no fija columnas si no queda espacio para el centro de la tabla', async () => {
    viewportWidth = 400;
    const fixture = await render(ReportHost);

    for (const th of headers(fixture)) {
      expect(th.style.position).toBe('');
      expect(th.classList).not.toContain('border-e');
      expect(th.classList).not.toContain('border-s');
    }
  });

  it('mientras carga pinta filas skeleton ocultas para lectores de pantalla', async () => {
    const fixture = await render(ReportHost, { loading: true });

    const rows = [...el(fixture).querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(el(fixture).querySelector('table')?.getAttribute('aria-busy')).toBe('true');
  });

  it('sin filas muestra el contenido vacío y no fija ni desplaza la tabla', async () => {
    const fixture = await render(ReportHost, { filas: [] });
    const container = el(fixture).querySelector<HTMLElement>('[data-slot=table-container]')!;

    expect(el(fixture).textContent).toContain('Sin filas');
    expect(container.style.overflowX).toBe('hidden');
    expect(container.hasAttribute('role')).toBe(false);
    expect(headers(fixture)[0].style.position).toBe('');
  });

  it('sin features usa el diseño automático, sin columnas fijas ni orden', async () => {
    const fixture = await render(MinimalHost);

    expect(el(fixture).querySelector('colgroup')).toBeNull();
    expect(el(fixture).querySelector('table')?.classList).not.toContain('table-fixed');
    expect(headers(fixture)[0].hasAttribute('aria-sort')).toBe(false);
    expect(
      [...el(fixture).querySelectorAll('tbody td')].map((td) => td.textContent?.trim()),
    ).toEqual(['Ana', 'Luis']);

    const cargando = await render(MinimalHost, { loading: true });
    expect(el(cargando).querySelectorAll('tbody tr:first-child td')).toHaveLength(1);
  });

  it('mide aunque el navegador no tenga ResizeObserver y lo libera al destruirse', async () => {
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;
    const sinObserver = await render(ReportHost);
    expect(el(sinObserver).querySelector('[data-slot=table-container]')?.getAttribute('role')).toBe(
      'region',
    );

    globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
    const conObserver = await render(ReportHost);
    const antes = FakeResizeObserver.disconnected;
    conObserver.destroy();
    expect(FakeResizeObserver.disconnected).toBe(antes + 1);
  });
});
