import { TestBed } from '@angular/core/testing';

import { SuServiceService } from './su-service.service';

describe('SuServiceService', () => {
  let service: SuServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
