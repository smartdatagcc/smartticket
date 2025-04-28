import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteStatusModalComponent } from './delete-status-modal.component';

describe('DeleteStatusModalComponent', () => {
  let component: DeleteStatusModalComponent;
  let fixture: ComponentFixture<DeleteStatusModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteStatusModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteStatusModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
