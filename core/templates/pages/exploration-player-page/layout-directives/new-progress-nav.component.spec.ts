import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewProgressNavComponent } from './new-progress-nav/new-progress-nav.component';

describe('NewProgressNavComponent', () => {
  let component: NewProgressNavComponent;
  let fixture: ComponentFixture<NewProgressNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewProgressNavComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewProgressNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
