import { DataService } from './../data.service';
import { Component, Inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { RouteEditorComponent } from '../../components/route-editor/route-editor.component';
import { ServiceAreaEditorComponent } from '../../components/service-area-editor/service-area-editor.component';

@Component({
  standalone: true,
  templateUrl: './panel-service.html',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatExpansionModule,
    CommonModule,
    NgFor,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    RouteEditorComponent,
    ServiceAreaEditorComponent,
  ],
  styleUrl: './panel-service.scss',
})
export class PanelService {
  //confirmation panel
  title: string;
  confirmMsg: string;
  subMsg: string;
  btnTitle: string;
  allDayAlert: boolean = false;
  dataVal: any;
  headerType: string | undefined;

  //message editor
  panelType: String = '';
  format = '${}';
  example = '${this.value}';

  //route editor
  routes: any[] | undefined;
  serviceAreas: any[];

  step = signal(0);

  constructor(
    public dialogRef: MatDialogRef<PanelService>,
    private readonly DataService: DataService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      data: any;
      title: string;
      confirmMsg: string;
      subMsg: string;
      btnTitle: string;
      panelType: string;
      routes: [];
      serviceAreas: [];
      headerType: string;
    }
  ) {
    this.title = data.title;
    this.confirmMsg = data.confirmMsg;
    this.subMsg = data.subMsg;
    this.btnTitle = data.btnTitle;
    this.dataVal = data.data;
    this.panelType = data.panelType;
    this.routes = data.routes;
    this.serviceAreas = data.serviceAreas;
    this.headerType = data.headerType ? data.headerType : 'primary';
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  formatMessage(message: string): string {
    if (!message) {
      return message;
    }

    // Replace \n with actual new line
    message = message.replace(/\\n/g, '\n');

    // Replace unicode characters
    message = message.replace(/\\u\{([0-9A-Fa-f]+)\}/g, (match, grp) => {
      return String.fromCodePoint(parseInt(grp, 16));
    });

    return message;
  }

  setStep(index: number) {
    this.step.set(index);
  }

  nextStep() {
    this.step.update((i) => i + 1);
  }

  prevStep() {
    this.step.update((i) => i - 1);
  }

  updateMessageObj(event: FocusEvent, index: number): void {
    const inputElement = event.target as HTMLTextAreaElement;
    console.log(inputElement);
    this.dataVal[index].message = inputElement.value;
  }

  updateMessage(id: string) {
    const message = this.dataVal.find(
      (d: { _id: string }) => d._id == id
    ).message;
    this.DataService.updateMessage(id, message);
  }
}
