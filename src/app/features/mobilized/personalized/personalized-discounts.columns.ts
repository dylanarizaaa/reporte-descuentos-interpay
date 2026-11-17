import type { ColumnPinningState } from '@tanstack/angular-table';
import type { DescuentoCliente } from '../../../core/data-access/descuentos-cliente.model';
import {
  reportColumn,
  type ReportColumnDef,
  type ReportColumnSpec,
} from '../../../shared/components/data-table/report-columns';
import { accionesColumn } from '../mobilized.shared';

/**
 * Columnas de descuentos personalizados en el orden del diseño; las que no se ven en él siguen el
 * objeto del swagger.
 */
const COLUMNS: readonly ReportColumnSpec<DescuentoCliente>[] = [
  {
    id: 'nombreCliente',
    label: 'Nombre del cliente',
    kind: 'text',
    size: 200,
    value: (row) => row.nombreCliente,
  },
  {
    id: 'numeroDocumento',
    label: 'No. de identificación',
    kind: 'code',
    size: 204,
    value: (row) => row.numeroDocumento,
  },
  {
    id: 'fechaInicialDescuento',
    label: 'Fecha inicial dto.',
    kind: 'date',
    size: 184,
    value: (row) => row.fechaInicialDescuento,
  },
  {
    id: 'fechaFinalDescuento',
    label: 'Fecha final dto.',
    kind: 'date',
    size: 172,
    value: (row) => row.fechaFinalDescuento,
  },
  {
    id: 'numeroMovilizados',
    label: 'Movilizados',
    kind: 'integer',
    size: 148,
    value: (row) => row.numeroMovilizados,
  },
  {
    id: 'descuentoPagoEnCasa',
    label: 'Dto. Pago en Casa',
    kind: 'percent',
    size: 188,
    value: (row) => row.descuentoPagoEnCasa,
  },
  {
    id: 'descuentoFlete',
    label: 'Dto. flete',
    kind: 'percent',
    size: 128,
    value: (row) => row.descuentoFlete,
  },
  {
    id: 'tipoDescuento',
    label: 'Tipo de descuento',
    kind: 'text',
    size: 188,
    value: (row) => row.tipoDescuento,
  },
  {
    id: 'movilizadosInterPay',
    label: 'Movilizados Inter Pay',
    kind: 'integer',
    size: 212,
    value: (row) => row.movilizadosInterPay,
  },
];

/** Columnas de la tabla y, al final, "Acciones" con "Enviar" por cliente. */
export function personalizedColumns(
  onSend: (row: DescuentoCliente) => void,
): ReportColumnDef<DescuentoCliente>[] {
  return [...COLUMNS.map(reportColumn), accionesColumn(onSend)];
}

/** "Nombre del cliente" y "Acciones" quedan fijas al desplazar la tabla en horizontal. */
export const PERSONALIZED_COLUMN_PINNING: ColumnPinningState = {
  start: ['nombreCliente'],
  end: ['acciones'],
};

/** Etiquetas visibles de las columnas, en orden (incluye "Acciones"). */
export const PERSONALIZED_COLUMN_LABELS = [...COLUMNS.map((column) => column.label), 'Acciones'];
