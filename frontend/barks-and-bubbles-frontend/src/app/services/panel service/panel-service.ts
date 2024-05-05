import { Component, Inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  standalone: true,
  templateUrl: './panel-service.html',
  imports: [MatDialogModule, MatButtonModule],
})
export class PanelService {
  title: string;
  confirmMsg: string;
  subMsg: string;
  btnTitle: string;
  allDayAlert: boolean = false;
  dataVal: any;
  constructor(
    public dialogRef: MatDialogRef<PanelService>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      confirmMsg: string;
      subMsg: string;
      btnTitle: string;
      data: any;
    }
  ) {
    this.title = data.title;
    this.confirmMsg = data.confirmMsg;
    this.subMsg = data.subMsg;
    this.btnTitle = data.btnTitle;
    this.dataVal = data.data;
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
