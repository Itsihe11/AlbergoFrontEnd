import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Clienti } from './clienti';

describe('Clienti', () => {
  let component: Clienti;
  let fixture: ComponentFixture<Clienti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Clienti],
    }).compileComponents();

    fixture = TestBed.createComponent(Clienti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
