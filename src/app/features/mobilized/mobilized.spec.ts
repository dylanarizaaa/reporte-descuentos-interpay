import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mobilized } from './mobilized';

describe('Mobilized', () => {
  let component: Mobilized;
  let fixture: ComponentFixture<Mobilized>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mobilized],
    }).compileComponents();

    fixture = TestBed.createComponent(Mobilized);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
