import { ApiError, type RespuestaGeneral, unwrapRespuesta } from './api-response';

function respuesta<T>(overrides: Partial<RespuestaGeneral<T>>): RespuestaGeneral<T> {
  return {
    error: false,
    mensaje: null,
    resultado: undefined as T,
    statusCode: 200,
    descripcion: null,
    ...overrides,
  };
}

describe('unwrapRespuesta', () => {
  it('devuelve el resultado cuando no hay error', () => {
    expect(unwrapRespuesta(respuesta({ resultado: 42 }))).toBe(42);
  });

  it('lanza ApiError con el mensaje del backend', () => {
    const fallo = respuesta<null>({ error: true, mensaje: 'Rango inválido', statusCode: 400 });
    expect(() => unwrapRespuesta(fallo)).toThrow(new ApiError('Rango inválido', 400));
  });

  it('usa la descripción o un texto genérico si no hay mensaje', () => {
    expect(() =>
      unwrapRespuesta(respuesta<null>({ error: true, descripcion: 'Sin datos' })),
    ).toThrow('Sin datos');
    expect(() => unwrapRespuesta(respuesta<null>({ error: true }))).toThrow(
      'La solicitud no pudo completarse.',
    );
  });
});
