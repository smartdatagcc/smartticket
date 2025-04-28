import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestTenantInviteDialogComponent } from './request-tenant-invite-dialog.component';

describe('RequestTenantInviteDialogComponent', () => {
  let component: RequestTenantInviteDialogComponent;
  let fixture: ComponentFixture<RequestTenantInviteDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestTenantInviteDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestTenantInviteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
