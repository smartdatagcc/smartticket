import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuHeaderComponent } from './su-header.component';

describe('SuHeaderComponent', () => {
  let component: SuHeaderComponent;
  let fixture: ComponentFixture<SuHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
