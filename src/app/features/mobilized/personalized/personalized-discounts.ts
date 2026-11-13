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
import { TipoDescuento } from '../../../core/data-access/descuentos-cliente.model';
import { DescuentosClienteService } from '../../../core/data-access/descuentos-cliente.service';
import { TipoInformeDescuento } from '../../../core/data-access/informe-descuento.model';
import { InformeDescuentoService } from '../../../core/data-access/informe-descuento.service';
import type { Periodo } from '../../../core/date/periodo';
import { type ConsultaReporte, injectReportQuery } from '../../../core/routing/report-query';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { REPORT_TABLE_FEATURES } from '../../../shared/components/data-table/report-columns';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../shared/components/error-state/error-state';
import { Paginator } from '../../../shared/components/paginator/paginator';
import { PeriodPicker } from '../../../shared/components/period-picker/period-picker';
import { ReportFilters } from '../../../shared/components/report-filters/report-filters';
import { SendReportDialog } from '../../../shared/components/send-report-dialog/send-report-dialog';
import { createReportResults } from '../../../shared/report/report-results';
import {
  descuentoRowId,
  type Envio,
  lineasSinResultados,
  PAGE_SIZE,
  TEXTOS_ENVIO,
} from '../mobilized.shared';
import { PERSONALIZED_COLUMN_PINNING, personalizedColumns } from './personalized-discounts.columns';

/**
 * Pestaña "Dtos. personalizados": el periodo se elige libremente en el calendario (máximo 30
 * días). La consulta vive en la URL (`?desde=…&hasta=…&cedula=…&pagina=n`).
 */
@Component({
  selector: 'app-personalized-discounts',
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
  host: { class: 'flex flex-col gap-6' },
  templateUrl: './personalized-discounts.html',
})
export class PersonalizedDiscounts {
  private readonly service = inject(DescuentosClienteService);
  private readonly informes = inject(InformeDescuentoService);

  protected readonly textosEnvio = TEXTOS_ENVIO;
  protected readonly query = injectReportQuery();
  /** Periodo elegido en el calendario y aún sin consultar; empieza con el de la URL. */
  protected readonly periodoElegido = linkedSignal<Periodo | null>(() => this.query.periodo());

  protected readonly descuentos = rxResource({
    params: () => {
      const periodo = this.query.periodo();
      return periodo
        ? { periodo, cedula: this.query.cedula(), pagina: this.query.pagina() }
        : undefined;
    },
    stream: ({ params }) =>
      this.service.getDescuentos({
        tipo: TipoDescuento.Personalizado,
        fechaInicio: params.periodo.inicio,
        fechaFin: params.periodo.fin,
        cedula: params.cedula,
        pagina: params.pagina,
        cantidadRegistros: PAGE_SIZE,
      }),
  });

  protected readonly resultados = createReportResults(this.descuentos, {
    ...this.query,
    singular: 'cliente con descuento',
    plural: 'clientes con descuento',
  });

  protected readonly lineasSinResultados = computed(() => lineasSinResultados(this.query.cedula()));

  // --- Tabla ------------------------------------------------------------------------------------

  /** Orden del cliente: se aplica sobre la página recibida. */
  protected readonly sorting = signal<SortingState>([]);
  private readonly columns = personalizedColumns((row) =>
    this.envio.set({ cedula: row.numeroDocumento ?? '' }),
  );

  protected readonly table = injectTable(() => ({
    features: REPORT_TABLE_FEATURES,
    columns: this.columns,
    data: this.resultados.rows(),
    getRowId: descuentoRowId,
    state: {
      sorting: this.sorting(),
      columnPinning: PERSONALIZED_COLUMN_PINNING,
    },
    onSortingChange: (updater: Updater<SortingState>) =>
      this.sorting.update((current) =>
        typeof updater === 'function' ? updater(current) : updater,
      ),
    sortDescFirst: false,
    enableMultiSort: false,
  }));

  // --- Enviar reporte ---------------------------------------------------------------------------

  /** Envío pendiente de confirmar; `null` con el modal cerrado. */
  protected readonly envio = signal<Envio | null>(null);

  /** Informe de descuentos personalizados del periodo consultado y la cédula del envío. */
  protected readonly enviarInforme = () => {
    const periodo = this.query.periodo();
    const envio = this.envio();
    if (!periodo || !envio) {
      return throwError(() => new Error('No hay un periodo consultado para enviar.'));
    }
    return this.informes.enviar({
      tipoInforme: TipoInformeDescuento.DescuentosPersonalizados,
      fechaInicio: periodo.inicio,
      fechaFin: periodo.fin,
      cedula: envio.cedula,
    });
  };

  protected consultar(consulta: ConsultaReporte): void {
    if (!this.query.consultar(consulta)) {
      // Misma consulta: la URL no cambia, se vuelve a pedir la información.
      this.descuentos.reload();
    }
  }
}
