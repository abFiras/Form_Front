import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryFormDetailComponent } from './library-form-detail.component';

describe('LibraryFormDetailComponent', () => {
  let component: LibraryFormDetailComponent;
  let fixture: ComponentFixture<LibraryFormDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LibraryFormDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibraryFormDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
