import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListexterneComponent } from './listexterne.component';

describe('ListexterneComponent', () => {
  let component: ListexterneComponent;
  let fixture: ComponentFixture<ListexterneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListexterneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListexterneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
