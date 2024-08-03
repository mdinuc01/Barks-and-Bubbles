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
import { lastValueFrom, tap } from 'rxjs';
import { AppointmentSchedulerComponent } from '../appointment-scheduler/appointment-scheduler.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { AppointmentClientListComponent } from '../appointment-client-list/appointment-client-list.component';

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
    AppointmentClientListComponent,
  ],
})
export class AppointmentPageComponent implements OnInit {
  appointment: any;
  loadingReplies = false;
  loadCount = 0;
  panelState: string = 'closed';
  isPanelOpen: boolean = false;
  showErrorPanel = false;
  failedUnsentMessage: any;
  showErrorBtn = false;
  unsentContactMsg: errorContact[] = [];
  messageEditor: [] = [];

  constructor(
    public DataService: DataService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private ToastService: ToastService
  ) {}

  ngOnInit(): void {
    this.DataService.messageBuilder$.subscribe((res) => {
      if (res) this.messageEditor = res.data;
    });

    this.DataService.currentAppointment$.subscribe((res) => {
      if (res.data) {
        this.appointment = res.data;
        this.loadingReplies = false;

        if (res.message == 'Messages sent') {
          this.loadReplies();
          this.ToastService.showSuccess('Messages Sent Successfully!');
        }

        if (res.message == 'Found Replies') {
          this.ToastService.showSuccess('Replies Loaded Successfully!');
        }

        if (
          this.appointment &&
          this.appointment.app &&
          this.appointment.app.replies
        )
          this.getUsersWithoutMessage();
      }

      this.DataService.getMessages();
    });

    this.activatedRoute.paramMap.subscribe((paraMap) => {
      let id = paraMap.get('id')!;
      this.DataService.getAppointmentById(id);
      this.DataService.getPetsWithLocations(id);
    });
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
        isMsgEditor: false,
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

  async openMsgPanel() {
    const dialogRef = this.dialog.open(PanelService, {
      data: {
        title: 'Edit Messages',
        confirmMsg:
          'Edit the messages that are sent out to your clients below:',
        subMsg: '',
        btnTitle: 'Save',
        isMsgEditor: true,
        data: this.messageEditor,
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());
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

  getUsersWithoutMessage(): any {
    const pattern = /^(?!.*\d).*$|^$/;
    let errorsFound = [];
    if (this.appointment.app.messages && this.appointment.app.messages.sentTo) {
      errorsFound = this.appointment.app.messages.sentTo.filter(
        (contact: { contactMethod: string }) =>
          pattern.test(contact.contactMethod)
      );
    }

    if (errorsFound.length > 1) {
      this.showErrorBtn = true;
    }

    this.unsentContactMsg = errorsFound;
  }

  getErrCount(client: { contactMethod: string }) {
    return this.unsentContactMsg.filter(
      (c) => c.contactMethod == client.contactMethod
    ).length;
  }
}

interface errorContact {
  petParentName: string;
  petName: string;
  contactMethod: string;
}
