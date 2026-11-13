import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  INFORME_GENERADO,
  PAGINA_VACIA,
  pagina,
  VENTAS,
  venta,
} from '../../../testing/ventas-descuento.fixtures';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { TODAY } from '../../core/date/today';
import { DiscountSales } from './discount-sales';
import { PeriodPicker } from '../../shared/components/period-picker/period-picker';
import { VENTAS_COLUMN_LABELS } from './discount-sales.columns';

const API = '/api/Informes';
const URL_CONSULTA = '/ventas-descuento?desde=2026-01-23&hasta=2026-02-22';

const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('DiscountSales', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'ventas-descuento', component: DiscountSales }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: TODAY, useValue: () => new Date(2026, 1, 23) },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    // Los overlays de CDK quedan en el body entre pruebas.
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove());
  });

  async function navigate(url = '/ventas-descuento'): Promise<void> {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, DiscountSales);
    element = harness.routeNativeElement!;
  }

  async function stable(): Promise<void> {
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  /** Deja correr la navegación, efectos y microtareas sin esperar las peticiones pendientes. */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    for (let i = 0; i < 3; i++) {
      TestBed.tick();
      await Promise.resolve();
    }
    harness.detectChanges();
  }

  function expectVentas(page = 1, cedula: string | null = null): TestRequest {
    return http.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${API}/ObtenerInformeDetalladoVentasDescuento` &&
        req.params.get('FechaInicio') === '2026-01-23' &&
        req.params.get('FechaFin') === '2026-02-22' &&
        req.params.get('Pagina') === String(page) &&
        req.params.get('CantidadRegistros') === '10' &&
        req.params.get('Cedula') === cedula,
    );
  }

  async function cargar(respuesta = pagina(), url = URL_CONSULTA): Promise<void> {
    await navigate(url);
    await settle();
    expectVentas().flush(respuesta);
    await stable();
  }

  const button = (name: string) =>
    [...element.querySelectorAll('button')].find(
      (item) => text(item) === name,
    ) as HTMLButtonElement;
  const busqueda = () => element.querySelector<HTMLInputElement>('app-search-field input')!;
  const columna = (index: number) =>
    [...element.querySelectorAll('tbody tr')].map((row) => text(row.querySelectorAll('td')[index]));
  const paginador = () => text(element.querySelector('app-paginator'));
  /** Párrafos del área vacía de la tabla (mensaje inicial, sin resultados o error). */
  const mensajeVacio = () =>
    [...element.querySelectorAll('[data-slot=table-container] + div p')].map(text);

  it('sin periodo muestra el mensaje inicial y deja las acciones inactivas', async () => {
    await navigate();

    expect(text(element.querySelector('h1'))).toBe('Reporte de ventas con descuento');
    expect(mensajeVacio()).toEqual(['Elige un periodo para generar el reporte']);
    expect(button('Consultar').disabled).toBe(true);
    expect(button('Enviar reporte').disabled).toBe(true);
    expect(busqueda().disabled).toBe(true);
    expect(paginador()).toContain('de 1');
    // Encabezados de todas las columnas del swagger, aunque no haya filas.
    expect([...element.querySelectorAll('th')].map(text)).toEqual(VENTAS_COLUMN_LABELS);
    http.expectNone((req) => req.url.includes('ObtenerInformeDetalladoVentasDescuento'));
  });

  it('"Consultar" escribe el periodo en la URL', async () => {
    await navigate();
    const router = TestBed.inject(Router);
    // El selector de periodo tiene sus propias pruebas: aquí se simula "Aplicar".
    const picker = harness.routeDebugElement!.query(By.directive(PeriodPicker))
      .componentInstance as PeriodPicker;
    picker.periodoChange.emit({ inicio: new Date(2026, 0, 23), fin: new Date(2026, 1, 22) });
    harness.detectChanges();

    expect(button('Consultar').disabled).toBe(false);
    button('Consultar').click();
    await settle();

    expect(router.url).toBe(URL_CONSULTA);
    expectVentas().flush(pagina());
    await stable();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(10);
  });

  it('pinta la página con los valores formateados y habilita búsqueda y envío', async () => {
    await cargar();

    expect(columna(0)).toEqual(VENTAS.map((item) => item.guia));
    expect(text(element.querySelector('tbody tr'))).toContain('$ 60.000');
    const primera = [...element.querySelectorAll('tbody tr')[0].querySelectorAll('td')].map(text);
    expect(primera.slice(0, 8)).toEqual([
      'GU2024000',
      '$ 60.000',
      '$ 6.100',
      '$ 1.500',
      '$ 110.500',
      '$ 170.000',
      '19,5%',
      '$ 11.700',
    ]);
    expect(primera[20]).toBe('23/01/2026');
    // Sin dato: "—" para la vista y "Sin dato" para lectores de pantalla.
    expect(columna(11)[8]).toBe('—Sin dato');
    expect(busqueda().disabled).toBe(false);
    expect(button('Enviar reporte').disabled).toBe(false);
    expect(paginador()).toContain('de 2');
    expect(text(element.querySelector('[aria-live="polite"]'))).toBe(
      '15 ventas con descuento. Página 1 de 2.',
    );
  });

  it('ordena en el cliente la página recibida, sin volver a consultar', async () => {
    const desordenadas = [
      venta({ guia: 'B', descuentoFlete: 12 }),
      venta({ guia: 'C', descuentoFlete: 30 }),
      venta({ guia: 'A', descuentoFlete: 5 }),
    ];
    await cargar(pagina({ listaResultado: desordenadas, totalPaginas: 1, totalElementos: 3 }));

    const header = [...element.querySelectorAll('th')].find(
      (th) => text(th) === '% de descuento flete',
    )!;
    header.querySelector('button')!.click();
    harness.detectChanges();
    expect(columna(0)).toEqual(['A', 'B', 'C']);
    expect(header.getAttribute('aria-sort')).toBe('ascending');

    header.querySelector('button')!.click();
    harness.detectChanges();
    expect(columna(0)).toEqual(['C', 'B', 'A']);
    expect(header.getAttribute('aria-sort')).toBe('descending');
    http.expectNone((req) => req.url.includes('ObtenerInformeDetalladoVentasDescuento'));
  });

  it('la paginación es del servidor: cambiar de página pide la siguiente', async () => {
    await cargar();
    const router = TestBed.inject(Router);

    element.querySelector<HTMLButtonElement>('[aria-label="Página siguiente"]')!.click();
    await settle();

    expect(router.url).toBe(`${URL_CONSULTA}&pagina=2`);
    expectVentas(2).flush(pagina({ paginaActual: 2, listaResultado: VENTAS.slice(0, 5) }));
    await stable();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(element.querySelector<HTMLInputElement>('app-paginator input')!.value).toBe('2');
  });

  it('busca por No. identificación al consultar y conserva la búsqueda sin resultados', async () => {
    await cargar();
    const router = TestBed.inject(Router);

    busqueda().value = '1032456789';
    busqueda().dispatchEvent(new Event('input'));
    // Enter en el campo envía el formulario como "Consultar".
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle();

    expect(router.url).toBe(`${URL_CONSULTA}&cedula=1032456789`);
    expectVentas(1, '1032456789').flush(PAGINA_VACIA);
    await stable();

    expect(mensajeVacio()).toEqual([
      'No se encontraron registros',
      'No hay ventas con descuento para este No. de identificación en el periodo.',
      'Intenta con otro número o periodo.',
    ]);
    // Sigue habilitada para corregir el número, aunque esta consulta no trajo registros.
    expect(busqueda().disabled).toBe(false);
    expect(busqueda().value).toBe('1032456789');
    expect(button('Enviar reporte').disabled).toBe(true);
  });

  it('sin registros en el periodo muestra el mensaje del diseño y deja la búsqueda inactiva', async () => {
    await cargar(PAGINA_VACIA);

    expect(mensajeVacio()).toEqual([
      'No se encontraron registros',
      'No hay ventas con descuento en este período.',
      'Intenta con otro periodo.',
    ]);
    expect(busqueda().disabled).toBe(true);
    expect(button('Enviar reporte').disabled).toBe(true);
    expect(paginador()).toContain('de 1');
  });

  it('si la consulta falla muestra el error del backend y permite reintentar', async () => {
    await navigate(URL_CONSULTA);
    await settle();
    expectVentas().flush({
      error: true,
      mensaje: 'El periodo supera los 30 días.',
      resultado: null,
      statusCode: 400,
      descripcion: null,
    });
    await stable();

    const alerta = element.querySelector('[role="alert"]');
    expect(text(alerta)).toContain('No pudimos consultar el reporte.');
    expect(text(alerta)).toContain('El periodo supera los 30 días.');

    button('Reintentar').click();
    await settle();
    expectVentas().flush(pagina());
    await stable();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(10);
  });

  describe('"Enviar reporte"', () => {
    const dialog = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
    const dialogButton = (name: string) =>
      [...(dialog()?.querySelectorAll('button') ?? [])].find(
        (item) => text(item) === name,
      ) as HTMLButtonElement;

    async function abrir(): Promise<void> {
      await cargar(pagina(), `${URL_CONSULTA}&cedula=1032456789`);
      button('Enviar reporte').click();
      await stable();
    }

    async function cargar(respuesta: ReturnType<typeof pagina>, url: string): Promise<void> {
      await navigate(url);
      await settle();
      expectVentas(1, '1032456789').flush(respuesta);
      await stable();
    }

    it('confirma, pide el archivo del periodo consultado y avisa que va en camino', async () => {
      await abrir();

      expect(text(dialog())).toContain('¿Enviar el reporte por correo?');
      expect(text(dialog())).toContain(
        'En máximo 30 minutos recibirás un enlace de descarga válido por 1 hora.',
      );
      const enviar = dialogButton('Enviar');
      enviar.click();
      harness.detectChanges();

      const solicitud = http.expectOne(`${API}/ObtenerInformeDescuento`);
      expect(solicitud.request.method).toBe('POST');
      expect(solicitud.request.body).toEqual({
        fechaInicio: '2026-01-23',
        fechaFinal: '2026-02-22',
        tipoInforme: 3,
        guias: null,
        cedula: '1032456789',
      });
      expect(text(enviar)).toBe('Enviando…');
      expect(enviar.disabled).toBe(true);

      solicitud.flush(INFORME_GENERADO);
      await stable();
      expect(text(dialog())).toContain('Tu reporte está en camino');
      expect(text(dialog())).toContain(
        'Ya puedes cerrar esta ventana y continuar con tu operación.',
      );

      dialogButton('Cerrar').click();
      await stable();
      await new Promise((resolve) => setTimeout(resolve, 200));
      harness.detectChanges();
      expect(dialog()).toBeNull();
    });

    it('"No enviar" cierra sin pedir el archivo', async () => {
      await abrir();
      dialogButton('No enviar').click();
      await stable();
      await new Promise((resolve) => setTimeout(resolve, 200));
      harness.detectChanges();

      expect(dialog()).toBeNull();
      http.expectNone(`${API}/ObtenerInformeDescuento`);
    });

    it('si el envío falla, el modal sigue abierto con el error para reintentar', async () => {
      await abrir();
      dialogButton('Enviar').click();
      harness.detectChanges();
      http
        .expectOne(`${API}/ObtenerInformeDescuento`)
        .flush('Error', { status: 500, statusText: 'Server Error' });
      await stable();

      expect(text(dialog()?.querySelector('[role="alert"]'))).toBe(
        'No pudimos enviar el reporte. Inténtalo de nuevo.',
      );
      expect(dialogButton('Enviar').disabled).toBe(false);
    });
  });
});
