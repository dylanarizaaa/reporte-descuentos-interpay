import { InjectionToken } from '@angular/core';
import { startOfDay } from './calendar-date';

/**
 * Fecha de hoy (a medianoche). Es una función para que una pantalla abierta varios días use
 * siempre la fecha actual, y un token para poder fijarla en las pruebas.
 */
export const TODAY = new InjectionToken<() => Date>('TODAY', {
  providedIn: 'root',
  factory: () => () => startOfDay(new Date()),
});
