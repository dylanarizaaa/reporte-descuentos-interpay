import type { ColumnPinningState } from '@tanstack/angular-table';
import type { DescuentoCliente } from '../../../core/data-access/descuentos-cliente.model';
import {
  reportColumn,
  type ReportColumnDef,
  type ReportColumnSpec,
} from '../../../shared/components/data-table/report-columns';
import { accionesColumn } from '../mobilized.shared';

/**
 * Columnas de descuentos automáticos en el orden del diseño. El descuento sale del volumen del mes
 * anterior, por eso hay dos columnas de movilizados.
 *
 * POR CONFIRMAR con el backend: el swagger no nombra los movilizados del mes anterior; se asume
 * `movilizadosInterPay` para "Movilizados mes anterior" y `numeroMovilizados` (el mismo dato de
 * "Movilizados" en personalizados) para "Movilizados periodo elegido".
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
    id: 'movilizadosMesAnterior',
    label: 'Movilizados mes anterior',
    kind: 'integer',
    size: 240,
    value: (row) => row.movilizadosInterPay,
  },
  {
    id: 'movilizadosPeriodo',
    label: 'Movilizados periodo elegido',
    kind: 'integer',
    size: 260,
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
    id: 'rangoDescuento',
    label: 'Rango de descuento',
    kind: 'text',
    size: 200,
    value: (row) => row.rangoDescuento,
  },
];

/** Columnas de la tabla y, al final, "Acciones" con "Enviar" por cliente. */
export function automaticColumns(
  onSend: (row: DescuentoCliente) => void,
): ReportColumnDef<DescuentoCliente>[] {
  return [...COLUMNS.map(reportColumn), accionesColumn(onSend)];
}

/** "Nombre del cliente" y "Acciones" quedan fijas al desplazar la tabla en horizontal. */
export const AUTOMATIC_COLUMN_PINNING: ColumnPinningState = {
  start: ['nombreCliente'],
  end: ['acciones'],
};

/** Etiquetas visibles de las columnas, en orden (incluye "Acciones"). */
export const AUTOMATIC_COLUMN_LABELS = [...COLUMNS.map((column) => column.label), 'Acciones'];
