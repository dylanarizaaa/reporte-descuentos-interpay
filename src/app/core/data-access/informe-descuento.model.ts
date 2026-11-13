/**
 * `EnumTipoInformeDescuento` del swagger. El swagger solo publica los valores (1, 2, 3), no sus
 * nombres. POR CONFIRMAR con el backend: se asume que 1 y 2 siguen a `EnumTipoDescuento`
 * (personalizados / automáticos) y que 3 es el detalle de ventas con descuento.
 */
export const TipoInformeDescuento = {
  DescuentosPersonalizados: 1,
  DescuentosAutomaticos: 2,
  VentasDetallado: 3,
} as const;

export type TipoInformeDescuento = (typeof TipoInformeDescuento)[keyof typeof TipoInformeDescuento];

/** Datos para generar un informe y enviarlo por correo ("Enviar reporte"). */
export interface SolicitudInformeDescuento {
  readonly tipoInforme: TipoInformeDescuento;
  readonly fechaInicio: Date;
  readonly fechaFin: Date;
  /** No. de identificación del cliente; vacío para todos. */
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
