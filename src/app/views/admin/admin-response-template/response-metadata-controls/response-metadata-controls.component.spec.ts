import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseMetadataControlsComponent } from './response-metadata-controls.component';

describe('ResponseMetadataControlsComponent', () => {
  let component: ResponseMetadataControlsComponent;
  let fixture: ComponentFixture<ResponseMetadataControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResponseMetadataControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResponseMetadataControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
