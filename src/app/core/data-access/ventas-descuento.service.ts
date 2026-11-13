import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url';
import { toIsoDate } from '../date/calendar-date';
import { type RespuestaGeneral, unwrapRespuesta } from '../http/api-response';
import {
  type ConsultaVentasDescuento,
  type InformeDescuentoGenerado,
  type SolicitudInformeDescuento,
  TipoInformeDescuento,
  type VentasDescuentoPagina,
} from './ventas-descuento.model';

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

  /**
   * Genera el archivo del informe y lo envía por correo al usuario de la sesión (el backend lo
   * identifica por el token que agrega el orquestador).
   */
  enviarInforme(solicitud: SolicitudInformeDescuento): Observable<InformeDescuentoGenerado> {
    const cedula = solicitud.cedula?.trim();
    return this.http
      .post<RespuestaGeneral<InformeDescuentoGenerado>>(
        `${this.baseUrl}/Informes/ObtenerInformeDescuento`,
        {
          fechaInicio: toIsoDate(solicitud.fechaInicio),
          fechaFinal: toIsoDate(solicitud.fechaFin),
          tipoInforme: TipoInformeDescuento.VentasDetallado,
          guias: null,
          cedula: cedula || null,
        },
      )
      .pipe(map(unwrapRespuesta));
  }
}
