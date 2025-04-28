import { TestBed } from '@angular/core/testing';

import { ResponseTemplateServiceService } from './response-template-service.service';

describe('ResponseTemplateServiceService', () => {
  let service: ResponseTemplateServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResponseTemplateServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
