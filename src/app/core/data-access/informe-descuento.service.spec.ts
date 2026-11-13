import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { INFORME_GENERADO } from '../../../testing/ventas-descuento.fixtures';
import { API_BASE_URL } from '../config/api-base-url';
import { TipoInformeDescuento } from './informe-descuento.model';
import { InformeDescuentoService } from './informe-descuento.service';

describe('InformeDescuentoService', () => {
  let service: InformeDescuentoService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('pf.token', 'token-de-sesion');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(InformeDescuentoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('pide el informe del tipo indicado con fechas sin hora', async () => {
    const result = firstValueFrom(
      service.enviar({
        tipoInforme: TipoInformeDescuento.DescuentosAutomaticos,
        fechaInicio: new Date(2026, 0, 23),
        fechaFin: new Date(2026, 1, 22),
        cedula: ' 30856789 ',
      }),
    );
    const req = http.expectOne('/api/Informes/ObtenerInformeDescuento');
    expect(req.request.method).toBe('POST');
    // El backend identifica al destinatario del correo por el token de la sesión.
    expect(req.request.headers.get('IdToken')).toBe('token-de-sesion');
    expect(req.request.body).toEqual({
      fechaInicio: '2026-01-23',
      fechaFinal: '2026-02-22',
      tipoInforme: 2,
      guias: null,
      cedula: '30856789',
    });
    req.flush(INFORME_GENERADO);
    expect((await result).correoEnviado).toBe(true);
  });

  it('sin cédula envía null', () => {
    service
      .enviar({
        tipoInforme: TipoInformeDescuento.VentasDetallado,
        fechaInicio: new Date(2026, 0, 1),
        fechaFin: new Date(2026, 0, 2),
      })
      .subscribe();
    const req = http.expectOne('/api/Informes/ObtenerInformeDescuento');
    expect(req.request.body.cedula).toBeNull();
    expect(req.request.body.tipoInforme).toBe(3);
    req.flush(INFORME_GENERADO);
  });
});
