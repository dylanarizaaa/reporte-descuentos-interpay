import type { ResultadoPaginado } from '../http/api-response';

/**
 * `EnumTipoDescuento` del swagger. Solo publica los valores (1, 2): POR CONFIRMAR con el backend
 * que 1 son los descuentos personalizados y 2 los automáticos (orden de las pestañas del diseño).
 */
export const TipoDescuento = {
  Personalizado: 1,
  Automatico: 2,
} as const;

export type TipoDescuento = (typeof TipoDescuento)[keyof typeof TipoDescuento];

/** Cliente Inter Pay (`ResponseCliente`). */
export interface ClienteDescuento {
  readonly idPrepagoCliente: number;
  readonly nombreCliente: string | null;
  readonly numeroDocumento: string | null;
}

/**
 * Descuento de un cliente y sus movilizados (`ResponseInformeDescuentoCliente`).
 * `descuentoPagoEnCasa` y `descuentoFlete` son porcentajes (p. ej. 15 = 15 %).
 */
export interface DescuentoCliente {
  readonly cliente: ClienteDescuento | null;
  readonly descuentoPagoEnCasa: number;
  readonly descuentoFlete: number;
  readonly tipoDescuento: string | null;
  readonly rangoDescuento: string | null;
  /** ISO 8601. */
  readonly fechaInicialDescuento: string;
  /** ISO 8601. */
  readonly fechaFinalDescuento: string;
  readonly numeroMovilizados: number;
  readonly movilizadosInterPay: number;
}

export type DescuentosClientePagina = ResultadoPaginado<DescuentoCliente>;

/** Filtros de la consulta de la tabla. */
export interface ConsultaDescuentosCliente {
  readonly tipo: TipoDescuento;
  readonly fechaInicio: Date;
  readonly fechaFin: Date;
  readonly cedula?: string;
  /** Página solicitada (desde 1). */
  readonly pagina: number;
  readonly cantidadRegistros: number;
}
