import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFormFieldControlModalComponent } from './add-form-field-control-modal.component';

describe('AddFormFieldControlModalComponent', () => {
  let component: AddFormFieldControlModalComponent;
  let fixture: ComponentFixture<AddFormFieldControlModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddFormFieldControlModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFormFieldControlModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
