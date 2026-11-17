import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { API_BASE_URL } from './api-base-url';

describe('API_BASE_URL', () => {
  it('por defecto usa apiUrl del environment', () => {
    expect(TestBed.inject(API_BASE_URL)).toBe(environment.apiUrl);
  });
});
