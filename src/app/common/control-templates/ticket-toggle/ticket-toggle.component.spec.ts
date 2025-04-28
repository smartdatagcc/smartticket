import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketToggleComponent } from './ticket-toggle.component';

describe('TicketToggleComponent', () => {
  let component: TicketToggleComponent;
  let fixture: ComponentFixture<TicketToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TicketToggleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TicketToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
