import { TestBed } from '@angular/core/testing';
import { TODAY } from './today';

describe('TODAY', () => {
  afterEach(() => jest.useRealTimers());

  it('devuelve la fecha actual a medianoche cada vez que se llama', () => {
    jest.useFakeTimers({ now: new Date(2026, 1, 23, 15, 40) });
    const today = TestBed.inject(TODAY);
    expect(today()).toEqual(new Date(2026, 1, 23));

    jest.setSystemTime(new Date(2026, 1, 24, 0, 5));
    expect(today()).toEqual(new Date(2026, 1, 24));
  });
});
