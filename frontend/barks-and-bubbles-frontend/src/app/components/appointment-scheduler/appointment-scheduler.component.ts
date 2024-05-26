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
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-appointment-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatExpansionModule,
  ],
  templateUrl: './appointment-scheduler.component.html',
  styleUrl: './appointment-scheduler.component.scss',
})
export class AppointmentSchedulerComponent implements OnInit {
  hours: string[] = [];
  @Input() clients!: any[];
  @Input() replies!: any[];
  @Input() appId!: string;

  colors: string[] = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#800000',
    '#008000',
    '#000080',
    '#808000',
    '#800080',
    '#008080',
    '#FF5733',
    '#33FF57',
    '#3357FF',
    '#FF33A1',
    '#A1FF33',
    '#FFAA33',
    '#33FFAA',
    '#AA33FF',
    '#FFA533',
    '#33FFA5',
    '#5733FF',
    '#A533FF',
    '#FF33F5',
    '#33F5FF',
    '#F5FF33',
    '#33FF33',
    '#FF5733',
    '#FF3333',
  ];

  currentReply: any;
  resetTime = false;
  resetSave = false;
  locations: string[] = [];

  constructor(
    private ToastService: ToastService,
    private DataService: DataService,
    private dialog: MatDialog
  ) {
    // Generate hours from 12:00 AM to 11:00 PM
    for (let i = 7; i < 12; i++) {
      this.hours.push(`${i === 0 ? 12 : i}:00 AM`);
      this.hours.push(`${i === 0 ? 12 : i}:15 AM`);
      this.hours.push(`${i === 0 ? 12 : i}:30 AM`);
      this.hours.push(`${i === 0 ? 12 : i}:45 AM`);
    }
    for (let i = 12; i < 21; i++) {
      this.hours.push(`${i === 12 ? 12 : i - 12}:00 PM`);
      this.hours.push(`${i === 12 ? 12 : i - 12}:15 PM`);
      this.hours.push(`${i === 12 ? 12 : i - 12}:30 PM`);
      this.hours.push(`${i === 12 ? 12 : i - 12}:45 PM`);
    }
    this.hours.push(`9:00 PM`);
  }
  ngOnInit(): void {
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

    this.locations = this.getDistinctServiceAreas(this.clients);
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
    let reply = this.replies.find((r) => r.sid == this.currentReply.sid);
    let client = this.clients.find(
      (client) => client.contactMethod == findNumber
    );
    if (reply != undefined && client.petParentName) {
      reply.time = time;
      reply.petParentName = client.petParentName;
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

  getDistinctServiceAreas(objects: any[]): string[] {
    if (!objects || !objects.length) return [];
    const serviceAreaSet = new Set<string>();

    for (const obj of objects) {
      serviceAreaSet.add(obj.serviceArea);
    }

    return Array.from(serviceAreaSet);
  }
}
