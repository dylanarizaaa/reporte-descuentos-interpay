import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { respuesta } from '../../../testing/ventas-descuento.fixtures';
import { API_BASE_URL } from '../config/api-base-url';
import { PeriodosDescuentoService } from './periodos-descuento.service';

describe('PeriodosDescuentoService', () => {
  let service: PeriodosDescuentoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(PeriodosDescuentoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide los periodos del año y los devuelve como fechas locales, del más reciente al más antiguo', async () => {
    const result = firstValueFrom(service.getPeriodos(2026));
    const req = http.expectOne((r) => r.url === '/api/Informes/ObtenerPeriodosDescuento');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('anio')).toBe('2026');
    req.flush(
      respuesta([
        {
          idPeriodo: 1,
          fechaInicioPeriodo: '2025-12-01T00:00:00',
          fechaFinPeriodo: '2025-12-31T00:00:00',
        },
        { idPeriodo: 2, fechaInicioPeriodo: '2026-01-01', fechaFinPeriodo: '2026-01-31' },
        { idPeriodo: 3, fechaInicioPeriodo: 'no-es-fecha', fechaFinPeriodo: '2026-02-28' },
      ]),
    );
    expect(await result).toEqual([
      { id: 2, inicio: new Date(2026, 0, 1), fin: new Date(2026, 0, 31) },
      { id: 1, inicio: new Date(2025, 11, 1), fin: new Date(2025, 11, 31) },
    ]);
  });

  it('sin periodos devuelve una lista vacía', async () => {
    const result = firstValueFrom(service.getPeriodos(2024));
    http
      .expectOne((r) => r.url === '/api/Informes/ObtenerPeriodosDescuento')
      .flush(respuesta(null));
    expect(await result).toEqual([]);
  });
});
