import { TestBed } from '@angular/core/testing';

import { SupportTicketServiceService } from './support-ticket-service.service';

describe('SupportTicketServiceService', () => {
  let service: SupportTicketServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupportTicketServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
