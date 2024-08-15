import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulerEditorComponent } from './scheduler-editor.component';

describe('SchedulerEditorComponent', () => {
  let component: SchedulerEditorComponent;
  let fixture: ComponentFixture<SchedulerEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulerEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulerEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
