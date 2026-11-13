import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideSendHorizontal } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { injectTable, type SortingState, type Updater } from '@tanstack/angular-table';
import type {
  VentaDescuento,
  VentasDescuentoPagina,
} from '../../core/data-access/ventas-descuento.model';
import { VentasDescuentoService } from '../../core/data-access/ventas-descuento.service';
import { parsePeriodo, type Periodo, periodoToParams, samePeriodo } from '../../core/date/periodo';
import { formatInteger } from '../../core/format/formatters';
import { ApiError } from '../../core/http/api-response';
import { resourceValue } from '../../core/resource/resource-value';
import { injectQueryParam } from '../../core/routing/route-params';
import { DataTable } from '../../shared/components/data-table/data-table';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../shared/components/error-state/error-state';
import { Paginator } from '../../shared/components/paginator/paginator';
import { PeriodPicker } from '../../shared/components/period-picker/period-picker';
import {
  VENTAS_COLUMN_PINNING,
  VENTAS_COLUMNS,
  VENTAS_TABLE_FEATURES,
} from './discount-sales.columns';
import { SendReportDialog } from './send-report-dialog';

/** Registros por página (`CantidadRegistros`), como en el diseño. */
export const PAGE_SIZE = 10;

const NO_ROWS: VentaDescuento[] = [];
const rowId = (row: VentaDescuento, index: number) => `${index}-${row.guia ?? 'sin-guia'}`;

/**
 * "Reporte de ventas con descuento": costos y descuentos aplicados a clientes Inter Pay.
 *
 * La consulta vive en la URL (`?desde=AAAA-MM-DD&hasta=AAAA-MM-DD&cedula=…&pagina=n`): "Consultar"
 * la escribe y la tabla se recarga desde ahí, así que recargar la página o volver atrás conserva
 * el reporte. La paginación es del servidor y el orden de las columnas, del cliente.
 */
