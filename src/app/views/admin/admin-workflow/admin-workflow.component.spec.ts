import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWorkflowComponent } from './admin-workflow.component';

describe('AdminWorkflowComponent', () => {
  let component: AdminWorkflowComponent;
  let fixture: ComponentFixture<AdminWorkflowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminWorkflowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
