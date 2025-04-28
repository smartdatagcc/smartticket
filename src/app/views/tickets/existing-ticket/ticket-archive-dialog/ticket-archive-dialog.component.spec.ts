import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketArchiveDialogComponent } from './ticket-archive-dialog.component';

describe('TicketArchiveDialogComponent', () => {
  let component: TicketArchiveDialogComponent;
  let fixture: ComponentFixture<TicketArchiveDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TicketArchiveDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TicketArchiveDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
