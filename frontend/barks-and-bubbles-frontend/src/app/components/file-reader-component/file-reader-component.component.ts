import { Component } from '@angular/core';
import { ExcelParserService } from '../../services/excelParser';

@Component({
  selector: 'app-file-reader-component',
  standalone: true,
  imports: [],
  templateUrl: './file-reader-component.component.html',
  styleUrl: './file-reader-component.component.scss',
})
export class FileReaderComponent {
  constructor(private excelParserService: ExcelParserService) {}

  async onFileChange(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      try {
        const parsedData: any[] = await this.excelParserService.parseExcelFile(
          file
        );
        console.log(parsedData);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
      }
    }
  }
}
