import { Injectable, signal } from '@angular/core';

/**
 * Datos de la sesión que el orquestador guarda en `localStorage` (mismo origen que el micro
 * front): el token (`pf.token`) y el nombre de usuario (`pf.userName`). Se leen al crear el
 * servicio; si el almacenamiento no está disponible (modo privado, SSR) quedan vacíos.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private static readonly TOKEN_KEY = 'pf.token';
  private static readonly USER_NAME_KEY = 'pf.userName';

  private readonly _token = signal<string>(this.readStored(StorageService.TOKEN_KEY));
  private readonly _userName = signal<string>(this.readStored(StorageService.USER_NAME_KEY));

  /** Token persistido de la sesión actual (cadena vacía si no hay sesión). */
  readonly token = this._token.asReadonly();
  /** Nombre de usuario persistido de la sesión actual. */
  readonly userName = this._userName.asReadonly();

  private readStored(key: string): string {
    try {
      return localStorage.getItem(key) ?? '';
    } catch {
      return '';
    }
  }
}
