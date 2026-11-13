import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { injectTable, type SortingState, type Updater } from '@tanstack/angular-table';
import { throwError } from 'rxjs';
import {
  type DescuentoCliente,
  TipoDescuento,
} from '../../core/data-access/descuentos-cliente.model';
import { DescuentosClienteService } from '../../core/data-access/descuentos-cliente.service';
import { TipoInformeDescuento } from '../../core/data-access/informe-descuento.model';
import { InformeDescuentoService } from '../../core/data-access/informe-descuento.service';
import { type ConsultaReporte, injectReportQuery } from '../../core/routing/report-query';
import { injectQueryParam } from '../../core/routing/route-params';
import { DataTable } from '../../shared/components/data-table/data-table';
import { REPORT_TABLE_FEATURES } from '../../shared/components/data-table/report-columns';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../shared/components/error-state/error-state';
import { Paginator } from '../../shared/components/paginator/paginator';
import { ReportFilters } from '../../shared/components/report-filters/report-filters';
import {
  SendReportDialog,
  type SendReportTexts,
} from '../../shared/components/send-report-dialog/send-report-dialog';
import { createReportResults } from '../../shared/report/report-results';
import { MOVILIZADOS_COLUMN_PINNING, movilizadosColumns } from './mobilized.columns';

/** Registros por página (`TamanoPagina`), como en el diseño. */
export const PAGE_SIZE = 10;

/** Pestañas del diseño; la activa vive en la URL (`?tipo=automaticos`). */
export const TABS = [
  {
    id: 'personalizados',
    label: 'Dtos. personalizados',
    tipoDescuento: TipoDescuento.Personalizado,
    tipoInforme: TipoInformeDescuento.DescuentosPersonalizados,
  },
  {
    id: 'automaticos',
    label: 'Dtos. automáticos',
    tipoDescuento: TipoDescuento.Automatico,
    tipoInforme: TipoInformeDescuento.DescuentosAutomaticos,
  },
] as const;

type Tab = (typeof TABS)[number];

/** Textos del modal de envío de este reporte. */
const TEXTOS_ENVIO: SendReportTexts = {
  title: '¿Quieres recibir el reporte en tu correo?',
  description: 'En 30 minutos máx. recibirás un enlace de descarga válido por 1 hora.',
  cancelLabel: 'No enviar',
  confirmLabel: 'Sí, enviar',
  successTitle: 'El reporte va en camino',
  successDescription: 'Revisa tu bandeja de entrada o el correo no deseado.',
  successCloseLabel: 'Entendido',
};

/** Qué se envía: todo el reporte ("Enviar reporte") o el de un cliente ("Enviar" de la fila). */
type Envio = { readonly cedula: string } | null;

const rowId = (row: DescuentoCliente, index: number) =>
  `${index}-${row.cliente?.idPrepagoCliente ?? 'sin-cliente'}`;

/**
 * "Reporte de descuentos y movilizados por cliente": una pestaña por tipo de descuento
 * (personalizados / automáticos) con los mismos filtros, tabla y envío por correo.
 *
 * La consulta vive en la URL (`?tipo=…&desde=…&hasta=…&cedula=…&pagina=n`): al cambiar de pestaña
 * se conserva el periodo y la búsqueda y se pide el otro tipo de descuento. La paginación es del
 * servidor y el orden de las columnas, del cliente.
 */
@Component({
  selector: 'app-mobilized',
  imports: [
    DataTable,
    EmptyState,
    ErrorState,
    HlmTabsImports,
    NgTemplateOutlet,
    Paginator,
    ReportFilters,
    SendReportDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './mobilized.html',
})
export class Mobilized {
  private readonly service = inject(DescuentosClienteService);
  private readonly informes = inject(InformeDescuentoService);

  protected readonly tabs = TABS;
  protected readonly textosEnvio = TEXTOS_ENVIO;
  protected readonly query = injectReportQuery();

  private readonly tipoParam = injectQueryParam('tipo');
  protected readonly tab = computed<Tab>(
    () => TABS.find((tab) => tab.id === this.tipoParam()) ?? TABS[0],
  );

  protected readonly descuentos = rxResource({
    params: () => {
      const periodo = this.query.periodo();
      return periodo
        ? {
            tipo: this.tab().tipoDescuento,
            periodo,
            cedula: this.query.cedula(),
            pagina: this.query.pagina(),
          }
        : undefined;
    },
    stream: ({ params }) =>
      this.service.getDescuentos({
        tipo: params.tipo,
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

  protected readonly lineasSinResultados = computed(() =>
    this.query.cedula()
      ? [
          'No hay descuentos para este No. de identificación en el periodo.',
          'Intenta con otro número o periodo.',
        ]
      : ['No hay clientes con descuentos en este período.', 'Intenta con otro periodo.'],
  );

  // --- Tabla ------------------------------------------------------------------------------------

  /** Orden del cliente: se aplica sobre la página recibida. */
  protected readonly sorting = signal<SortingState>([]);
  private readonly columns = movilizadosColumns((row) =>
    this.envio.set({ cedula: row.cliente?.numeroDocumento ?? '' }),
  );

  protected readonly table = injectTable(() => ({
    features: REPORT_TABLE_FEATURES,
    columns: this.columns,
    data: this.resultados.rows(),
    getRowId: rowId,
    state: {
      sorting: this.sorting(),
      columnPinning: MOVILIZADOS_COLUMN_PINNING,
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
  protected readonly envio = signal<Envio>(null);

  /** Informe de la pestaña activa para el periodo consultado y la cédula del envío. */
  protected readonly enviarInforme = () => {
    const periodo = this.query.periodo();
    const envio = this.envio();
    if (!periodo || !envio) {
      return throwError(() => new Error('No hay un periodo consultado para enviar.'));
    }
    return this.informes.enviar({
      tipoInforme: this.tab().tipoInforme,
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

  protected cambiarTab(id: string): void {
    if (id === this.tab().id) {
      return;
    }
    this.sorting.set([]);
    this.query.navigate({ tipo: id === TABS[0].id ? null : id, pagina: null });
  }
}
