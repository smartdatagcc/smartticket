import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserControlModalComponent } from './add-user-control-modal.component';

describe('AddControlModalComponent', () => {
  let component: AddUserControlModalComponent;
  let fixture: ComponentFixture<AddUserControlModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddUserControlModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddUserControlModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
