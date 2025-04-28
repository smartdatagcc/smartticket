import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddResponseTemplateComponent } from './add-response-template.component';

describe('AddResponseTemplateComponent', () => {
  let component: AddResponseTemplateComponent;
  let fixture: ComponentFixture<AddResponseTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddResponseTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddResponseTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
