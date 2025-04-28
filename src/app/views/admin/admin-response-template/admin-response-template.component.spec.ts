import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminResponseTemplateComponent } from './admin-response-template.component';

describe('AdminResponseTemplateComponent', () => {
  let component: AdminResponseTemplateComponent;
  let fixture: ComponentFixture<AdminResponseTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminResponseTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminResponseTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
