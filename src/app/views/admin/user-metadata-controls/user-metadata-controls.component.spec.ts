import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMetadataControlsComponent } from './user-metadata-controls.component';

describe('UserMetadataControlsComponent', () => {
  let component: UserMetadataControlsComponent;
  let fixture: ComponentFixture<UserMetadataControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserMetadataControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserMetadataControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
