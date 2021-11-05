import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpuOutputComponent } from './cpu-output.component';

describe('CpuOutputComponent', () => {
  let component: CpuOutputComponent;
  let fixture: ComponentFixture<CpuOutputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CpuOutputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CpuOutputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
