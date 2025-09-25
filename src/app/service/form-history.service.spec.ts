import { TestBed } from '@angular/core/testing';

import { FormHistoryService } from './form-history.service';

describe('FormHistoryService', () => {
  let service: FormHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
