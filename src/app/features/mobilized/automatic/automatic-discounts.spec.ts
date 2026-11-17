import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DESCUENTOS, paginaDescuentos } from '../../../../testing/descuentos-cliente.fixtures';
import { PERIODOS_2025, PERIODOS_2026 } from '../../../../testing/periodos-descuento.fixtures';
import { INFORME_GENERADO } from '../../../../testing/ventas-descuento.fixtures';
import { API_BASE_URL } from '../../../core/config/api-base-url';
import { TODAY } from '../../../core/date/today';
import { AutomaticDiscounts } from './automatic-discounts';
import { AUTOMATIC_COLUMN_LABELS } from './automatic-discounts.columns';

const API = '/api/Informes';
const RUTA = '/movilizados-cliente?tipo=automaticos';
/** Periodo procesado de diciembre de 2025 (de los fixtures). */
const URL_DICIEMBRE = `${RUTA}&desde=2025-12-01&hasta=2025-12-31`;
const PERIODOS_POR_ANIO = { 2025: PERIODOS_2025, 2026: PERIODOS_2026 } as const;

const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('AutomaticDiscounts', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'movilizados-cliente', component: AutomaticDiscounts }]),
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
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.remove());
  });

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

  /** Petición de periodos procesados del año (el backend exige `anio`). */
  function expectPeriodos(anio: 2025 | 2026): TestRequest {
    return http.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${API}/ObtenerPeriodosDescuento` &&
        req.params.get('anio') === String(anio),
    );
  }

  async function responderPeriodos(anio: 2025 | 2026): Promise<void> {
    await settle();
    expectPeriodos(anio).flush(PERIODOS_POR_ANIO[anio]);
    await settle();
  }

  /** Abre la pantalla y responde los periodos del año que corresponde. */
  async function navigate(url = RUTA, anio: 2025 | 2026 = 2026): Promise<void> {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, AutomaticDiscounts);
    element = harness.routeNativeElement!;
    await responderPeriodos(anio);
  }

  function expectDescuentos(
    desde = '2025-12-01',
    hasta = '2025-12-31',
    cedula: string | null = null,
  ): TestRequest {
    return http.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${API}/ObtenerInformeDescuentoCliente` &&
        req.params.get('TipoDescuento') === '2' &&
        req.params.get('FechaInicio') === desde &&
        req.params.get('FechaFinal') === hasta &&
        req.params.get('NumeroPagina') === '1' &&
        req.params.get('TamanoPagina') === '10' &&
        req.params.get('Cedula') === cedula,
    );
  }

  /** Disparador de un select ("Año" o "Periodo"), nombrado por su <label>. */
  const combobox = (name: string) => {
    const label = [...element.querySelectorAll('label')].find((item) => text(item) === name)!;
    return document.getElementById(label.htmlFor) as HTMLButtonElement;
  };
  /** Opciones de la lista abierta (vive en su propio overlay). */
  const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')];

  async function open(select: string): Promise<void> {
    combobox(select).click();
    await stable();
  }

  async function choose(select: string, option: string): Promise<void> {
    await open(select);
    options()
      .find((item) => text(item) === option)!
      .click();
    // Sin esperar estabilidad: elegir un año deja pendiente la petición de sus periodos.
    await settle();
  }

  const button = (name: string) =>
    [...element.querySelectorAll('button')].find(
      (item) => text(item) === name,
    ) as HTMLButtonElement;

  it('pide los periodos del año actual: "Año" ofrece el actual y los cuatro anteriores', async () => {
    await navigate();

    expect(element.querySelector('app-period-picker')).toBeNull();
    expect(text(combobox('Año'))).toBe('2026');
    expect(text(combobox('Periodo'))).toBe('DD/MM/AAAA – DD/MM/AAAA');
    expect(button('Consultar').disabled).toBe(true);
    expect([...element.querySelectorAll('th')].map(text)).toEqual(AUTOMATIC_COLUMN_LABELS);
    http.expectNone((req) => req.url.includes('ObtenerInformeDescuentoCliente'));

    await open('Año');
    expect(options().map(text)).toEqual(['2026', '2025', '2024', '2023', '2022']);
  });

  it('al cambiar de año pide sus periodos, los lista en orden y consulta con sus fechas', async () => {
    await navigate();
    const router = TestBed.inject(Router);

    await choose('Año', '2025');
    await responderPeriodos(2025);
    await open('Periodo');
    expect(options().map(text)).toEqual([
      '01/10/2025 – 31/10/2025',
      '01/11/2025 – 30/11/2025',
      '01/12/2025 – 31/12/2025',
    ]);
    options().at(-1)!.click();
    await stable();
    expect(text(combobox('Periodo'))).toBe('01/12/2025 – 31/12/2025');

    button('Consultar').click();
    await settle();
    expect(router.url).toBe(URL_DICIEMBRE);
    expectDescuentos().flush(paginaDescuentos());
    await stable();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(10);
  });

  it('cambiar de año borra el periodo elegido', async () => {
    await navigate();
    await choose('Periodo', '01/01/2026 – 31/01/2026');
    expect(button('Consultar').disabled).toBe(false);

    await choose('Año', '2025');
    await responderPeriodos(2025);
    expect(text(combobox('Año'))).toBe('2025');
    expect(text(combobox('Periodo'))).toBe('DD/MM/AAAA – DD/MM/AAAA');
    expect(button('Consultar').disabled).toBe(true);
  });

  it('un año sin periodos procesados lo indica y deja "Periodo" inactivo', async () => {
    await navigate();

    await choose('Año', '2024');
    await settle();
    http
      .expectOne((req) => req.params.get('anio') === '2024')
      .flush({ error: false, mensaje: null, resultado: [], statusCode: 200, descripcion: null });
    await stable();

    expect(text(combobox('Periodo'))).toBe('Sin periodos procesados');
    expect(combobox('Periodo').disabled).toBe(true);
  });

  it('con el periodo en la URL pide los periodos de su año y lo muestra elegido', async () => {
    await navigate(URL_DICIEMBRE, 2025);
    expectDescuentos().flush(paginaDescuentos());
    await stable();

    expect(text(combobox('Año'))).toBe('2025');
    expect(text(combobox('Periodo'))).toBe('01/12/2025 – 31/12/2025');
    const primera = [...element.querySelectorAll('tbody tr')[0].querySelectorAll('td')].map(text);
    expect(primera).toEqual([
      'Carlos Rodríguez',
      '30856789',
      String(DESCUENTOS[0].movilizadosInterPay),
      String(DESCUENTOS[0].numeroMovilizados),
      '4%',
      '10%',
      '30 - 50 envíos',
      'Enviar',
    ]);
  });

  it('"Enviar" de una fila pide el informe de automáticos con las fechas del periodo', async () => {
    await navigate(URL_DICIEMBRE, 2025);
    expectDescuentos().flush(paginaDescuentos());
    await stable();

    element
      .querySelector<HTMLButtonElement>('[aria-label="Enviar reporte de Carlos Rodríguez"]')!
      .click();
    await stable();
    [...document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button')]
      .find((item) => text(item) === 'Sí, enviar')!
      .click();
    harness.detectChanges();

    const solicitud = http.expectOne(`${API}/ObtenerInformeDescuento`);
    expect(solicitud.request.body).toEqual({
      fechaInicio: '2025-12-01',
      fechaFinal: '2025-12-31',
      tipoInforme: 2,
      guias: null,
      cedula: '30856789',
    });
    solicitud.flush(INFORME_GENERADO);
    await stable();
  });

  it('si fallan los periodos lo avisa y permite reintentar', async () => {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(RUTA, AutomaticDiscounts);
    element = harness.routeNativeElement!;
    await settle();
    expectPeriodos(2026).flush('Error', { status: 500, statusText: 'Server Error' });
    await stable();

    expect(text(element.querySelector('app-processed-period-select [role="alert"]'))).toBe(
      'No pudimos cargar los periodos. Reintentar',
    );
    expect(combobox('Periodo').disabled).toBe(true);

    button('Reintentar').click();
    await responderPeriodos(2026);
    expect(combobox('Periodo').disabled).toBe(false);
  });
});
