import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { injectTable, type SortingState, type Updater } from '@tanstack/angular-table';
import { throwError } from 'rxjs';
import { TipoInformeDescuento } from '../../core/data-access/informe-descuento.model';
import { InformeDescuentoService } from '../../core/data-access/informe-descuento.service';
import type { VentaDescuento } from '../../core/data-access/ventas-descuento.model';
import type { Periodo } from '../../core/date/periodo';
import { VentasDescuentoService } from '../../core/data-access/ventas-descuento.service';
import { type ConsultaReporte, injectReportQuery } from '../../core/routing/report-query';
import { DataTable } from '../../shared/components/data-table/data-table';
import { REPORT_TABLE_FEATURES } from '../../shared/components/data-table/report-columns';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../shared/components/error-state/error-state';
import { Paginator } from '../../shared/components/paginator/paginator';
import { PeriodPicker } from '../../shared/components/period-picker/period-picker';
import { ReportFilters } from '../../shared/components/report-filters/report-filters';
import { SendReportDialog } from '../../shared/components/send-report-dialog/send-report-dialog';
import { createReportResults } from '../../shared/report/report-results';
import { VENTAS_COLUMN_PINNING, VENTAS_COLUMNS } from './discount-sales.columns';

/** Registros por página (`CantidadRegistros`), como en el diseño. */
export const PAGE_SIZE = 10;

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
    Paginator,
    PeriodPicker,
    ReportFilters,
    SendReportDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './discount-sales.html',
})
export class DiscountSales {
  private readonly service = inject(VentasDescuentoService);
  private readonly informes = inject(InformeDescuentoService);

  protected readonly query = injectReportQuery();
  /** Periodo elegido en el calendario y aún sin consultar; empieza con el de la URL. */
  protected readonly periodoElegido = linkedSignal<Periodo | null>(() => this.query.periodo());

  protected readonly ventas = rxResource({
    params: () => {
      const periodo = this.query.periodo();
      return periodo
        ? { periodo, cedula: this.query.cedula(), pagina: this.query.pagina() }
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

  protected readonly resultados = createReportResults(this.ventas, {
    ...this.query,
    singular: 'venta con descuento',
    plural: 'ventas con descuento',
  });

  protected readonly lineasSinResultados = computed(() =>
    this.query.cedula()
      ? [
          'No hay ventas con descuento para este No. de identificación en el periodo.',
          'Intenta con otro número o periodo.',
        ]
      : ['No hay ventas con descuento en este período.', 'Intenta con otro periodo.'],
  );

  // --- Tabla ------------------------------------------------------------------------------------

  /** Orden del cliente: se aplica sobre la página recibida. */
  protected readonly sorting = signal<SortingState>([]);

  protected readonly table = injectTable(() => ({
    features: REPORT_TABLE_FEATURES,
    columns: VENTAS_COLUMNS,
    data: this.resultados.rows(),
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

  /** Informe del periodo y la cédula consultados. */
  protected readonly enviarInforme = () => {
    const periodo = this.query.periodo();
    if (!periodo) {
      return throwError(() => new Error('No hay un periodo consultado para enviar.'));
    }
    return this.informes.enviar({
      tipoInforme: TipoInformeDescuento.VentasDetallado,
      fechaInicio: periodo.inicio,
      fechaFin: periodo.fin,
      cedula: this.query.cedula(),
    });
  };

  protected consultar(consulta: ConsultaReporte): void {
    if (!this.query.consultar(consulta)) {
      // Misma consulta: la URL no cambia, se vuelve a pedir la información.
      this.ventas.reload();
    }
  }
}
