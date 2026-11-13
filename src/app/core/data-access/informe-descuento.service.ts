import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url';
import { toIsoDate } from '../date/calendar-date';
import { type RespuestaGeneral, unwrapRespuesta } from '../http/api-response';
import type {
  InformeDescuentoGenerado,
  SolicitudInformeDescuento,
} from './informe-descuento.model';

/** Genera los informes de descuentos (`/Informes/ObtenerInformeDescuento`) para enviarlos por correo. */
@Injectable({ providedIn: 'root' })
export class InformeDescuentoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Genera el archivo del informe y lo envía por correo al usuario de la sesión (el backend lo
   * identifica por el token que agrega el orquestador). Fechas sin hora (`AAAA-MM-DD`).
   */
  enviar(solicitud: SolicitudInformeDescuento): Observable<InformeDescuentoGenerado> {
    const cedula = solicitud.cedula?.trim();
    return this.http
      .post<RespuestaGeneral<InformeDescuentoGenerado>>(
        `${this.baseUrl}/Informes/ObtenerInformeDescuento`,
        {
          fechaInicio: toIsoDate(solicitud.fechaInicio),
          fechaFinal: toIsoDate(solicitud.fechaFin),
          tipoInforme: solicitud.tipoInforme,
          guias: null,
          cedula: cedula || null,
        },
      )
      .pipe(map(unwrapRespuesta));
  }
}
