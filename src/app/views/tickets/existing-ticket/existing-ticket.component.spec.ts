import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExistingTicketComponent } from './existing-ticket.component';

describe('ExistingTicketComponent', () => {
  let component: ExistingTicketComponent;
  let fixture: ComponentFixture<ExistingTicketComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExistingTicketComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExistingTicketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
