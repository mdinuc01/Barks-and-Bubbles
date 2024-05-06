import { DataService } from './../../services/data.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { PanelService } from '../../services/panel service/panel-service';
import { MatDialog } from '@angular/material/dialog';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-appointment-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
  ],
  templateUrl: './appointment-page.component.html',
  styleUrl: './appointment-page.component.scss',
})
export class AppointmentPageComponent implements OnInit {
  appointment: any;

  constructor(
    public DataService: DataService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.DataService.currentAppointment$.subscribe((app) => {
      this.appointment = app;
    });

    this.activatedRoute.paramMap.subscribe((paraMap) => {
      let id = paraMap.get('id')!;
      this.DataService.getAppointmentById(id);
    });
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  getObjectValue(obj: any): any[] {
    return Object.values(obj);
  }

  getNumOfClients(obj: [any]) {
    let obj1 = Object.values(obj);
    let obj2 = Object.values(obj1);

    return obj2[0].length;
  }

  async openPanel() {
    const dialogRef = this.dialog.open(PanelService, {
      data: {
        title: 'Send Clients SMS',
        confirmMsg: `Are you sure you want to send a SMS message to all clients? <br><br>This will send a text message with a date of <b>${this.DataService.formatDate(
          this.appointment.date,
          false
        )}</b> to the clients in the following service areas: <br><br><b>${this.appointment.meta
          .toString()
          .replaceAll(',', ', ')}</b>`,
        subMsg: 'This action cannot be undone.',
        btnTitle: 'Confirm',
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result) {
      let date = this.DataService.formatDate(this.appointment.date, true);
      this.DataService.sendText(this.appointment.meta, date).subscribe(
        (res) => {
          console.log({ res });
        }
      );
    }
  }
}
