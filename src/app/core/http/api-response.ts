/** Envoltura estándar de las respuestas de CajaInter (`...RespuestaGeneral` en el swagger). */
export interface RespuestaGeneral<T> {
  readonly error: boolean;
  readonly mensaje: string | null;
  readonly resultado: T;
  readonly statusCode: number;
  readonly descripcion: string | null;
}

/** Página de resultados (`...ResultadoPaginado` en el swagger). */
export interface ResultadoPaginado<T> {
  readonly paginaActual: number;
  readonly totalPaginas: number;
  readonly tamanioPagina: number;
  readonly totalElementos: number;
  readonly listaResultado: readonly T[] | null;
  readonly existePaginaPrevia?: boolean;
  readonly existePaginaSiguiente?: boolean;
  readonly numeroPaginaPrevia?: number | null;
  readonly numeroPaginaSiguiente?: number | null;
}

/** Error de negocio devuelto por el backend con `error: true`. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Devuelve `resultado` o lanza `ApiError` si el backend reporta un fallo. */
export function unwrapRespuesta<T>(response: RespuestaGeneral<T>): T {
  if (response.error) {
    throw new ApiError(
      response.mensaje || response.descripcion || 'La solicitud no pudo completarse.',
      response.statusCode,
    );
  }
  return response.resultado;
}
