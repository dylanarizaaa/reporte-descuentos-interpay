import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  DESCUENTOS,
  PAGINA_DESCUENTOS_VACIA,
  paginaDescuentos,
} from '../../../../testing/descuentos-cliente.fixtures';
import { INFORME_GENERADO } from '../../../../testing/ventas-descuento.fixtures';
import { API_BASE_URL } from '../../../core/config/api-base-url';
import { TODAY } from '../../../core/date/today';
import { PersonalizedDiscounts } from './personalized-discounts';
import { PERSONALIZED_COLUMN_LABELS } from './personalized-discounts.columns';

const API = '/api/Informes';
const RUTA = '/movilizados-cliente';
const URL_CONSULTA = `${RUTA}?desde=2026-01-23&hasta=2026-02-22`;

const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('PersonalizedDiscounts', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'movilizados-cliente', component: PersonalizedDiscounts }]),
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

  async function navigate(url = RUTA): Promise<void> {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, PersonalizedDiscounts);
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

  function expectDescuentos(tipo: 1 | 2 = 1, cedula: string | null = null): TestRequest {
    return http.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${API}/ObtenerInformeDescuentoCliente` &&
        req.params.get('TipoDescuento') === String(tipo) &&
        req.params.get('FechaInicio') === '2026-01-23' &&
        req.params.get('FechaFinal') === '2026-02-22' &&
        req.params.get('NumeroPagina') === '1' &&
        req.params.get('TamanoPagina') === '10' &&
        req.params.get('Cedula') === cedula,
    );
  }

  async function cargar(url = URL_CONSULTA, tipo: 1 | 2 = 1, cedula: string | null = null) {
    await navigate(url);
    await settle();
    expectDescuentos(tipo, cedula).flush(paginaDescuentos());
    await stable();
  }

  const button = (name: string) =>
    [...element.querySelectorAll('button')].find(
      (item) => text(item) === name,
    ) as HTMLButtonElement;
  const busqueda = () => element.querySelector<HTMLInputElement>('app-search-field input')!;
  const columna = (index: number) =>
    [...element.querySelectorAll('tbody tr')].map((row) => text(row.querySelectorAll('td')[index]));
  const dialog = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
  const dialogButton = (name: string) =>
    [...(dialog()?.querySelectorAll('button') ?? [])].find(
      (item) => text(item) === name,
    ) as HTMLButtonElement;

  it('sin periodo muestra el calendario, los encabezados y el mensaje inicial', async () => {
    await navigate();

    expect(element.querySelector('app-period-picker')).not.toBeNull();
    expect([...element.querySelectorAll('th')].map(text)).toEqual(PERSONALIZED_COLUMN_LABELS);
    expect(text(element.querySelector('app-empty-state'))).toBe(
      'Elige un periodo para generar el reporte',
    );
    expect(busqueda().disabled).toBe(true);
    expect(button('Enviar reporte').disabled).toBe(true);
    http.expectNone((req) => req.url.includes('ObtenerInformeDescuentoCliente'));
  });

  it('consulta los descuentos personalizados del periodo y pinta la tabla', async () => {
    await cargar();

    expect(columna(0)).toEqual(DESCUENTOS.map((item) => item.nombreCliente));
    const primera = [...element.querySelectorAll('tbody tr')[0].querySelectorAll('td')].map(text);
    expect(primera.slice(0, 7)).toEqual([
      'Carlos Rodríguez',
      '30856789',
      '04/02/2026',
      '06/02/2026',
      '35',
      '4%',
      '10%',
    ]);
    expect(primera.at(-1)).toBe('Enviar');
    expect(busqueda().disabled).toBe(false);
    expect(button('Enviar reporte').disabled).toBe(false);
    expect(text(element.querySelector('[aria-live="polite"]'))).toBe(
      '14 clientes con descuento. Página 1 de 2.',
    );
  });

  it('"Enviar" de la fila se desactiva si el cliente no tiene movilizados Inter Pay', async () => {
    await navigate(URL_CONSULTA);
    await settle();
    expectDescuentos().flush(
      paginaDescuentos({
        listaResultado: [DESCUENTOS[0], { ...DESCUENTOS[1], movilizadosInterPay: 0 }],
        totalElementos: 2,
        totalPaginas: 1,
      }),
    );
    await stable();

    const enviar = (nombre: string) =>
      element.querySelector<HTMLButtonElement>(`[aria-label="Enviar reporte de ${nombre}"]`)!;
    expect(enviar('Carlos Rodríguez').disabled).toBe(false);
    expect(enviar('María González').disabled).toBe(true);
  });

  it('busca por No. identificación con el input group y lo limpia con la X', async () => {
    await cargar();
    const router = TestBed.inject(Router);

    busqueda().value = '30856789';
    busqueda().dispatchEvent(new Event('input'));
    harness.detectChanges();
    const limpiar = element.querySelector<HTMLButtonElement>(
      'app-search-field button[aria-label="Limpiar buscar por no. identificación"]',
    );
    expect(limpiar).not.toBeNull();

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle();
    expect(router.url).toBe(`${URL_CONSULTA}&cedula=30856789`);
    expectDescuentos(1, '30856789').flush(
      paginaDescuentos({
        listaResultado: DESCUENTOS.slice(0, 1),
        totalElementos: 1,
        totalPaginas: 1,
      }),
    );
    await stable();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);

    element
      .querySelector<HTMLButtonElement>('app-search-field button[aria-label^="Limpiar"]')!
      .click();
    harness.detectChanges();
    expect(busqueda().value).toBe('');
    expect(document.activeElement).toBe(busqueda());
    expect(element.querySelector('app-search-field button')).toBeNull();
  });

  describe('envío por correo', () => {
    it('"Enviar" de una fila pide el informe de ese cliente con los textos del diseño', async () => {
      await cargar();

      element
        .querySelector<HTMLButtonElement>('[aria-label="Enviar reporte de María González"]')!
        .click();
      await stable();

      expect(text(dialog())).toContain('¿Quieres recibir el reporte en tu correo?');
      expect(text(dialog())).toContain(
        'En 30 minutos máx. recibirás un enlace de descarga válido por 1 hora.',
      );
      dialogButton('Sí, enviar').click();
      harness.detectChanges();

      const solicitud = http.expectOne(`${API}/ObtenerInformeDescuento`);
      expect(solicitud.request.body).toEqual({
        fechaInicio: '2026-01-23',
        fechaFinal: '2026-02-22',
        tipoInforme: 1,
        guias: null,
        cedula: '30856790',
      });
      solicitud.flush(INFORME_GENERADO);
      await stable();
      expect(text(dialog())).toContain('El reporte va en camino');
      expect(text(dialog())).toContain('Revisa tu bandeja de entrada o el correo no deseado.');

      dialogButton('Entendido').click();
      await stable();
      await new Promise((resolve) => setTimeout(resolve, 200));
      harness.detectChanges();
      expect(dialog()).toBeNull();
    });

    it('"Enviar reporte" pide el informe de personalizados con la búsqueda consultada', async () => {
      await cargar(`${URL_CONSULTA}&cedula=30856789`, 1, '30856789');

      button('Enviar reporte').click();
      await stable();
      dialogButton('Sí, enviar').click();
      harness.detectChanges();

      const solicitud = http.expectOne(`${API}/ObtenerInformeDescuento`);
      expect(solicitud.request.body.tipoInforme).toBe(1);
      expect(solicitud.request.body.cedula).toBe('30856789');
      solicitud.flush(INFORME_GENERADO);
      await stable();
    });
  });

  it('si la consulta falla muestra el error y permite reintentar', async () => {
    await navigate(URL_CONSULTA);
    await settle();
    expectDescuentos().flush('Error', { status: 500, statusText: 'Server Error' });
    await stable();

    expect(text(element.querySelector('[role="alert"]'))).toContain(
      'No pudimos consultar el reporte.',
    );
    button('Reintentar').click();
    await settle();
    expectDescuentos().flush(paginaDescuentos());
    await stable();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(10);
  });
});
