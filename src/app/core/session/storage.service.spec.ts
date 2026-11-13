import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

const TOKEN_KEY = 'pf.token';
const USER_NAME_KEY = 'pf.userName';

describe('StorageService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('sin sesión guardada queda vacío', () => {
    const service = TestBed.inject(StorageService);
    expect(service.token()).toBe('');
    expect(service.userName()).toBe('');
  });

  it('lee el token y el usuario que guarda el orquestador', () => {
    localStorage.setItem(TOKEN_KEY, 'persisted-token');
    localStorage.setItem(USER_NAME_KEY, 'persisted-user');

    const service = TestBed.inject(StorageService);

    expect(service.token()).toBe('persisted-token');
    expect(service.userName()).toBe('persisted-user');
  });

  it('si localStorage falla (modo privado / SSR) queda vacío', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const service = TestBed.inject(StorageService);

    expect(service.token()).toBe('');
    expect(service.userName()).toBe('');
    getItem.mockRestore();
  });
});
