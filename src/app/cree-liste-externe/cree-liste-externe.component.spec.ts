import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreeListeExterneComponent } from './cree-liste-externe.component';

describe('CreeListeExterneComponent', () => {
  let component: CreeListeExterneComponent;
  let fixture: ComponentFixture<CreeListeExterneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreeListeExterneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreeListeExterneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
