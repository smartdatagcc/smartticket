import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TooltipComponentComponent } from './tooltip-component.component';

describe('TooltipComponentComponent', () => {
  let component: TooltipComponentComponent;
  let fixture: ComponentFixture<TooltipComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TooltipComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TooltipComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
