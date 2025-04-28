import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCustomReportComponent } from './edit-custom-report.component';

describe('EditCustomReportComponent', () => {
  let component: EditCustomReportComponent;
  let fixture: ComponentFixture<EditCustomReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditCustomReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCustomReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
