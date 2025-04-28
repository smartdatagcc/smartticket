import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentsNotesViewComponent } from './comments-notes-view.component';

describe('CommentsNotesViewComponent', () => {
  let component: CommentsNotesViewComponent;
  let fixture: ComponentFixture<CommentsNotesViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CommentsNotesViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentsNotesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
