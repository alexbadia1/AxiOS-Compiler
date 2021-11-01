import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LexerOutputComponent } from './lexer-output.component';

describe('LexerOutputComponent', () => {
  let component: LexerOutputComponent;
  let fixture: ComponentFixture<LexerOutputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LexerOutputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LexerOutputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
