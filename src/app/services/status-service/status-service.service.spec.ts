import { TestBed } from '@angular/core/testing';

import { StatusServiceService } from './status-service.service';

describe('StatusServiceService', () => {
  let service: StatusServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatusServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
