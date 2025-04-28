import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceChangeComponent } from './workspace-change.component';

describe('WorkspaceChangeComponent', () => {
  let component: WorkspaceChangeComponent;
  let fixture: ComponentFixture<WorkspaceChangeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkspaceChangeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
