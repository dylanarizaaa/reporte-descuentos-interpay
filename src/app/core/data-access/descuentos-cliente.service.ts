import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url';
import { toIsoDate } from '../date/calendar-date';
import { type RespuestaGeneral, unwrapRespuesta } from '../http/api-response';
import type {
  ConsultaDescuentosCliente,
  DescuentosClientePagina,
} from './descuentos-cliente.model';

/** Descuentos y movilizados por cliente (`/Informes/ObtenerInformeDescuentoCliente`). */
@Injectable({ providedIn: 'root' })
export class DescuentosClienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Página de clientes con descuento del periodo. Fechas sin hora (`AAAA-MM-DD`). */
  getDescuentos(consulta: ConsultaDescuentosCliente): Observable<DescuentosClientePagina> {
    let params = new HttpParams()
      .set('TipoDescuento', consulta.tipo)
      .set('FechaInicio', toIsoDate(consulta.fechaInicio))
      .set('FechaFinal', toIsoDate(consulta.fechaFin))
      .set('NumeroPagina', consulta.pagina)
      .set('TamanoPagina', consulta.cantidadRegistros);
    const cedula = consulta.cedula?.trim();
    if (cedula) {
      params = params.set('Cedula', cedula);
    }
    return this.http
      .get<RespuestaGeneral<DescuentosClientePagina>>(
        `${this.baseUrl}/Informes/ObtenerInformeDescuentoCliente`,
        { params },
      )
      .pipe(map(unwrapRespuesta));
  }
}
