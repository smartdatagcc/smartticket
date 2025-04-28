import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCustomReportComponent } from './admin-custom-report.component';

describe('AdminCustomReportComponent', () => {
  let component: AdminCustomReportComponent;
  let fixture: ComponentFixture<AdminCustomReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminCustomReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminCustomReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
