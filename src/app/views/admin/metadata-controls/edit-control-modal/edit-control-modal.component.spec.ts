import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditControlModalComponent } from './edit-control-modal.component';

describe('EditControlModalComponent', () => {
  let component: EditControlModalComponent;
  let fixture: ComponentFixture<EditControlModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditControlModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditControlModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
