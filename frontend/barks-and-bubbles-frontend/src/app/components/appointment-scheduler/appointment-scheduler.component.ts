import { PanelService } from './../../services/panel service/panel-service';
import { DataService } from './../../services/data.service';
import { ToastService } from './../../services/toast.service';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { lastValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-appointment-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './appointment-scheduler.component.html',
  styleUrl: './appointment-scheduler.component.scss',
})
export class AppointmentSchedulerComponent implements OnInit {
  hours: string[] = [];
  @Input() clients!: any[];
  @Input() replies!: any[];
  @Input() appId!: string;
  currentReply: any;
  resetTime = false;
  resetSave = false;

  constructor(
    private ToastService: ToastService,
    private DataService: DataService,
    private dialog: MatDialog
  ) {
    // Generate hours from 12:00 AM to 11:00 PM
    for (let i = 7; i < 12; i++) {
      this.hours.push(`${i === 0 ? 12 : i}:00 AM`);
    }
    for (let i = 12; i < 22; i++) {
      this.hours.push(`${i === 12 ? 12 : i - 12}:00 PM`);
    }
  }
  ngOnInit(): void {
    console.log({ a: this.appId, c: this.clients });

    this.DataService.currentAppointment$.subscribe((res) => {
      if (res.message == 'Replies Saved' && this.resetSave) {
        this.ToastService.showSuccess('Route Saved Successfully!');
        this.resetSave = false;
      }

      if (res.message == 'Replies Saved' && this.resetTime)
        this.ToastService.showSuccess('Appointments Reset Successfully!');

      if (res.message == 'Replies sent')
        this.ToastService.showSuccess('Replies sent Successfully!');

      this.resetTime = false;
    });
  }

  filter(arr: any[], filterParam: any) {
    return arr.filter((a) => a.direction == 'inbound' && a.time == filterParam);
  }

  getClientName(phoneNumber: string) {
    phoneNumber = phoneNumber.substring(2);
    let client = this.clients.find((c) => c.contactMethod == phoneNumber);

    return client.petName;
  }

  onDragStart(reply: any) {
    this.currentReply = reply;
  }

  onDrop(event: any, time: any) {
    event.preventDefault();
    let findNumber = this.currentReply.from.toString().substring(2);
    console.log({ findNumber });
    let reply = this.replies.find((r) => r.sid == this.currentReply.sid);
    let client = this.clients.find(
      (client) => client.contactMethod == findNumber
    );
    if (reply != undefined && client.petParentName) {
      reply.time = time;
      reply.name = client.petParentName;
    }

    this.currentReply = null;
  }

  onDragOver(event: any) {
    event.preventDefault();
  }

  saveReplies(enableToast: boolean) {
    this.DataService.saveTimes(this.appId, this.replies);
    this.resetSave = enableToast;
  }

  resetAppTimes() {
    this.replies = this.replies.map((r) => {
      r.time = null;
      return r;
    });

    this.resetTime = true;
    this.saveReplies(false);
  }

  async openPanel() {
    this.saveReplies(false);

    const dialogRef = this.dialog.open(PanelService, {
      data: {
        title: 'Send Replies to Clients',
        confirmMsg: `Are you sure you want to out all replies? This will send a reply message to each of the replies currently scheduled. 
        <br><br>The time for each reply will be the start for the range. If a reply was scheduled at 8:00 AM, then 8:00 AM - 9:00 AM will be used in the message.`,
        subMsg: 'This action cannot be undone.',
        btnTitle: 'Confirm',
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result) {
      this.DataService.sendReplies(this.appId);
    }
  }
}
