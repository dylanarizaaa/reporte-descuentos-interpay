import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url';
import { toIsoDate } from '../date/calendar-date';
import { type RespuestaGeneral, unwrapRespuesta } from '../http/api-response';
import type { ConsultaVentasDescuento, VentasDescuentoPagina } from './ventas-descuento.model';

/**
 * Informes de ventas con descuento de CajaInter (`/Informes`).
 *
 * Las fechas viajan sin hora (`AAAA-MM-DD`), que el backend recibe como `DateTime` a medianoche.
 */
@Injectable({ providedIn: 'root' })
export class VentasDescuentoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Página de ventas con descuento del periodo (tabla de la pantalla). */
  getVentas(consulta: ConsultaVentasDescuento): Observable<VentasDescuentoPagina> {
    let params = new HttpParams()
      .set('FechaInicio', toIsoDate(consulta.fechaInicio))
      .set('FechaFin', toIsoDate(consulta.fechaFin))
      .set('Pagina', consulta.pagina)
      .set('CantidadRegistros', consulta.cantidadRegistros);
    const cedula = consulta.cedula?.trim();
    if (cedula) {
      params = params.set('Cedula', cedula);
    }
    return this.http
      .get<RespuestaGeneral<VentasDescuentoPagina>>(
        `${this.baseUrl}/Informes/ObtenerInformeDetalladoVentasDescuento`,
        { params },
      )
      .pipe(map(unwrapRespuesta));
  }
}
