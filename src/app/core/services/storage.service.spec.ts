import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

const TOKEN_KEY = 'pf.token';
const USER_NAME_KEY = 'pf.userName';

describe('StorageService', () => {
  let service: StorageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('is created with empty default state', () => {
    expect(service).toBeTruthy();
    expect(service.token()).toBe('');
    expect(service.userName()).toBe('');
  });

  describe('localStorage hydration & resilience', () => {
    it('hydrates token and userName from localStorage on construction', () => {
      localStorage.setItem(TOKEN_KEY, 'persisted-token');
      localStorage.setItem(USER_NAME_KEY, 'persisted-user');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      const fresh = TestBed.inject(StorageService);

      expect(fresh.token()).toBe('persisted-token');
      expect(fresh.userName()).toBe('persisted-user');
    });

    it('survives a throwing localStorage (private mode / SSR)', () => {
      const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      const removeItem = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('blocked');
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      const fresh = TestBed.inject(StorageService);

      expect(fresh.token()).toBe('');

      getItem.mockRestore();
      setItem.mockRestore();
      removeItem.mockRestore();
    });
  });
});
