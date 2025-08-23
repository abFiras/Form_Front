import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldPaletteComponent } from './field-palette.component';

describe('FieldPaletteComponent', () => {
  let component: FieldPaletteComponent;
  let fixture: ComponentFixture<FieldPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldPaletteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