@Component({
  selector: 'app-discount-sales',
  imports: [
    DataTable,
    EmptyState,
    ErrorState,
    HlmButton,
    NgIcon,
    Paginator,
    PeriodPicker,
    ReactiveFormsModule,
    SendReportDialog,
  ],
  providers: [provideIcons({ lucideSearch, lucideSendHorizontal })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './discount-sales.html',
})
export class DiscountSales {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(VentasDescuentoService);

  // --- Consulta (URL) ---------------------------------------------------------------------------

  private readonly desdeParam = injectQueryParam('desde');
  private readonly hastaParam = injectQueryParam('hasta');
  private readonly cedulaParam = injectQueryParam('cedula');
  private readonly paginaParam = injectQueryParam('pagina');

  /** Periodo de la consulta actual; `null` mientras no se haya consultado. */
  protected readonly periodoConsultado = computed(
    () => parsePeriodo(this.desdeParam(), this.hastaParam()),
    { equal: samePeriodo },
  );
  protected readonly cedulaConsultada = computed(() => this.cedulaParam()?.trim() ?? '');
  protected readonly pageNumber = computed(() => {
    const page = Number.parseInt(this.paginaParam() ?? '', 10);
    return Number.isFinite(page) && page > 0 ? page : 1;
  });

  // --- Filtros (aún sin consultar) --------------------------------------------------------------

  /** Periodo elegido en el calendario; empieza con el de la URL. */
  protected readonly periodoElegido = linkedSignal<Periodo | null>(() => this.periodoConsultado());
  protected readonly busqueda = new FormControl('', { nonNullable: true });

  // --- Datos ------------------------------------------------------------------------------------

  protected readonly ventas = rxResource({
    params: () => {
      const periodo = this.periodoConsultado();
      return periodo
        ? { periodo, cedula: this.cedulaConsultada(), pagina: this.pageNumber() }
        : undefined;
    },
    stream: ({ params }) =>
      this.service.getVentas({
        fechaInicio: params.periodo.inicio,
        fechaFin: params.periodo.fin,
        cedula: params.cedula,
        pagina: params.pagina,
        cantidadRegistros: PAGE_SIZE,
      }),
  });

  /** Última página recibida; se conserva mientras se carga la siguiente. */
  private readonly ultimaPagina = linkedSignal<
    VentasDescuentoPagina | undefined,
    VentasDescuentoPagina | undefined
  >({
    source: () => resourceValue(this.ventas),
    computation: (pagina, previous) => pagina ?? previous?.value,
  });

  protected readonly rows = computed(() => resourceValue(this.ventas)?.listaResultado ?? NO_ROWS);
  protected readonly hayResultados = computed(() => this.rows().length > 0);
  protected readonly totalPages = computed(() =>
    Math.max(this.ultimaPagina()?.totalPaginas ?? 1, 1),
  );
  /** Sin registros que paginar (o con error); mientras carga otra página sigue activo. */
  protected readonly paginadorInactivo = computed(
    () =>
      !this.periodoConsultado() ||
      this.ventas.status() === 'error' ||
      (this.ultimaPagina()?.totalElementos ?? 0) === 0,
  );

  /** La búsqueda se habilita cuando la consulta trae registros (o ya hay una búsqueda aplicada). */
  protected readonly busquedaHabilitada = computed(
    () =>
      this.cedulaConsultada() !== '' ||
      (!!this.periodoConsultado() && (this.ultimaPagina()?.totalElementos ?? 0) > 0),
  );

  /** Qué muestra el área de la tabla cuando no hay filas. */
  protected readonly estadoVacio = computed<'inicial' | 'sin-resultados' | 'error'>(() => {
    if (this.ventas.status() === 'error') {
      return 'error';
    }
    return this.periodoConsultado() ? 'sin-resultados' : 'inicial';
  });

  protected readonly mensajeError = computed(() => {
    const error = this.ventas.error();
    return error instanceof ApiError ? error.message : 'Verifica tu conexión e inténtalo de nuevo.';
  });

  protected readonly lineasSinResultados = computed(() =>
    this.cedulaConsultada()
      ? [
          'No hay ventas con descuento para este No. de identificación en el periodo.',
          'Intenta con otro número o periodo.',
        ]
      : ['No hay ventas con descuento en este período.', 'Intenta con otro periodo.'],
  );

  /** Resumen para lectores de pantalla cada vez que cambia el resultado. */
  protected readonly anuncio = computed(() => {
    if (this.ventas.isLoading()) {
      return 'Consultando ventas con descuento…';
    }
    const pagina = resourceValue(this.ventas);
    if (!pagina) {
      return '';
    }
    if (pagina.totalElementos === 0) {
      return 'No se encontraron registros.';
    }
    const total = pagina.totalElementos;
    return `${formatInteger(total)} ${total === 1 ? 'venta' : 'ventas'} con descuento. Página ${this.pageNumber()} de ${this.totalPages()}.`;
  });

  // --- Tabla ------------------------------------------------------------------------------------

  /** Orden del cliente: se aplica sobre la página recibida. */
  protected readonly sorting = signal<SortingState>([]);

  protected readonly table = injectTable(() => ({
    features: VENTAS_TABLE_FEATURES,
    columns: VENTAS_COLUMNS,
    data: this.rows(),
    getRowId: rowId,
    state: {
      sorting: this.sorting(),
      columnPinning: VENTAS_COLUMN_PINNING,
    },
    onSortingChange: (updater: Updater<SortingState>) =>
      this.sorting.update((current) =>
        typeof updater === 'function' ? updater(current) : updater,
      ),
    sortDescFirst: false,
    enableMultiSort: false,
  }));

  // --- Enviar reporte ---------------------------------------------------------------------------

  protected readonly envioAbierto = signal(false);

  constructor() {
    // El campo de búsqueda refleja la cédula de la URL y se habilita solo con registros.
    effect(() => this.busqueda.setValue(this.cedulaConsultada(), { emitEvent: false }));
    effect(() => {
      if (this.busquedaHabilitada()) {
        this.busqueda.enable({ emitEvent: false });
      } else {
        this.busqueda.disable({ emitEvent: false });
      }
    });
  }

  protected consultar(event: Event): void {
    event.preventDefault();
    const periodo = this.periodoElegido();
    if (!periodo) {
      return;
    }
    const cedula = this.busqueda.enabled ? this.busqueda.value.trim() : '';
    const unchanged =
      samePeriodo(periodo, this.periodoConsultado()) && cedula === this.cedulaConsultada();
    if (unchanged && this.pageNumber() === 1) {
      // Misma consulta: la URL no cambia, se vuelve a pedir la información.
      this.ventas.reload();
      return;
    }
    this.navigate({ ...periodoToParams(periodo), cedula: cedula || null, pagina: null });
  }

  protected goToPage(page: number): void {
    this.navigate({ pagina: page > 1 ? page : null });
  }

  protected reintentar(): void {
    this.ventas.reload();
  }

  private navigate(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
