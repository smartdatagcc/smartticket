import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFieldMetadataControlsComponent } from './form-field-metadata-controls.component';

describe('FormFieldMetadataControlsComponent', () => {
  let component: FormFieldMetadataControlsComponent;
  let fixture: ComponentFixture<FormFieldMetadataControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormFieldMetadataControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormFieldMetadataControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
