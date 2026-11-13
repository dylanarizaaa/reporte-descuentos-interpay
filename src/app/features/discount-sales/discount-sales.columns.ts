import {
  type ColumnDef,
  columnPinningFeature,
  type ColumnPinningState,
  columnSizingFeature,
  createSortedRowModel,
  flexRenderComponent,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
} from '@tanstack/angular-table';
import type { VentaDescuento } from '../../core/data-access/ventas-descuento.model';
import { formatCurrency, formatDateTime, formatNumber, toDate } from '../../core/format/formatters';
import { EmptyValue } from '../../shared/components/data-table/cells/empty-value';
import { SortHeaderCell } from '../../shared/components/data-table/cells/sort-header-cell';
import type { DataTableColumnMeta } from '../../shared/components/data-table/data-table.types';

/**
 * Features de la tabla. El orden es del cliente (ordena la página recibida) y la paginación es
 * del servidor, por eso no se registra la paginación de TanStack.
 */
export const VENTAS_TABLE_FEATURES = tableFeatures({
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

type VentasTableFeatures = typeof VENTAS_TABLE_FEATURES;
export type VentaColumnDef = ColumnDef<VentasTableFeatures, VentaDescuento, unknown>;

/** Cómo se muestra y ordena cada dato. */
type ColumnKind = 'code' | 'text' | 'money' | 'percent' | 'date';

interface ColumnSpec {
  readonly key: keyof VentaDescuento;
  readonly label: string;
  readonly kind: ColumnKind;
  /** Ancho en px (la tabla usa anchos fijos para poder fijar "No. de guía"). */
  readonly size: number;
}

/** Columnas en el orden del diseño y del objeto de respuesta del swagger. */
const COLUMNS: readonly ColumnSpec[] = [
  { key: 'guia', label: 'No. de guía', kind: 'code', size: 140 },
  { key: 'valorTransporte', label: 'Valor del transporte', kind: 'money', size: 188 },
  { key: 'valorSobreflete', label: 'Valor del sobreflete', kind: 'money', size: 188 },
  { key: 'valorOtrosServicios', label: 'Valor otros servicios', kind: 'money', size: 196 },
  { key: 'valorComercial', label: 'Valor comercial', kind: 'money', size: 164 },
  { key: 'valorTotal', label: 'Valor total', kind: 'money', size: 144 },
  { key: 'descuentoFlete', label: '% de descuento flete', kind: 'percent', size: 188 },
  { key: 'valorDescuentoFlete', label: 'Valor descuento flete', kind: 'money', size: 196 },
  { key: 'descuentoPEC', label: '% de descuento pago en casa', kind: 'percent', size: 240 },
  { key: 'valorDescuentoPEC', label: 'Valor descuento pago en casa', kind: 'money', size: 244 },
  { key: 'valorFinal', label: 'Valor final', kind: 'money', size: 144 },
  { key: 'factura', label: 'Factura', kind: 'code', size: 140 },
  { key: 'nombreRemitente', label: 'Nombre remitente', kind: 'text', size: 220 },
  { key: 'cedulaRemitente', label: 'No. identificación remitente', kind: 'code', size: 240 },
  { key: 'direccionRemitente', label: 'Dirección remitente', kind: 'text', size: 240 },
  { key: 'telefonoRemitente', label: 'Teléfono remitente', kind: 'code', size: 180 },
  { key: 'nombreDestinatario', label: 'Nombre destinatario', kind: 'text', size: 220 },
  { key: 'cedulaDestinatario', label: 'No. identificación destinatario', kind: 'code', size: 256 },
  { key: 'direccionDestinatario', label: 'Dirección destinatario', kind: 'text', size: 240 },
  { key: 'telefonoDestinatario', label: 'Teléfono destinatario', kind: 'code', size: 196 },
  { key: 'fecha', label: 'Fecha', kind: 'date', size: 132 },
  { key: 'fechaEntrega', label: 'Fecha de entrega', kind: 'date', size: 172 },
  { key: 'formaPago', label: 'Forma de pago', kind: 'text', size: 160 },
  { key: 'tipoServicio', label: 'Tipo de servicio', kind: 'text', size: 172 },
  { key: 'idCentroServicioOrigen', label: 'Centro de servicio origen', kind: 'code', size: 224 },
  { key: 'regionalOrigen', label: 'Regional origen', kind: 'text', size: 168 },
  { key: 'idConvenio', label: 'Convenio', kind: 'code', size: 128 },
  { key: 'contraPago', label: 'Contrapago', kind: 'text', size: 140 },
];

const SORT_FN: Readonly<Record<ColumnKind, 'alphanumeric' | 'text' | 'basic'>> = {
  code: 'alphanumeric',
  text: 'text',
  money: 'basic',
  percent: 'basic',
  // Fechas ISO 8601: el orden de texto es el cronológico.
  date: 'basic',
};

/** 19.5 → "19,5%" (el backend envía el porcentaje, no la fracción). */
function formatPercentValue(value: number): string {
  return `${formatNumber(value, { maximumFractionDigits: 1 })}%`;
}

function formatValue(kind: ColumnKind, value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  switch (kind) {
    case 'money':
      return typeof value === 'number' ? formatCurrency(value) : null;
    case 'percent':
      return typeof value === 'number' ? formatPercentValue(value) : null;
    case 'date': {
      const date = toDate(value);
      return date ? formatDateTime(date, { dateStyle: 'medium' }) : null;
    }
    default:
      return String(value);
  }
}

function buildColumn(spec: ColumnSpec): VentaColumnDef {
  return {
    id: spec.key,
    // `undefined` (y no `null`) para que las filas sin dato queden al final con `sortUndefined`.
    accessorFn: (row) => row[spec.key] ?? undefined,
    header: () => flexRenderComponent(SortHeaderCell, { inputs: { label: spec.label } }),
    cell: (context) =>
      formatValue(spec.kind, context.getValue()) ?? flexRenderComponent(EmptyValue),
    size: spec.size,
    enableSorting: true,
    sortUndefined: 'last',
    sortFn: SORT_FN[spec.kind],
    meta: { cellClassName: 'text-foreground' },
  };
}

export const VENTAS_COLUMNS: VentaColumnDef[] = COLUMNS.map(buildColumn);

/** "No. de guía" queda fija al desplazar la tabla en horizontal. */
export const VENTAS_COLUMN_PINNING: ColumnPinningState = { start: ['guia'], end: [] };

/** Etiquetas visibles de las columnas, en orden (útil para pruebas y exportaciones). */
export const VENTAS_COLUMN_LABELS = COLUMNS.map((column) => column.label);
