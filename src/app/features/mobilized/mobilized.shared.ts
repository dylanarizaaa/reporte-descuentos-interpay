import { flexRenderComponent } from '@tanstack/angular-table';
import type { DescuentoCliente } from '../../core/data-access/descuentos-cliente.model';
import { SendCell } from '../../shared/components/data-table/cells/send-cell';
import type { ReportColumnDef } from '../../shared/components/data-table/report-columns';
import type { SendReportTexts } from '../../shared/components/send-report-dialog/send-report-dialog';

/*
 * Piezas comunes de las pestañas de "Reporte de descuentos y movilizados por cliente". Cada
 * pestaña es una pantalla independiente (filtros, consulta y columnas propias); aquí solo hay
 * constantes y fábricas sin estado.
 */

/** Registros por página (`TamanoPagina`), como en el diseño. */
export const PAGE_SIZE = 10;

/** Textos del modal de envío de este reporte. */
export const TEXTOS_ENVIO: SendReportTexts = {
  title: '¿Quieres recibir el reporte en tu correo?',
  description: 'En 30 minutos máx. recibirás un enlace de descarga válido por 1 hora.',
  cancelLabel: 'No enviar',
  confirmLabel: 'Sí, enviar',
  successTitle: 'El reporte va en camino',
  successDescription: 'Revisa tu bandeja de entrada o el correo no deseado.',
  successCloseLabel: 'Entendido',
};

/** Qué se envía: todo el reporte ("Enviar reporte") o el de un cliente ("Enviar" de la fila). */
export interface Envio {
  /** No. de identificación; vacío para todos los clientes de la consulta. */
  readonly cedula: string;
}

export const descuentoRowId = (row: DescuentoCliente, index: number) =>
  `${index}-${row.idPrepagoCliente}`;

/** Columna "Acciones" con "Enviar" por cliente; `onSend` recibe la fila. */
export function accionesColumn(
  onSend: (row: DescuentoCliente) => void,
): ReportColumnDef<DescuentoCliente> {
  return {
    id: 'acciones',
    header: 'Acciones',
    size: 136,
    enableSorting: false,
    cell: (context) =>
      flexRenderComponent(SendCell, {
        inputs: {
          ariaLabel: `Enviar reporte de ${context.row.original.nombreCliente ?? 'este cliente'}`,
          send: () => onSend(context.row.original),
          disabled: !context.row.original.movilizadosInterPay,
        },
      }),
  };
}

/** Mensaje de "No se encontraron registros" según haya o no búsqueda por cédula. */
export function lineasSinResultados(cedula: string): string[] {
  return cedula
    ? [
        'No hay descuentos para este No. de identificación en el periodo.',
        'Intenta con otro número o periodo.',
      ]
    : ['No hay clientes con descuentos en este período.', 'Intenta con otro periodo.'];
}
