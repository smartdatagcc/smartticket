import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RadiobuttonlistComponent } from './radiobuttonlist.component';

describe('RadiobuttonlistComponent', () => {
  let component: RadiobuttonlistComponent;
  let fixture: ComponentFixture<RadiobuttonlistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RadiobuttonlistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RadiobuttonlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
