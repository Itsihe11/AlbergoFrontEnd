import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Utenti } from './utenti';

describe('Utenti', () => {
  let component: Utenti;
  let fixture: ComponentFixture<Utenti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Utenti],
    }).compileComponents();

    fixture = TestBed.createComponent(Utenti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
