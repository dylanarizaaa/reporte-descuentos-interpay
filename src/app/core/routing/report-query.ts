import { computed, inject, type Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MAX_PERIOD_DAYS,
  parsePeriodo,
  type Periodo,
  periodoToParams,
  samePeriodo,
} from '../date/periodo';
import { injectQueryParam } from './route-params';

/** Filtros que aplica "Consultar". */
export interface ConsultaReporte {
  readonly periodo: Periodo;
  /** No. de identificación; vacío para no filtrar. */
  readonly cedula: string;
}

/** Consulta de un reporte guardada en la URL. */
export interface ReportQuery {
  /** Periodo consultado; `null` mientras no se haya consultado. */
  readonly periodo: Signal<Periodo | null>;
  readonly cedula: Signal<string>;
  /** Página (desde 1). */
  readonly pagina: Signal<number>;
  /**
   * Escribe la consulta en la URL (vuelve a la página 1). Devuelve `false` si es la misma consulta
   * que ya se muestra: la URL no cambia y quien llama debe recargar los datos.
   */
  consultar(consulta: ConsultaReporte): boolean;
  goToPage(page: number): void;
  /** Cambia otros query params conservando los de la consulta. */
  navigate(queryParams: Record<string, string | number | null>): void;
}

export interface ReportQueryOptions {
  /** Días máximos del periodo de la URL (por defecto 30; `Infinity` para periodos del backend). */
  readonly maxDays?: number;
}

/**
 * Estado de la consulta de un reporte en la URL:
 * `?desde=AAAA-MM-DD&hasta=AAAA-MM-DD&cedula=…&pagina=n`. Así recargar la página o volver atrás
 * conserva el reporte. Debe llamarse en un contexto de inyección.
 */
export function injectReportQuery(options: ReportQueryOptions = {}): ReportQuery {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const desde = injectQueryParam('desde');
  const hasta = injectQueryParam('hasta');
  const cedulaParam = injectQueryParam('cedula');
  const paginaParam = injectQueryParam('pagina');

  const maxDays = options.maxDays ?? MAX_PERIOD_DAYS;
  const periodo = computed(() => parsePeriodo(desde(), hasta(), maxDays), { equal: samePeriodo });
  const cedula = computed(() => cedulaParam()?.trim() ?? '');
  const pagina = computed(() => {
    const page = Number.parseInt(paginaParam() ?? '', 10);
    return Number.isFinite(page) && page > 0 ? page : 1;
  });

  const navigate = (queryParams: Record<string, string | number | null>) => {
    void router.navigate([], { relativeTo: route, queryParams, queryParamsHandling: 'merge' });
  };

  return {
    periodo,
    cedula,
    pagina,
    consultar: (consulta) => {
      const cedulaNueva = consulta.cedula.trim();
      if (samePeriodo(consulta.periodo, periodo()) && cedulaNueva === cedula() && pagina() === 1) {
        return false;
      }
      navigate({ ...periodoToParams(consulta.periodo), cedula: cedulaNueva || null, pagina: null });
      return true;
    },
    goToPage: (page) => navigate({ pagina: page > 1 ? page : null }),
    navigate,
  };
}
