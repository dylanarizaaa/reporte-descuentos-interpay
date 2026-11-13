import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { paginaDescuentos } from '../../../testing/descuentos-cliente.fixtures';
import { API_BASE_URL } from '../config/api-base-url';
import { ApiError } from '../http/api-response';
import { TipoDescuento } from './descuentos-cliente.model';
import { DescuentosClienteService } from './descuentos-cliente.service';

describe('DescuentosClienteService', () => {
  let service: DescuentosClienteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(DescuentosClienteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta los descuentos con los nombres de parámetros del swagger', async () => {
    const result = firstValueFrom(
      service.getDescuentos({
        tipo: TipoDescuento.Automatico,
        fechaInicio: new Date(2026, 0, 23),
        fechaFin: new Date(2026, 1, 22),
        cedula: '30856789',
        pagina: 2,
        cantidadRegistros: 10,
      }),
    );
    const req = http.expectOne((r) => r.url === '/api/Informes/ObtenerInformeDescuentoCliente');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().sort()).toEqual(
      [
        'Cedula',
        'FechaFinal',
        'FechaInicio',
        'NumeroPagina',
        'TamanoPagina',
        'TipoDescuento',
      ].sort(),
    );
    expect(req.request.params.get('TipoDescuento')).toBe('2');
    expect(req.request.params.get('FechaInicio')).toBe('2026-01-23');
    expect(req.request.params.get('FechaFinal')).toBe('2026-02-22');
    expect(req.request.params.get('NumeroPagina')).toBe('2');
    expect(req.request.params.get('TamanoPagina')).toBe('10');
    expect(req.request.params.get('Cedula')).toBe('30856789');
    req.flush(paginaDescuentos({ paginaActual: 2 }));
    expect((await result).paginaActual).toBe(2);
  });

  it('sin cédula no envía el parámetro y convierte los errores del backend', async () => {
    const result = firstValueFrom(
      service.getDescuentos({
        tipo: TipoDescuento.Personalizado,
        fechaInicio: new Date(2026, 0, 1),
        fechaFin: new Date(2026, 0, 2),
        cedula: '  ',
        pagina: 1,
        cantidadRegistros: 10,
      }),
    );
    const req = http.expectOne((r) => r.url.endsWith('ObtenerInformeDescuentoCliente'));
    expect(req.request.params.has('Cedula')).toBe(false);
    req.flush({
      error: true,
      mensaje: 'Sin periodo',
      resultado: null,
      statusCode: 400,
      descripcion: null,
    });
    await expect(result).rejects.toEqual(new ApiError('Sin periodo', 400));
  });
});
