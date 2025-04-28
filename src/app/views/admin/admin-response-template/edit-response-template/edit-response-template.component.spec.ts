import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditResponseTemplateComponent } from './edit-response-template.component';

describe('EditResponseTemplateComponent', () => {
  let component: EditResponseTemplateComponent;
  let fixture: ComponentFixture<EditResponseTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditResponseTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditResponseTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
