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
import { PERIODOS } from '../../../../testing/periodos-descuento.fixtures';
import { INFORME_GENERADO } from '../../../../testing/ventas-descuento.fixtures';
import { API_BASE_URL } from '../../../core/config/api-base-url';
import { AutomaticDiscounts } from './automatic-discounts';
import { AUTOMATIC_COLUMN_LABELS } from './automatic-discounts.columns';

const API = '/api/Informes';
const RUTA = '/movilizados-cliente?tipo=automaticos';
/** Periodo procesado de diciembre de 2025 (de los fixtures). */
const URL_DICIEMBRE = `${RUTA}&desde=2025-12-01&hasta=2025-12-31`;

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

  /** Abre la pantalla y responde los periodos procesados. */
  async function navigate(url = RUTA): Promise<void> {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, AutomaticDiscounts);
    element = harness.routeNativeElement!;
    await settle();
    http.expectOne(`${API}/ObtenerPeriodosDescuento`).flush(PERIODOS);
    await settle();
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
  const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')].map(text);

  async function choose(select: string, option: string): Promise<void> {
    combobox(select).click();
    await stable();
    [...document.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((item) => text(item) === option)!
      .click();
    await stable();
  }

  const button = (name: string) =>
    [...element.querySelectorAll('button')].find(
      (item) => text(item) === name,
    ) as HTMLButtonElement;

  it('carga los periodos procesados: Año en el más reciente y Periodo por elegir', async () => {
    await navigate();

    expect(element.querySelector('app-period-picker')).toBeNull();
    expect(text(combobox('Año'))).toBe('2026');
    expect(text(combobox('Periodo'))).toBe('DD/MM/AAAA – DD/MM/AAAA');
    expect(button('Consultar').disabled).toBe(true);
    expect([...element.querySelectorAll('th')].map(text)).toEqual(AUTOMATIC_COLUMN_LABELS);
    http.expectNone((req) => req.url.includes('ObtenerInformeDescuentoCliente'));

    combobox('Año').click();
    await stable();
    expect(options()).toEqual(['2026', '2025']);
  });

  it('lista los periodos del año elegido en orden y consulta con sus fechas', async () => {
    await navigate();
    const router = TestBed.inject(Router);

    await choose('Año', '2025');
    combobox('Periodo').click();
    await stable();
    expect(options()).toEqual([
      '01/10/2025 – 31/10/2025',
      '01/11/2025 – 30/11/2025',
      '01/12/2025 – 31/12/2025',
    ]);
    [...document.querySelectorAll<HTMLElement>('[role="option"]')].at(-1)!.click();
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
    expect(text(combobox('Año'))).toBe('2025');
    expect(text(combobox('Periodo'))).toBe('DD/MM/AAAA – DD/MM/AAAA');
    expect(button('Consultar').disabled).toBe(true);
  });

  it('con el periodo en la URL lo muestra elegido y pinta las columnas de automáticos', async () => {
    await navigate(URL_DICIEMBRE);
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
    await navigate(URL_DICIEMBRE);
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
    http
      .expectOne(`${API}/ObtenerPeriodosDescuento`)
      .flush('Error', { status: 500, statusText: 'Server Error' });
    await stable();

    expect(text(element.querySelector('app-processed-period-select [role="alert"]'))).toBe(
      'No pudimos cargar los periodos. Reintentar',
    );
    expect(combobox('Periodo').disabled).toBe(true);

    button('Reintentar').click();
    await settle();
    http.expectOne(`${API}/ObtenerPeriodosDescuento`).flush(PERIODOS);
    await stable();
    expect(combobox('Periodo').disabled).toBe(false);
  });
});
