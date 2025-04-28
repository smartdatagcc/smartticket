import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditStatusModalComponent } from './edit-status-modal.component';

describe('EditStatusModalComponent', () => {
  let component: EditStatusModalComponent;
  let fixture: ComponentFixture<EditStatusModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditStatusModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditStatusModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
