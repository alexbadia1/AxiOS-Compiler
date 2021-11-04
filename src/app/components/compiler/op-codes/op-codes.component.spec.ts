import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpCodesComponent } from './op-codes.component';

describe('OpCodesComponent', () => {
  let component: OpCodesComponent;
  let fixture: ComponentFixture<OpCodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpCodesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
