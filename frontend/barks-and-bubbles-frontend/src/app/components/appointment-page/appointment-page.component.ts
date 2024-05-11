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
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { AppointmentSchedulerComponent } from '../appointment-scheduler/appointment-scheduler.component';

@Component({
  selector: 'app-appointment-page',
  standalone: true,
  templateUrl: './appointment-page.component.html',
  styleUrl: './appointment-page.component.scss',
  animations: [
    trigger('panelState', [
      state(
        'open',
        style({
          transform: 'translateX(0%)',
        })
      ),
      state(
        'closed',
        style({
          transform: 'translateX(100%)',
        })
      ),
      transition('open => closed', [animate('0.2s')]),
      transition('closed => open', [animate('0.2s')]),
    ]),
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    AppointmentSchedulerComponent,
  ],
})
export class AppointmentPageComponent implements OnInit {
  appointment: any;
  loadingReplies = false;
  loadCount = 0;
  panelState: string = 'closed';
  isPanelOpen: boolean = false;

  constructor(
    public DataService: DataService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private ToastService: ToastService
  ) {}

  ngOnInit(): void {
    this.DataService.currentAppointment$.subscribe((app) => {
      this.appointment = app;
      this.loadingReplies = false;
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
        this.appointment.date,
        true,
        false
      );

      await this.DataService.sendText(
        this.appointment.meta,
        date,
        this.appointment.id
      );
    }
  }

  loadReplies() {
    this.loadingReplies = true;

    this.DataService.loadReplies(
      this.appointment.id,
      this.appointment.messages.sentDate
    );
  }

  hasMessageSent(): Boolean {
    if (this.appointment.messages)
      return Object.keys(this.appointment.messages).length > 0;
    else return false;
  }

  showCard(message: any, client: any) {
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

  messageSuccess() {
    this.ToastService.showSuccess('Messages Sent! Please load messages!');
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

  receiveReplies(data: any) {
    console.log({ data });
  }
}
