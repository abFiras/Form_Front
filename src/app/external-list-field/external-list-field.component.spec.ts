import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalListFieldComponent } from './external-list-field.component';

describe('ExternalListFieldComponent', () => {
  let component: ExternalListFieldComponent;
  let fixture: ComponentFixture<ExternalListFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExternalListFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalListFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
