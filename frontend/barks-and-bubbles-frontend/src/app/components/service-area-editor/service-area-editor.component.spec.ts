import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceAreaEditorComponent } from './service-area-editor.component';

describe('ServiceAreaEditorComponent', () => {
  let component: ServiceAreaEditorComponent;
  let fixture: ComponentFixture<ServiceAreaEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceAreaEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ServiceAreaEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
