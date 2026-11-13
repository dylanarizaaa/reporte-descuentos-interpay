import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url';
import { startOfDay } from '../date/calendar-date';
import { toDate } from '../format/formatters';
import { type RespuestaGeneral, unwrapRespuesta } from '../http/api-response';
import type { PeriodoProcesado, PeriodoProcesadoResponse } from './periodos-descuento.model';

/** Periodos de descuentos automáticos procesados (`/Informes/ObtenerPeriodosDescuento`). */
@Injectable({ providedIn: 'root' })
export class PeriodosDescuentoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Periodos con fechas válidas, del más reciente al más antiguo. */
  getPeriodos(): Observable<PeriodoProcesado[]> {
    return this.http
      .get<RespuestaGeneral<readonly PeriodoProcesadoResponse[] | null>>(
        `${this.baseUrl}/Informes/ObtenerPeriodosDescuento`,
      )
      .pipe(
        map(unwrapRespuesta),
        map((periodos) =>
          (periodos ?? [])
            .map(toPeriodo)
            .filter((periodo): periodo is PeriodoProcesado => periodo !== null)
            .sort((a, b) => b.inicio.getTime() - a.inicio.getTime()),
        ),
      );
  }
}

function toPeriodo(periodo: PeriodoProcesadoResponse): PeriodoProcesado | null {
  const inicio = toDate(periodo.fechaInicioPeriodo);
  const fin = toDate(periodo.fechaFinPeriodo);
  return inicio && fin
    ? { id: periodo.idPeriodo, inicio: startOfDay(inicio), fin: startOfDay(fin) }
    : null;
}
