import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormslistComponent } from './formslist.component';

describe('FormslistComponent', () => {
  let component: FormslistComponent;
  let fixture: ComponentFixture<FormslistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormslistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormslistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
