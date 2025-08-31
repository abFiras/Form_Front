import { TestBed } from '@angular/core/testing';

import { ExternalListService } from './external-list.service';

describe('ExternalListService', () => {
  let service: ExternalListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExternalListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
