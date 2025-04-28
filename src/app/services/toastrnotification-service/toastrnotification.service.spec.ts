import { TestBed } from '@angular/core/testing';

import { ToastrnotificationService } from './toastrnotification.service';

describe('ToastrnotificationService', () => {
  let service: ToastrnotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastrnotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
