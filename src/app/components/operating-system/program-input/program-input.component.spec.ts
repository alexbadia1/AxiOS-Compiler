import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramInputComponent } from './program-input.component';

describe('ProgramInputComponent', () => {
  let component: ProgramInputComponent;
  let fixture: ComponentFixture<ProgramInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgramInputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
