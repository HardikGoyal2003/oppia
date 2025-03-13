import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckpointBarComponent } from './checkpoint-bar.component';

describe('CheckpointBarComponent', () => {
  let component: CheckpointBarComponent;
  let fixture: ComponentFixture<CheckpointBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CheckpointBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckpointBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
