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
