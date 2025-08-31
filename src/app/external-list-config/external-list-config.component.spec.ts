import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalListConfigComponent } from './external-list-config.component';

describe('ExternalListConfigComponent', () => {
  let component: ExternalListConfigComponent;
  let fixture: ComponentFixture<ExternalListConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExternalListConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalListConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
