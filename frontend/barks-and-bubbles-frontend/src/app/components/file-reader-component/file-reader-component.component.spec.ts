import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileReaderComponentComponent } from './file-reader-component.component';

describe('FileReaderComponentComponent', () => {
  let component: FileReaderComponentComponent;
  let fixture: ComponentFixture<FileReaderComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileReaderComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FileReaderComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
