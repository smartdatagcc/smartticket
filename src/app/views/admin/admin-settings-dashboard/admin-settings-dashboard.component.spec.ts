import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSettingsDashboardComponent } from './admin-settings-dashboard.component';

describe('AdminSettingsDashboardComponent', () => {
  let component: AdminSettingsDashboardComponent;
  let fixture: ComponentFixture<AdminSettingsDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminSettingsDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminSettingsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
