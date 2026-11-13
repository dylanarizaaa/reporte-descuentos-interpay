import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { pagina } from '../../../testing/ventas-descuento.fixtures';
import { API_BASE_URL } from '../config/api-base-url';
import { ApiError } from '../http/api-response';
import { VentasDescuentoService } from './ventas-descuento.service';

const BASE = 'https://api.test/api/CajaInter';

describe('VentasDescuentoService', () => {
  let service: VentasDescuentoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    service = TestBed.inject(VentasDescuentoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta la página de ventas con fechas sin hora y paginación del servidor', async () => {
    const result = firstValueFrom(
      service.getVentas({
        fechaInicio: new Date(2026, 0, 23),
        fechaFin: new Date(2026, 1, 22),
        pagina: 2,
        cantidadRegistros: 10,
      }),
    );
    const req = http.expectOne(
      (r) => r.url === `${BASE}/Informes/ObtenerInformeDetalladoVentasDescuento`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('FechaInicio')).toBe('2026-01-23');
    expect(req.request.params.get('FechaFin')).toBe('2026-02-22');
    expect(req.request.params.get('Pagina')).toBe('2');
    expect(req.request.params.get('CantidadRegistros')).toBe('10');
    expect(req.request.params.has('Cedula')).toBe(false);
    req.flush(pagina({ paginaActual: 2 }));
    expect((await result).paginaActual).toBe(2);
  });

  it('envía la cédula solo si tiene texto', () => {
    service
      .getVentas({
        fechaInicio: new Date(2026, 0, 1),
        fechaFin: new Date(2026, 0, 2),
        cedula: ' 1032456789 ',
        pagina: 1,
        cantidadRegistros: 10,
      })
      .subscribe();
    const req = http.expectOne((r) => r.url.endsWith('ObtenerInformeDetalladoVentasDescuento'));
    expect(req.request.params.get('Cedula')).toBe('1032456789');
    req.flush(pagina());
  });

  it('convierte una respuesta con error en ApiError', async () => {
    const result = firstValueFrom(
      service.getVentas({
        fechaInicio: new Date(2026, 0, 1),
        fechaFin: new Date(2026, 0, 2),
        pagina: 1,
        cantidadRegistros: 10,
      }),
    );
    http
      .expectOne((r) => r.url.endsWith('ObtenerInformeDetalladoVentasDescuento'))
      .flush({
        error: true,
        mensaje: 'Periodo no procesado',
        resultado: null,
        statusCode: 400,
        descripcion: null,
      });
    await expect(result).rejects.toEqual(new ApiError('Periodo no procesado', 400));
  });
});
