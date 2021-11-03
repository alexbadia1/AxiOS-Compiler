import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostLogComponent } from './host-log.component';

describe('HostLogComponent', () => {
  let component: HostLogComponent;
  let fixture: ComponentFixture<HostLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HostLogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HostLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
