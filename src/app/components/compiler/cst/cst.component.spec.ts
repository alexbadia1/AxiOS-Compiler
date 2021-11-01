import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CstComponent } from './cst.component';

describe('CstComponent', () => {
  let component: CstComponent;
  let fixture: ComponentFixture<CstComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CstComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CstComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
