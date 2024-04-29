import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class ExcelParserService {
  constructor() {}

  parseExcelFile(file: File): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      const reader: FileReader = new FileReader();

      reader.onload = (e: any) => {
        const binaryString: string = e.target.result;
        const workbook: XLSX.WorkBook = XLSX.read(binaryString, {
          type: 'binary',
        });
        const sheetName: string = workbook.SheetNames[0]; // Assuming only one sheet
        const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
        const excelData: any[] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });

        const headers: string[] = excelData[0]; // Get the header row
        excelData.shift(); // Remove the header row from the data

        const parsedData: any[] = [];
        excelData.forEach((row: any[]) => {
          const rowData: any = {};
          row.forEach((cellValue: any, index: number) => {
            const headerCell: string = headers[index];
            rowData[headerCell] = cellValue;
          });
          parsedData.push(rowData);
        });

        resolve(parsedData);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsBinaryString(file);
    });
  }
}
