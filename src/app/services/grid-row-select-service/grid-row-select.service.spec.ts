import { TestBed } from '@angular/core/testing';

import { GridRowSelectService } from './grid-row-select.service';

describe('GridRowSelectService', () => {
  let service: GridRowSelectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GridRowSelectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
