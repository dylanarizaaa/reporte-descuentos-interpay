import type { ColumnPinningState } from '@tanstack/angular-table';
import type { VentaDescuento } from '../../core/data-access/ventas-descuento.model';
import {
  reportColumn,
  type ReportColumnDef,
  type ReportColumnSpec,
} from '../../shared/components/data-table/report-columns';

/** Columnas en el orden del diseño y del objeto de respuesta del swagger. */
const COLUMNS: readonly ReportColumnSpec<VentaDescuento>[] = [
  { id: 'guia', label: 'No. de guía', kind: 'code', size: 140, value: (row) => row.guia },
  {
    id: 'valorTransporte',
    label: 'Valor del transporte',
    kind: 'money',
    size: 196,
    value: (row) => row.valorTransporte,
  },
  {
    id: 'valorSobreflete',
    label: 'Valor del sobreflete',
    kind: 'money',
    size: 192,
    value: (row) => row.valorSobreflete,
  },
  {
    id: 'valorOtrosServicios',
    label: 'Valor otros servicios',
    kind: 'money',
    size: 200,
    value: (row) => row.valorOtrosServicios,
  },
  {
    id: 'valorComercial',
    label: 'Valor comercial',
    kind: 'money',
    size: 168,
    value: (row) => row.valorComercial,
  },
  {
    id: 'valorTotal',
    label: 'Valor total',
    kind: 'money',
    size: 132,
    value: (row) => row.valorTotal,
  },
  {
    id: 'descuentoFlete',
    label: '% de descuento flete',
    kind: 'percent',
    size: 204,
    value: (row) => row.descuentoFlete,
  },
  {
    id: 'valorDescuentoFlete',
    label: 'Valor descuento flete',
    kind: 'money',
    size: 208,
    value: (row) => row.valorDescuentoFlete,
  },
  {
    id: 'descuentoPEC',
    label: '% de descuento pago en casa',
    kind: 'percent',
    size: 264,
    value: (row) => row.descuentoPEC,
  },
  {
    id: 'valorDescuentoPEC',
    label: 'Valor descuento pago en casa',
    kind: 'money',
    size: 264,
    value: (row) => row.valorDescuentoPEC,
  },
  {
    id: 'valorFinal',
    label: 'Valor final',
    kind: 'money',
    size: 132,
    value: (row) => row.valorFinal,
  },
  { id: 'factura', label: 'Factura', kind: 'code', size: 148, value: (row) => row.factura },
  {
    id: 'nombreRemitente',
    label: 'Nombre remitente',
    kind: 'text',
    size: 240,
    value: (row) => row.nombreRemitente,
  },
  {
    id: 'cedulaRemitente',
    label: 'No. identificación remitente',
    kind: 'code',
    size: 248,
    value: (row) => row.cedulaRemitente,
  },
  {
    id: 'direccionRemitente',
    label: 'Dirección remitente',
    kind: 'text',
    size: 260,
    value: (row) => row.direccionRemitente,
  },
  {
    id: 'telefonoRemitente',
    label: 'Teléfono remitente',
    kind: 'code',
    size: 192,
    value: (row) => row.telefonoRemitente,
  },
  {
    id: 'nombreDestinatario',
    label: 'Nombre destinatario',
    kind: 'text',
    size: 240,
    value: (row) => row.nombreDestinatario,
  },
  {
    id: 'cedulaDestinatario',
    label: 'No. identificación destinatario',
    kind: 'code',
    size: 264,
    value: (row) => row.cedulaDestinatario,
  },
  {
    id: 'direccionDestinatario',
    label: 'Dirección destinatario',
    kind: 'text',
    size: 260,
    value: (row) => row.direccionDestinatario,
  },
  {
    id: 'telefonoDestinatario',
    label: 'Teléfono destinatario',
    kind: 'code',
    size: 204,
    value: (row) => row.telefonoDestinatario,
  },
  { id: 'fecha', label: 'Fecha', kind: 'date', size: 124, value: (row) => row.fecha },
  {
    id: 'fechaEntrega',
    label: 'Fecha de entrega',
    kind: 'date',
    size: 180,
    value: (row) => row.fechaEntrega,
  },
  {
    id: 'formaPago',
    label: 'Forma de pago',
    kind: 'text',
    size: 164,
    value: (row) => row.formaPago,
  },
  {
    id: 'tipoServicio',
    label: 'Tipo de servicio',
    kind: 'text',
    size: 172,
    value: (row) => row.tipoServicio,
  },
  {
    id: 'idCentroServicioOrigen',
    label: 'Centro de servicio origen',
    kind: 'code',
    size: 232,
    value: (row) => row.idCentroServicioOrigen,
  },
  {
    id: 'regionalOrigen',
    label: 'Regional origen',
    kind: 'text',
    size: 168,
    value: (row) => row.regionalOrigen,
  },
  { id: 'idConvenio', label: 'Convenio', kind: 'code', size: 128, value: (row) => row.idConvenio },
  {
    id: 'contraPago',
    label: 'Contrapago',
    kind: 'text',
    size: 144,
    value: (row) => row.contraPago,
  },
];

export const VENTAS_COLUMNS: ReportColumnDef<VentaDescuento>[] = COLUMNS.map(reportColumn);

/** "No. de guía" queda fija al desplazar la tabla en horizontal. */
export const VENTAS_COLUMN_PINNING: ColumnPinningState = { start: ['guia'], end: [] };

/** Etiquetas visibles de las columnas, en orden (útil para pruebas y exportaciones). */
export const VENTAS_COLUMN_LABELS = COLUMNS.map((column) => column.label);
