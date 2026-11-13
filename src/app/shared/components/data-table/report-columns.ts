import {
  type ColumnDef,
  type RowData,
  columnPinningFeature,
  columnSizingFeature,
  createSortedRowModel,
  flexRenderComponent,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
} from '@tanstack/angular-table';
import {
  formatCurrency,
  formatDateTime,
  formatInteger,
  formatNumber,
  toDate,
} from '../../../core/format/formatters';
import { EmptyValue } from './cells/empty-value';
import { SortHeaderCell } from './cells/sort-header-cell';
import type { DataTableColumnMeta } from './data-table.types';

/**
 * Features de las tablas de reportes. El orden es del cliente (ordena la página recibida) y la
 * paginación es del servidor, por eso no se registra la paginación de TanStack.
 */
export const REPORT_TABLE_FEATURES = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    basic: sortFn_basic,
  },
  columnPinningFeature,
  columnSizingFeature,
  columnMeta: {} as DataTableColumnMeta,
});

export type ReportTableFeatures = typeof REPORT_TABLE_FEATURES;
export type ReportColumnDef<T extends RowData> = ColumnDef<ReportTableFeatures, T, unknown>;

/**
 * Cómo se muestra y ordena un dato: `code` (guías, documentos), `text` (nombres; se recorta con
 * "…"), `money` (COP), `percent` (el backend envía 19.5, no 0.195), `integer` y `date`.
 */
export type ReportColumnKind = 'code' | 'text' | 'money' | 'percent' | 'integer' | 'date';

export interface ReportColumnSpec<T extends RowData> {
  readonly id: string;
  readonly label: string;
  readonly kind: ReportColumnKind;
  /**
   * Ancho en px (la tabla usa anchos fijos para poder fijar columnas): el encabezado con Prospero
   * SemiBold 14, el ícono de orden y el padding de 24 a cada lado.
   */
  readonly size: number;
  readonly value: (row: T) => unknown;
}

const SORT_FN: Readonly<Record<ReportColumnKind, 'alphanumeric' | 'text' | 'basic'>> = {
  code: 'alphanumeric',
  text: 'text',
  money: 'basic',
  percent: 'basic',
  integer: 'basic',
  // Fechas ISO 8601: el orden de texto es el cronológico.
  date: 'basic',
};

/** 19.5 → "19,5%". */
function formatPercentValue(value: number): string {
  return `${formatNumber(value, { maximumFractionDigits: 1 })}%`;
}

/** Texto de la celda; `null` si no hay dato. */
export function formatReportValue(kind: ReportColumnKind, value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  switch (kind) {
    case 'money':
      return typeof value === 'number' ? formatCurrency(value) : null;
    case 'percent':
      return typeof value === 'number' ? formatPercentValue(value) : null;
    case 'integer':
      return typeof value === 'number' ? formatInteger(value) : null;
    case 'date': {
      const date = toDate(value);
      return date ? formatDateTime(date, { dateStyle: 'medium' }) : null;
    }
    default:
      return String(value);
  }
}

/** Columna ordenable de un reporte a partir de su especificación. */
export function reportColumn<T extends RowData>(spec: ReportColumnSpec<T>): ReportColumnDef<T> {
  return {
    id: spec.id,
    // `undefined` (y no `null`) para que las filas sin dato queden al final con `sortUndefined`.
    accessorFn: (row) => spec.value(row) ?? undefined,
    header: () => flexRenderComponent(SortHeaderCell, { inputs: { label: spec.label } }),
    cell: (context) =>
      formatReportValue(spec.kind, context.getValue()) ?? flexRenderComponent(EmptyValue),
    size: spec.size,
    enableSorting: true,
    sortUndefined: 'last',
    sortFn: SORT_FN[spec.kind],
    // Textos libres (nombres, direcciones) se recortan con "…" si no caben en la columna.
    meta: {
      cellClassName:
        spec.kind === 'text' ? 'overflow-hidden text-ellipsis text-foreground' : 'text-foreground',
    },
  };
}
