import { TestBed } from '@angular/core/testing';

import { LookupServiceService } from './lookup-service.service';

describe('LookupServiceService', () => {
  let service: LookupServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LookupServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
