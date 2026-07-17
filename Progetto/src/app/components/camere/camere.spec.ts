import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Camere } from './camere';

describe('Camere', () => {
  let component: Camere;
  let fixture: ComponentFixture<Camere>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Camere],
    }).compileComponents();

    fixture = TestBed.createComponent(Camere);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
