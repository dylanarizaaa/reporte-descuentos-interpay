import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

setupZonelessTestEnv();

/**
 * jsdom no implementa ResizeObserver; el select de spartan lo usa para medir el ancho del
 * disparador. Las pruebas que necesitan medidas lo reemplazan por su propia versión.
 */
class NoopResizeObserver {
  observe(): void {
    // jsdom no tiene layout: no hay nada que observar.
  }
  unobserve(): void {
    // nada que liberar
  }
  disconnect(): void {
    // nada que liberar
  }
}
globalThis.ResizeObserver ??= NoopResizeObserver as unknown as typeof ResizeObserver;

/** jsdom tampoco implementa scrollIntoView (el select lo usa para mostrar la opción activa). */
Element.prototype.scrollIntoView ??= function scrollIntoView(): void {
  // sin layout no hay nada que desplazar
};
