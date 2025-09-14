import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalListDetailComponent } from './external-list-detail.component';

describe('ExternalListDetailComponent', () => {
  let component: ExternalListDetailComponent;
  let fixture: ComponentFixture<ExternalListDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExternalListDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalListDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
