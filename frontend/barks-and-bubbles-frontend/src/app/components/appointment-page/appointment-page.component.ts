import { ToastService } from './../../services/toast.service';
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
import { AppointmentSchedulerComponent } from '../appointment-scheduler/appointment-scheduler.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-appointment-page',
  standalone: true,
  templateUrl: './appointment-page.component.html',
  styleUrl: './appointment-page.component.scss',

  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatBadgeModule,
    MatTabsModule,
    AppointmentSchedulerComponent,
  ],
})
export class AppointmentPageComponent implements OnInit {
  appointment: any;
  loadingReplies = false;
  loadCount = 0;
  panelState: string = 'closed';
  isPanelOpen: boolean = false;
  showErrorPanel = false;

  constructor(
    public DataService: DataService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private ToastService: ToastService
  ) {}

  ngOnInit(): void {
    this.DataService.currentAppointment$.subscribe((res) => {
      console.log({ res });
      if (res.data) {
        this.appointment = { ...res.data };
        this.loadingReplies = false;

        if (res.message == 'Messages sent') {
          this.loadReplies();
          this.ToastService.showSuccess('Messages Sent Successfully!');
        }

        if (res.message == 'Found Replies') {
          this.ToastService.showSuccess('Replies Loaded Successfully!');
        }
      }
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
          this.appointment.app.date,
          false,
          true
        )}</b> to the clients in the following service areas: <br><br><b>${this.appointment.meta
          .toString()
          .replaceAll(',', ', ')}</b>`,
        subMsg: 'This action cannot be undone.',
        btnTitle: 'Confirm',
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result) {
      let date = this.DataService.formatDate(
        this.appointment.app.date,
        true,
        false
      );

      this.DataService.sendText(
        this.appointment.meta,
        date,
        this.appointment.app._id
      );
    }
  }

  loadReplies() {
    this.loadingReplies = true;

    this.DataService.loadReplies(
      this.appointment.app._id,
      this.appointment.app.messages.sentDate
    );
  }

  hasMessageSent(): Boolean {
    if (this.appointment && this.appointment.app)
      return this.appointment.app?.messages?.sentDate != null || false;
    else return false;
  }

  showCard(message: any, client: any) {
    if (!message.to || !message.from) return;

    let to = message.to.replaceAll('+1', '');
    let from = message.from.replaceAll('+1', '');

    if (message.direction.includes('outbound') && client.contactMethod == to)
      return true;
    else if (
      message.direction.includes('inbound') &&
      client.contactMethod == from
    )
      return true;
    else return false;
  }

  formatStatus(status: string): string {
    if (status.length === 0) {
      return status; // Return the word unchanged if it's empty
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  togglePanel(event: Event, outside: boolean) {
    event.stopPropagation();
    if (this.panelState == 'closed' && outside) return;
    this.panelState = this.panelState === 'open' ? 'closed' : 'open';
    this.isPanelOpen = !this.isPanelOpen;
  }

  getFailedMessages() {
    if (this.appointment.app && this.appointment.app.replies)
      return this.appointment.app.replies.filter(
        (r: { status: string }) => r.status == 'failed'
      );
  }

  formatNumber(number: string) {
    return `(${number.substring(2, 5)}) ${number.substring(
      5,
      8
    )}-${number.substring(8, 12)}`;
  }
}
