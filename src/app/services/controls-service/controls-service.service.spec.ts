import { TestBed } from '@angular/core/testing';

import { ControlsServiceService } from './controls-service.service';

describe('ControlsServiceService', () => {
  let service: ControlsServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ControlsServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
