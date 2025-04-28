import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormMetadataControlsComponent } from './form-metadata-controls.component';

describe('FormMetadataControlsComponent', () => {
  let component: FormMetadataControlsComponent;
  let fixture: ComponentFixture<FormMetadataControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormMetadataControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormMetadataControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
