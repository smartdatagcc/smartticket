import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataControlsComponent } from './metadata-controls.component';

describe('MetadataControlsComponent', () => {
  let component: MetadataControlsComponent;
  let fixture: ComponentFixture<MetadataControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetadataControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetadataControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
