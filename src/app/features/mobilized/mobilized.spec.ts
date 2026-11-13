import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { paginaDescuentos } from '../../../testing/descuentos-cliente.fixtures';
import { PERIODOS } from '../../../testing/periodos-descuento.fixtures';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { TODAY } from '../../core/date/today';
import { Mobilized } from './mobilized';

const API = '/api/Informes';
const RUTA = '/movilizados-cliente';

const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('Mobilized', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'movilizados-cliente', component: Mobilized }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: TODAY, useValue: () => new Date(2026, 1, 23) },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function navigate(url = RUTA): Promise<void> {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, Mobilized);
    element = harness.routeNativeElement!;
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

  const tabs = () => [...element.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

  it('muestra el encabezado y abre "Dtos. personalizados" con su calendario', async () => {
    await navigate();

    expect(text(element.querySelector('h1'))).toBe(
      'Reporte de descuentos y movilizados por cliente',
    );
    expect(tabs().map(text)).toEqual(['Dtos. personalizados', 'Dtos. automáticos']);
    expect(tabs()[0].getAttribute('aria-selected')).toBe('true');
    expect(element.querySelector('app-personalized-discounts app-period-picker')).not.toBeNull();
    expect(element.querySelector('app-automatic-discounts')).toBeNull();
    http.expectNone(`${API}/ObtenerPeriodosDescuento`);
  });

  it('abre "Dtos. automáticos" desde la URL con sus propios filtros', async () => {
    await navigate(`${RUTA}?tipo=automaticos`);
    await settle();

    expect(tabs()[1].getAttribute('aria-selected')).toBe('true');
    expect(
      element.querySelector('app-automatic-discounts app-processed-period-select'),
    ).not.toBeNull();
    expect(element.querySelector('app-personalized-discounts')).toBeNull();
    http.expectOne(`${API}/ObtenerPeriodosDescuento`).flush(PERIODOS);
  });

  it('cambiar de pestaña descarta la consulta de la anterior', async () => {
    await navigate(`${RUTA}?desde=2026-01-23&hasta=2026-02-22&cedula=30856789&pagina=2`);
    await settle();
    http
      .expectOne((req) => req.url === `${API}/ObtenerInformeDescuentoCliente`)
      .flush(paginaDescuentos());
    const router = TestBed.inject(Router);

    tabs()[1].click();
    await settle();

    expect(router.url).toBe(`${RUTA}?tipo=automaticos`);
    http.expectOne(`${API}/ObtenerPeriodosDescuento`).flush(PERIODOS);
    await settle();
    // Sin periodo de automáticos elegido no se consulta nada.
    http.expectNone((req) => req.url === `${API}/ObtenerInformeDescuentoCliente`);

    tabs()[0].click();
    await settle();
    expect(router.url).toBe(RUTA);
  });
});
