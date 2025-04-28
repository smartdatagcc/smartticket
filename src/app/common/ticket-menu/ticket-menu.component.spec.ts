import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketMenuComponent } from './ticket-menu.component';

describe('TicketMenuComponent', () => {
  let component: TicketMenuComponent;
  let fixture: ComponentFixture<TicketMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TicketMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TicketMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
