import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportTicketsComponent } from './import-tickets.component';

describe('ImportTicketsComponent', () => {
  let component: ImportTicketsComponent;
  let fixture: ComponentFixture<ImportTicketsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportTicketsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
