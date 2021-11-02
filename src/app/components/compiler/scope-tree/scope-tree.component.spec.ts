import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScopeTreeComponent } from './scope-tree.component';

describe('ScopeTreeComponent', () => {
  let component: ScopeTreeComponent;
  let fixture: ComponentFixture<ScopeTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScopeTreeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScopeTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
