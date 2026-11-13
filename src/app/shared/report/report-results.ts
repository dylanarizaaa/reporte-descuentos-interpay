import { computed, linkedSignal, type Resource, type Signal } from '@angular/core';
import type { Periodo } from '../../core/date/periodo';
import { formatInteger } from '../../core/format/formatters';
import { ApiError, type ResultadoPaginado } from '../../core/http/api-response';
import { resourceValue } from '../../core/resource/resource-value';

/** Qué muestra el área de la tabla cuando no hay filas. */
export type EstadoVacio = 'inicial' | 'sin-resultados' | 'error';

export interface ReportResultsOptions {
  /** Periodo consultado (`null` sin consulta). */
  readonly periodo: Signal<Periodo | null>;
  /** No. de identificación consultado. */
  readonly cedula: Signal<string>;
  readonly pagina: Signal<number>;
  /** Nombre de los registros para el anuncio: "venta con descuento" / "ventas con descuento". */
  readonly singular: string;
  readonly plural: string;
}

/** Estado derivado de una página de resultados del servidor, común a las pantallas de reportes. */
export interface ReportResults<T> {
  readonly rows: Signal<T[]>;
  readonly hayResultados: Signal<boolean>;
  readonly totalPages: Signal<number>;
  /** Sin registros que paginar (o con error); mientras carga otra página sigue activo. */
  readonly paginadorInactivo: Signal<boolean>;
  /** La búsqueda se habilita cuando la consulta trae registros (o ya hay una búsqueda aplicada). */
  readonly busquedaHabilitada: Signal<boolean>;
  readonly estadoVacio: Signal<EstadoVacio>;
  readonly mensajeError: Signal<string>;
  /** Resumen para lectores de pantalla cada vez que cambia el resultado. */
  readonly anuncio: Signal<string>;
}

/**
 * Estado de la tabla, el paginador y la búsqueda a partir del recurso que pide la página.
 * Solo crea `computed`/`linkedSignal`: puede llamarse al inicializar un campo del componente.
 */
export function createReportResults<T>(
  resource: Resource<ResultadoPaginado<T> | undefined>,
  options: ReportResultsOptions,
): ReportResults<T> {
  const empty: T[] = [];

  /** Última página recibida; se conserva mientras se carga la siguiente. */
  const ultimaPagina = linkedSignal<
    ResultadoPaginado<T> | undefined,
    ResultadoPaginado<T> | undefined
  >({
    source: () => resourceValue(resource),
    computation: (pagina, previous) => pagina ?? previous?.value,
  });

  // TanStack recibe `T[]`: la lista del backend no se modifica, solo se lee.
  const rows = computed(() => (resourceValue(resource)?.listaResultado as T[] | null) ?? empty);
  const totalPages = computed(() => Math.max(ultimaPagina()?.totalPaginas ?? 1, 1));

  return {
    rows,
    hayResultados: computed(() => rows().length > 0),
    totalPages,
    paginadorInactivo: computed(
      () =>
        !options.periodo() ||
        resource.status() === 'error' ||
        (ultimaPagina()?.totalElementos ?? 0) === 0,
    ),
    busquedaHabilitada: computed(
      () =>
        options.cedula() !== '' ||
        (!!options.periodo() && (ultimaPagina()?.totalElementos ?? 0) > 0),
    ),
    estadoVacio: computed(() => {
      if (resource.status() === 'error') {
        return 'error';
      }
      return options.periodo() ? 'sin-resultados' : 'inicial';
    }),
    mensajeError: computed(() => {
      const error = resource.error();
      return error instanceof ApiError
        ? error.message
        : 'Verifica tu conexión e inténtalo de nuevo.';
    }),
    anuncio: computed(() => {
      if (resource.isLoading()) {
        return 'Consultando el reporte…';
      }
      const pagina = resourceValue(resource);
      if (!pagina) {
        return '';
      }
      const total = pagina.totalElementos;
      if (total === 0) {
        return 'No se encontraron registros.';
      }
      const nombre = total === 1 ? options.singular : options.plural;
      return `${formatInteger(total)} ${nombre}. Página ${options.pagina()} de ${totalPages()}.`;
    }),
  };
}
