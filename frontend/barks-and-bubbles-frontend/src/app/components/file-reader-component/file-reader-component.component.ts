import { DataService } from '../../services/data.service';
import { ExcelParserService } from '../../services/excelParser';
import { Component } from '@angular/core';

@Component({
  selector: 'app-file-reader-component',
  standalone: true,
  imports: [],
  templateUrl: './file-reader-component.component.html',
  styleUrls: ['./file-reader-component.component.scss'],
})
export class FileReaderComponent {
  constructor(
    private excelParserService: ExcelParserService,
    private dataService: DataService
  ) {}

  async onFileChange(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      try {
        const parsedData: any[] = await this.excelParserService.parseExcelFile(
          file
        );
        this.dataService.addClientsToTable(parsedData);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
      }
    }
  }
}
