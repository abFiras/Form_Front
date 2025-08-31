import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListExterneCardComponent } from './list-externe-card.component';

describe('ListExterneCardComponent', () => {
  let component: ListExterneCardComponent;
  let fixture: ComponentFixture<ListExterneCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListExterneCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListExterneCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
