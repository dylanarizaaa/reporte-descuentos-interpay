import type { ResultadoPaginado } from '../http/api-response';

/**
 * Venta con descuento (`ResponseInformeDetalladoVentasDescuento` del swagger de CajaInter).
 * Los valores son pesos colombianos; `descuentoFlete` y `descuentoPEC` son porcentajes.
 */
export interface VentaDescuento {
  readonly guia: string | null;
  readonly valorTransporte: number;
  readonly valorSobreflete: number;
  readonly valorOtrosServicios: number;
  readonly valorComercial: number;
  readonly valorTotal: number;
  /** % de descuento sobre el flete (p. ej. 19.5 = 19,5 %). */
  readonly descuentoFlete: number;
  readonly valorDescuentoFlete: number;
  /** % de descuento de pago en casa (PEC). */
  readonly descuentoPEC: number;
  readonly valorDescuentoPEC: number;
  readonly valorFinal: number;
  readonly factura: string | null;
  readonly nombreRemitente: string | null;
  readonly cedulaRemitente: string | null;
  readonly direccionRemitente: string | null;
  readonly telefonoRemitente: string | null;
  readonly nombreDestinatario: string | null;
  readonly cedulaDestinatario: string | null;
  readonly direccionDestinatario: string | null;
  readonly telefonoDestinatario: string | null;
  /** ISO 8601. */
  readonly fecha: string | null;
  /** ISO 8601. */
  readonly fechaEntrega: string | null;
  readonly formaPago: string | null;
  readonly tipoServicio: string | null;
  readonly idCentroServicioOrigen: number | null;
  readonly regionalOrigen: string | null;
  readonly idConvenio: number | null;
  readonly contraPago: string | null;
}

export type VentasDescuentoPagina = ResultadoPaginado<VentaDescuento>;

/** Filtros de la consulta de la tabla. */
export interface ConsultaVentasDescuento {
  readonly fechaInicio: Date;
  readonly fechaFin: Date;
  /** No. de identificación del cliente; vacío para no filtrar. */
  readonly cedula?: string;
  /** Página solicitada (desde 1). */
  readonly pagina: number;
  readonly cantidadRegistros: number;
}

/**
 * `EnumTipoInformeDescuento` del swagger. El swagger solo publica los valores (1, 2, 3), no sus
 * nombres. POR CONFIRMAR con el backend: se asume que 2 es el informe detallado de ventas con
 * descuento (el de esta tabla).
 */
export const TipoInformeDescuento = {
  VentasDetallado: 2,
} as const;

export type TipoInformeDescuento = (typeof TipoInformeDescuento)[keyof typeof TipoInformeDescuento];

/** Datos para generar el archivo y enviarlo por correo ("Enviar reporte"). */
export interface SolicitudInformeDescuento {
  readonly fechaInicio: Date;
  readonly fechaFin: Date;
  readonly cedula?: string;
}

/** Resultado de `ObtenerInformeDescuento`. */
export interface InformeDescuentoGenerado {
  readonly urlDescarga: string | null;
  readonly nombreArchivo: string | null;
  /** ISO 8601 en UTC. */
  readonly fechaExpiracionUtc: string;
  readonly correoDestinatario: string | null;
  readonly correoEnviado: boolean;
}
