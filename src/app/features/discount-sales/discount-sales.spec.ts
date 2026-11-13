import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountSales } from './discount-sales';

describe('DiscountSales', () => {
  let component: DiscountSales;
  let fixture: ComponentFixture<DiscountSales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscountSales],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscountSales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
